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
  "ZohoMail.organization.accounts.READ",
];

function createReconnectRequiredError(message = "Zoho Mail must be reconnected.") {
  const error = new Error(message);
  error.code = "ZOHO_RECONNECT_REQUIRED";
  return error;
}

function assertEncryptedTokenFields(tokenDoc, tokenType) {
  const fields =
    tokenType === "access"
      ? [tokenDoc.accessToken, tokenDoc.encryptionIv, tokenDoc.accessAuthTag]
      : [tokenDoc.refreshToken, tokenDoc.refreshEncryptionIv, tokenDoc.refreshAuthTag];

  if (fields.some((value) => !value)) {
    throw createReconnectRequiredError("Zoho token metadata is incomplete. Reconnect Zoho Mail.");
  }
}

function decryptAccessToken(tokenDoc) {
  assertEncryptedTokenFields(tokenDoc, "access");
  try {
    return decrypt(tokenDoc.accessToken, tokenDoc.encryptionIv, tokenDoc.accessAuthTag);
  } catch (error) {
    throw createReconnectRequiredError("Zoho access token could not be decrypted. Reconnect Zoho Mail.");
  }
}

function decryptRefreshToken(tokenDoc) {
  assertEncryptedTokenFields(tokenDoc, "refresh");
  try {
    return decrypt(tokenDoc.refreshToken, tokenDoc.refreshEncryptionIv, tokenDoc.refreshAuthTag);
  } catch (error) {
    throw createReconnectRequiredError("Zoho refresh token could not be decrypted. Reconnect Zoho Mail.");
  }
}

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

  if (!data.access_token) {
    const error = new Error("Zoho did not return an access token.");
    error.code = "ZOHO_OAUTH_FAILED";
    throw error;
  }

  const existingTokenDoc = await OrgZohoToken.findOne({});
  if (!data.refresh_token && !existingTokenDoc?.refreshToken) {
    const error = new Error("Zoho did not return a refresh token. Revoke the app in Zoho and connect again.");
    error.code = "ZOHO_REFRESH_TOKEN_MISSING";
    throw error;
  }

  const encryptedAccess = encrypt(data.access_token);
  const encryptedRefresh = data.refresh_token ? encrypt(data.refresh_token) : null;
  const expiresInSeconds = Number(data.expires_in_sec || data.expires_in || 3600);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const update = {
    accessToken: encryptedAccess.encrypted,
    encryptionIv: encryptedAccess.iv,
    accessAuthTag: encryptedAccess.authTag,
    expiresAt,
    scope: data.scope || OAUTH_SCOPES.join(","),
    connectedBy,
    connectedAt: new Date(),
    lastRefreshedAt: new Date(),
    isActive: true,
  };

  if (encryptedRefresh) {
    update.refreshToken = encryptedRefresh.encrypted;
    update.refreshEncryptionIv = encryptedRefresh.iv;
    update.refreshAuthTag = encryptedRefresh.authTag;
  }

  return OrgZohoToken.findOneAndUpdate(
    {},
    { $set: update },
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

  const refreshToken = decryptRefreshToken(tokenDoc);

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

  return decryptAccessToken(tokenDoc);
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
    const refreshToken = decryptRefreshToken(tokenDoc);

    const params = new URLSearchParams({ token: refreshToken });
    await axios.post(`${ZOHO_ACCOUNTS_BASE}/oauth/v2/token/revoke?${params.toString()}`, null, {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.warn("[Zoho Mail] Revoke call failed, marking connection inactive locally.");
  } finally {
    await OrgZohoToken.updateOne(
      { _id: tokenDoc._id },
      { $set: { isActive: false } },
      { runValidators: false }
    );
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
