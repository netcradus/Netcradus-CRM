const axios = require("axios");
const OrgZohoToken = require("../models/OrgZohoToken");
const { encrypt, decrypt } = require("../utils/encryption");

const ZOHO_ACCOUNTS_BASE = "https://accounts.zoho.eu";
const REFRESH_GRACE_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const OAUTH_SCOPES = [
  "ZohoMail.messages.ALL",
  "ZohoMail.folders.ALL",
  "ZohoMail.accounts.ALL",
  "ZohoMail.attachments.ALL",
];

function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    client_id: process.env.ZOHO_CLIENT_ID,
    redirect_uri: process.env.ZOHO_REDIRECT_URI,
    scope: OAUTH_SCOPES.join(","),
  });

  if (state) {
    params.set("state", state);
  }

  return `${ZOHO_ACCOUNTS_BASE}/oauth/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code, connectedBy) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    redirect_uri: process.env.ZOHO_REDIRECT_URI,
  });

  const { data } = await axios.post(`${ZOHO_ACCOUNTS_BASE}/oauth/v2/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const encryptedAccess = encrypt(data.access_token);
  const encryptedRefresh = encrypt(data.refresh_token);
  const expiresInSeconds = Number(data.expires_in_sec || data.expires_in || 3600);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return OrgZohoToken.findOneAndUpdate(
    {},
    {
      $set: {
        accessToken: encryptedAccess.encrypted,
        refreshToken: encryptedRefresh.encrypted,
        encryptionIv: encryptedAccess.iv,
        refreshEncryptionIv: encryptedRefresh.iv,
        accessAuthTag: encryptedAccess.authTag,
        refreshAuthTag: encryptedRefresh.authTag,
        expiresAt,
        scope: data.scope || OAUTH_SCOPES.join(","),
        connectedBy,
        connectedAt: new Date(),
        lastRefreshedAt: new Date(),
        isActive: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function refreshAccessToken() {
  const tokenDoc = await OrgZohoToken.findOne({ isActive: true });
  if (!tokenDoc) {
    const error = new Error("Zoho organization is not connected.");
    error.code = "ZOHO_NOT_CONNECTED";
    throw error;
  }

  const refreshToken = decrypt(
    tokenDoc.refreshToken,
    tokenDoc.refreshEncryptionIv,
    tokenDoc.refreshAuthTag
  );

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
  });

  const { data } = await axios.post(`${ZOHO_ACCOUNTS_BASE}/oauth/v2/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const encryptedAccess = encrypt(data.access_token);
  const expiresInSeconds = Number(data.expires_in_sec || data.expires_in || 3600);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  tokenDoc.accessToken = encryptedAccess.encrypted;
  tokenDoc.encryptionIv = encryptedAccess.iv;
  tokenDoc.accessAuthTag = encryptedAccess.authTag;
  tokenDoc.expiresAt = expiresAt;
  tokenDoc.lastRefreshedAt = new Date();
  tokenDoc.scope = data.scope || tokenDoc.scope;
  tokenDoc.isActive = true;
  await tokenDoc.save();

  return data.access_token;
}

async function getValidAccessToken() {
  const tokenDoc = await OrgZohoToken.findOne({ isActive: true });
  if (!tokenDoc) {
    const error = new Error("Zoho organization is not connected.");
    error.code = "ZOHO_NOT_CONNECTED";
    throw error;
  }

  if (!tokenDoc.expiresAt || tokenDoc.expiresAt.getTime() < Date.now() + REFRESH_GRACE_MS) {
    return refreshAccessToken();
  }

  return decrypt(tokenDoc.accessToken, tokenDoc.encryptionIv, tokenDoc.accessAuthTag);
}

async function isConnected() {
  const tokenDoc = await OrgZohoToken.findOne({ isActive: true }).select("_id").lean();
  return Boolean(tokenDoc);
}

async function revokeConnection() {
  const tokenDoc = await OrgZohoToken.findOne({ isActive: true });
  if (!tokenDoc) {
    return false;
  }

  try {
    const refreshToken = decrypt(
      tokenDoc.refreshToken,
      tokenDoc.refreshEncryptionIv,
      tokenDoc.refreshAuthTag
    );

    const params = new URLSearchParams({ token: refreshToken });
    await axios.post(`${ZOHO_ACCOUNTS_BASE}/oauth/v2/token/revoke?${params.toString()}`, null, {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.warn("[Zoho Mail] Revoke call failed, marking connection inactive locally.");
  } finally {
    tokenDoc.isActive = false;
    await tokenDoc.save();
  }

  return true;
}

module.exports = {
  OAUTH_SCOPES,
  exchangeCodeForTokens,
  getAuthorizationUrl,
  getValidAccessToken,
  isConnected,
  refreshAccessToken,
  revokeConnection,
};
