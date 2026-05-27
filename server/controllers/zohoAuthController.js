const crypto = require("crypto");
const OrgZohoToken = require("../models/OrgZohoToken");
const User = require("../models/User");
const ZohoAccount = require("../models/ZohoAccount");
const zohoAuthService = require("../services/zohoAuthService");
const zohoMailService = require("../services/zohoMailService");

const COOKIE_NAME = "zoho_oauth_state";
const COOKIE_TTL_MS = 10 * 60 * 1000;

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getRequestFrontendOrigin(req) {
  const origin = req.get("origin");
  if (origin && isValidHttpUrl(origin)) {
    return origin;
  }

  const referer = req.get("referer");
  if (!referer || !isValidHttpUrl(referer)) {
    return null;
  }

  const refererUrl = new URL(referer);
  return refererUrl.origin;
}

function getFrontendRedirectUrl(query, stateCookie = null) {
  const frontendBaseUrl =
    stateCookie?.frontendOrigin ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:3000";

  return `${frontendBaseUrl.replace(/\/+$/, "")}/settings/zoho?${query}`;
}

function createSignedStateCookie(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function parseCookieValue(rawValue) {
  if (!rawValue) return null;

  const [encodedPayload, signature] = String(rawValue).split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getCookie(req, name) {
  const rawCookie = req.headers.cookie || "";
  return rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split("="))
    .find(([key]) => key === name)?.[1];
}

async function getConnectionStatus(req, res) {
  const connection = await OrgZohoToken.findOne({ isActive: true })
    .populate("connectedBy", "_id name email")
    .lean();

  if (!connection) {
    return res.json({
      connected: false,
      connectedAt: null,
      connectedBy: null,
      lastRefreshedAt: null,
      scope: null,
    });
  }

  return res.json({
    connected: true,
    connectedAt: connection.connectedAt,
    connectedBy: connection.connectedBy,
    lastRefreshedAt: connection.lastRefreshedAt,
    scope: connection.scope,
  });
}

async function initiateOAuth(req, res) {
  const stateToken = createSignedStateCookie({
    nonce: crypto.randomBytes(24).toString("hex"),
    connectedBy: req.user.id,
    frontendOrigin: getRequestFrontendOrigin(req),
    expiresAt: Date.now() + COOKIE_TTL_MS,
  });

  res.cookie(COOKIE_NAME, stateToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: String(process.env.NODE_ENV).toLowerCase() === "production",
    maxAge: COOKIE_TTL_MS,
    path: "/api/zoho",
  });

  return res.json({ authUrl: zohoAuthService.getAuthorizationUrl(stateToken) });
}

async function handleCallback(req, res) {
  const { code, state } = req.query;
  const queryState = parseCookieValue(state);
  const cookieState = parseCookieValue(getCookie(req, COOKIE_NAME));
  const statePayload = queryState || cookieState;
  res.clearCookie(COOKIE_NAME, { path: "/api/zoho" });

  if (!code) {
    return res.redirect(getFrontendRedirectUrl("error=auth_failed", statePayload));
  }

  if (
    !statePayload ||
    statePayload.expiresAt < Date.now() ||
    !statePayload.connectedBy ||
    (!queryState && cookieState?.state && cookieState.state !== state)
  ) {
    return res.redirect(getFrontendRedirectUrl("error=invalid_state", statePayload));
  }

  try {
    await zohoAuthService.exchangeCodeForTokens(code, statePayload.connectedBy);
    return res.redirect(getFrontendRedirectUrl("connected=true", statePayload));
  } catch (error) {
    console.error("[Zoho Mail] OAuth callback failed:", error.code || error.message);
    return res.redirect(getFrontendRedirectUrl("error=auth_failed", statePayload));
  }
}

async function disconnectZoho(req, res) {
  try {
    await zohoAuthService.revokeConnection();
  } catch (error) {
    console.warn("[Zoho Mail] Local token revoke failed, continuing disconnect cleanup:", error.message);
  }

  await Promise.all([
    OrgZohoToken.updateMany({}, { $set: { isActive: false } }, { runValidators: false }),
    User.updateMany(
      {},
      {
        $set: {
          zohoConnected: false,
          zohoAccountId: null,
          zohoEmail: null,
          zohoConnectedAt: null,
        },
      }
    ),
    ZohoAccount.updateMany(
      {},
      {
        $set: {
          isActive: false,
        },
      }
    ),
  ]);

  return res.json({ success: true });
}

async function getZohoHealth(req, res) {
  const connection = await OrgZohoToken.findOne({ isActive: true }).lean();
  if (!connection) {
    return res.json({
      connected: false,
      lastRefreshedAt: null,
      accountCount: 0,
    });
  }

  try {
    const personalAccounts = await zohoMailService.listAccounts().catch(() => []);
    const organizationAccounts = await zohoMailService.listOrganizationAccounts().catch(() => []);
    const availableAccounts = await zohoMailService.listAvailableAccounts();

    return res.json({
      connected: true,
      lastRefreshedAt: connection.lastRefreshedAt,
      accountCount: availableAccounts.length,
      personalAccountCount: personalAccounts.length,
      organizationAccountCount: organizationAccounts.length,
    });
  } catch (error) {
    if (error.code === "ZOHO_API_ERROR" || error.code === "ZOHO_TIMEOUT" || error.code === "ZOHO_AUTH_EXPIRED") {
      return res.status(error.code === "ZOHO_TIMEOUT" ? 504 : 503).json({
        connected: false,
        lastRefreshedAt: connection.lastRefreshedAt,
        accountCount: 0,
      });
    }

    return res.status(503).json({
      connected: false,
      lastRefreshedAt: connection.lastRefreshedAt,
      accountCount: 0,
    });
  }
}

module.exports = {
  disconnectZoho,
  getConnectionStatus,
  getZohoHealth,
  handleCallback,
  initiateOAuth,
};
