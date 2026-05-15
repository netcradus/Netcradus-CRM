import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";

const OnboardingContext = createContext(null);
const DEFAULT_GRACE_DAYS = Number(process.env.REACT_APP_ONBOARDING_GRACE_PERIOD_DAYS || 3);

export function OnboardingProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    status: "pending",
    hasRecord: false,
    completedAt: null,
    daysRemaining: DEFAULT_GRACE_DAYS,
    loading: true,
  });

  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const isExempt = role === "super_user";

  const refreshStatus = useCallback(async () => {
    if (isExempt) {
      setState({
        status: "complete",
        hasRecord: false,
        completedAt: null,
        daysRemaining: DEFAULT_GRACE_DAYS,
        loading: false,
      });
      return;
    }

    try {
      setState((current) => ({ ...current, loading: true }));
      const response = await axios.get(apiUrl("/api/onboarding/status"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      setState({
        status: response.data?.status || "pending",
        hasRecord: Boolean(response.data?.hasRecord),
        completedAt: response.data?.completedAt || null,
        daysRemaining: Number(response.data?.daysRemaining ?? DEFAULT_GRACE_DAYS),
        loading: false,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
      }));
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
      gracePeriodExpired: !isExempt && state.status !== "complete" && state.daysRemaining <= 0,
      isExempt,
      refreshStatus,
      markComplete: () =>
        setState((current) => ({
          ...current,
          status: "complete",
          completedAt: new Date().toISOString(),
          loading: false,
        })),
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
