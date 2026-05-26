const crypto = require("crypto");
const OrgZohoToken = require("../models/OrgZohoToken");
const User = require("../models/User");
const ZohoAccount = require("../models/ZohoAccount");
const zohoAuthService = require("../services/zohoAuthService");
const zohoMailService = require("../services/zohoMailService");

const COOKIE_NAME = "zoho_oauth_state";
const COOKIE_TTL_MS = 10 * 60 * 1000;

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
  const state = crypto.randomBytes(24).toString("hex");
  const cookieValue = createSignedStateCookie({
    state,
    connectedBy: req.user.id,
    expiresAt: Date.now() + COOKIE_TTL_MS,
  });

  res.cookie(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: String(process.env.NODE_ENV).toLowerCase() === "production",
    maxAge: COOKIE_TTL_MS,
    path: "/api/zoho",
  });

  return res.json({ authUrl: zohoAuthService.getAuthorizationUrl(state) });
}

async function handleCallback(req, res) {
  const { code, state } = req.query;
  const stateCookie = parseCookieValue(getCookie(req, COOKIE_NAME));
  res.clearCookie(COOKIE_NAME, { path: "/api/zoho" });

  if (!code) {
    return res.redirect("/settings/zoho?error=auth_failed");
  }

  if (
    !stateCookie ||
    stateCookie.expiresAt < Date.now() ||
    stateCookie.state !== state ||
    !stateCookie.connectedBy
  ) {
    return res.redirect("/settings/zoho?error=invalid_state");
  }

  try {
    await zohoAuthService.exchangeCodeForTokens(code, stateCookie.connectedBy);
    return res.redirect("/settings/zoho?connected=true");
  } catch (error) {
    return res.redirect("/settings/zoho?error=auth_failed");
  }
}

async function disconnectZoho(req, res) {
  try {
    await zohoAuthService.revokeConnection();
    await Promise.all([
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Zoho Mail.",
    });
  }
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
    return res.json({
      connected: true,
      lastRefreshedAt: connection.lastRefreshedAt,
      accountCount: (await zohoMailService.listAccounts()).length,
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
