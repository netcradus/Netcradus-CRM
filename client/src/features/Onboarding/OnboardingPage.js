import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";
import useOnboarding from "./useOnboarding";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";

function OnboardingPage() {
  const navigate = useNavigate();
  const { status, loading, refreshStatus, markComplete } = useOnboarding();
  const [record, setRecord] = useState(null);
  const [step, setStep] = useState(1);
  const [completeState, setCompleteState] = useState(null);

  const loadRecord = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl("/api/onboarding/my-record"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRecord(response.data?.data || null);
    } catch (error) {
      setRecord(null);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (completeState) {
      return;
    }

    if (status === "complete") {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (status === "step1_complete") {
      setStep(2);
      loadRecord();
      return;
    }

    setStep(1);
  }, [completeState, loadRecord, navigate, status]);

  const handleStep1Success = async () => {
    await refreshStatus();
    await loadRecord();
    setStep(2);
  };

  const handleStep2Success = (payload) => {
    setCompleteState(payload);
    markComplete();
  };

  if (completeState) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-success-card">
          <h1>Onboarding Complete</h1>
          <p>Your Employment Agreement has been signed. A copy has been sent to {completeState.personalEmail}.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-loader">Loading onboarding...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-page">
        <header className="onboarding-page__header">
          <div className="onboarding-page__brand">
            <span className="onboarding-page__logo">Netcradus</span>
            <p>Employee onboarding portal</p>
          </div>
          <div className="onboarding-page__progress">Step {step} of 2</div>
        </header>

        <div className="onboarding-page__body">
          {step === 1 ? (
            <OnboardingStep1 initialData={record} onSuccess={handleStep1Success} />
          ) : (
            <OnboardingStep2 record={record} onSuccess={handleStep2Success} />
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
