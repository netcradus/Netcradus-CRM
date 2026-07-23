import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";

const OnboardingContext = createContext(null);
const DEFAULT_GRACE_DAYS = Number(process.env.REACT_APP_ONBOARDING_GRACE_PERIOD_DAYS || 3);
const ONBOARDING_STATUS_TIMEOUT_MS = Number(process.env.REACT_APP_ONBOARDING_STATUS_TIMEOUT_MS || 5000);
const ONBOARDING_CACHE_KEY = "onboardingStatusCache";
const ENFORCE_ONBOARDING_REDIRECT = String(process.env.REACT_APP_ENFORCE_ONBOARDING_REDIRECT || "false").toLowerCase() === "true";

const getCachedStatus = () => {
  try {
    const raw = localStorage.getItem(ONBOARDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      status: parsed.status || "unknown",
      hasRecord: Boolean(parsed.hasRecord),
      completedAt: parsed.completedAt || null,
      daysRemaining: Number(parsed.daysRemaining ?? DEFAULT_GRACE_DAYS),
      loading: false,
    };
  } catch {
    return null;
  }
};

const persistStatus = (nextState) => {
  try {
    localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify({
      status: nextState.status,
      hasRecord: nextState.hasRecord,
      completedAt: nextState.completedAt,
      daysRemaining: nextState.daysRemaining,
    }));
  } catch {}
};

export function OnboardingProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState(() => getCachedStatus() || {
    status: "unknown",
    hasRecord: false,
    completedAt: null,
    daysRemaining: DEFAULT_GRACE_DAYS,
    loading: true,
  });

  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const skipOnboarding = localStorage.getItem("skipOnboarding") === "true";
  // Partner accounts skip employee onboarding entirely.
  const isExempt = role === "super_user" || role === "partner" || skipOnboarding;

  const refreshStatus = useCallback(async () => {
    if (isExempt) {
      const nextState = {
        status: "complete",
        hasRecord: false,
        completedAt: null,
        daysRemaining: DEFAULT_GRACE_DAYS,
        loading: false,
      };
      persistStatus(nextState);
      setState(nextState);
      return;
    }

    try {
      setState((current) => ({ ...current, loading: true }));
      const response = await axios.get(apiUrl("/api/onboarding/status"), {
        timeout: ONBOARDING_STATUS_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const nextState = {
        status: response.data?.status || "pending",
        hasRecord: Boolean(response.data?.hasRecord),
        completedAt: response.data?.completedAt || null,
        daysRemaining: Number(response.data?.daysRemaining ?? DEFAULT_GRACE_DAYS),
        loading: false,
      };
      persistStatus(nextState);
      setState(nextState);
    } catch (error) {
      const cached = getCachedStatus();
      setState(cached || {
        status: "unknown",
        hasRecord: false,
        completedAt: null,
        daysRemaining: DEFAULT_GRACE_DAYS,
        loading: false,
      });
    }
  }, [isExempt]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          ENFORCE_ONBOARDING_REDIRECT &&
          error.response?.status === 403 &&
          error.response?.data?.code === "ONBOARDING_REQUIRED" &&
          location.pathname !== "/onboarding"
        ) {
          navigate("/onboarding", { replace: true });
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [location.pathname, navigate]);

  const value = useMemo(
    () => ({
      ...state,
      gracePeriodExpired: !isExempt && state.status !== "complete" && state.status !== "unknown" && state.daysRemaining <= 0,
      isExempt,
      refreshStatus,
      markComplete: () => {
        const nextState = {
          ...state,
          status: "complete",
          hasRecord: true,
          completedAt: new Date().toISOString(),
          loading: false,
        };
        persistStatus(nextState);
        setState(nextState);
      },
    }),
    [isExempt, refreshStatus, state]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider.");
  }

  return context;
}
