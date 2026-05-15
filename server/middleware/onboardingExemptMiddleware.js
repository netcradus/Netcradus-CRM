const OnboardingRecord = require("../models/OnboardingRecord");

const onboardingExemptMiddleware = async (req, res, next) => {
  if (req.user?.role === "super_user") {
    return next();
  }

  if (req.onboardingChecked) {
    return next();
  }

  req.onboardingChecked = true;

  const record = await OnboardingRecord.findOne({
    userId: req.user.id,
    onboardingStatus: "complete",
  }).lean();

  if (record) {
    return next();
  }

  const graceDays = Number(process.env.ONBOARDING_GRACE_PERIOD_DAYS || 3);
  const gracePeriodMs = graceDays * 24 * 60 * 60 * 1000;
  const accountAge = Date.now() - new Date(req.user.createdAt).getTime();

  if (accountAge > gracePeriodMs) {
    return res.status(403).json({
      success: false,
      code: "ONBOARDING_REQUIRED",
      message: "Complete onboarding to access the CRM.",
      gracePeriodExpired: true,
    });
  }

  return next();
};

module.exports = onboardingExemptMiddleware;
