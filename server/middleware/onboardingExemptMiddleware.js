const OnboardingRecord = require("../models/OnboardingRecord");

const CACHE_TTL_COMPLETE_MS = Number(process.env.ONBOARDING_CACHE_TTL_COMPLETE_MS || 300000);
const CACHE_TTL_GRACE_MS = Number(process.env.ONBOARDING_CACHE_TTL_GRACE_MS || 60000);
const onboardingAccessCache = new Map();

const getCachedDecision = (userId) => {
  const key = String(userId);
  const cached = onboardingAccessCache.get(key);

  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    onboardingAccessCache.delete(key);
    return null;
  }

  return cached;
};

const setCachedDecision = (userId, decision, ttlMs) => {
  onboardingAccessCache.set(String(userId), {
    ...decision,
    expiresAt: Date.now() + ttlMs,
  });
};

const onboardingExemptMiddleware = async (req, res, next) => {
  // Partners are external accounts and skip employee onboarding enforcement entirely.
  if (req.user?.role === "super_user" || req.user?.role === "partner") {
    return next();
  }

  if (req.onboardingChecked) {
    return next();
  }

  req.onboardingChecked = true;
  const graceDays = Number(process.env.ONBOARDING_GRACE_PERIOD_DAYS || 3);
  const gracePeriodMs = graceDays * 24 * 60 * 60 * 1000;
  const accountAge = Date.now() - new Date(req.user.createdAt).getTime();
  const cachedDecision = getCachedDecision(req.user.id);

  if (cachedDecision?.allow) {
    return next();
  }

  if (cachedDecision && !cachedDecision.allow) {
    return res.status(403).json({
      success: false,
      code: "ONBOARDING_REQUIRED",
      message: "Complete onboarding to access the CRM.",
      gracePeriodExpired: true,
    });
  }

  try {
    const record = await OnboardingRecord.findOne({
      userId: req.user.id,
      onboardingStatus: "complete",
    })
      .select("_id")
      .maxTimeMS(1000)
      .lean();

    if (record) {
      setCachedDecision(req.user.id, { allow: true }, CACHE_TTL_COMPLETE_MS);
      return next();
    }
  } catch (error) {
    console.error("[Onboarding] Middleware check failed:", error.message);
    // Keep the CRM responsive if onboarding lookup is slow or temporarily unavailable.
    return next();
  }

  if (accountAge > gracePeriodMs) {
    setCachedDecision(req.user.id, { allow: false }, CACHE_TTL_GRACE_MS);
    return res.status(403).json({
      success: false,
      code: "ONBOARDING_REQUIRED",
      message: "Complete onboarding to access the CRM.",
      gracePeriodExpired: true,
    });
  }

  setCachedDecision(req.user.id, { allow: true }, CACHE_TTL_GRACE_MS);
  return next();
};

module.exports = onboardingExemptMiddleware;
