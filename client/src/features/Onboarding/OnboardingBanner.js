import React from "react";
import { useNavigate } from "react-router-dom";
import useOnboarding from "./useOnboarding";

function OnboardingBanner() {
  const navigate = useNavigate();
  const { status, loading, gracePeriodExpired, daysRemaining, isExempt } = useOnboarding();

  if (loading || isExempt || status === "complete") {
    return null;
  }

  return (
    <div className={gracePeriodExpired ? "onboarding-banner onboarding-banner--error" : "onboarding-banner onboarding-banner--warning"}>
      <div className="onboarding-banner__content">
        <span>
          {gracePeriodExpired
            ? "Your access is restricted until you complete onboarding."
            : `Your onboarding is incomplete. ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining — Complete it to avoid losing access.`}
        </span>
        <button type="button" className="onboarding-banner__button" onClick={() => navigate("/onboarding")}>
          {gracePeriodExpired ? "Complete Now" : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}

export default OnboardingBanner;
