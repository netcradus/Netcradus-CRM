const { isDriveEnabled } = require('../utils/featureFlags');

/**
 * Initializes the Google Drive API client using OAuth2 with Refresh Tokens.
 * This is the preferred method for personal accounts and bypasses service account quota limits.
 */
const initDrive = () => {
  try {
    if (!isDriveEnabled()) {
      console.warn('[Drive] Maintenance mode enabled. Drive features are unavailable.');
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn('[Drive] ⚠️ OAuth2 credentials missing (CLIENT_ID, SECRET, or REFRESH_TOKEN). Drive features will be unavailable.');
      return null;
    }

    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground' // Common redirect URI for manual token generation
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    console.log('[Drive] Google Drive client initialized with OAuth2.');
    return driveClient;
  } catch (error) {
    console.error('[Drive] Initialization failed:', error.message);
    return null;
  }
};

const drive = initDrive();

/**
 * Diagnostic function to verify Drive connectivity.
 * Used for both technical health checks and server startup validation.
 */
const checkDriveHealth = async () => {
  if (!isDriveEnabled()) {
    return { status: 'maintenance', message: 'Drive is temporarily unavailable for maintenance.' };
  }

  if (!drive) {
    return { status: 'error', message: 'Drive client not initialized.' };
  }
  try {
    // Lightweight call to list the root folder
    await drive.files.list({ pageSize: 1 });
    return { status: 'ok' };
  } catch (error) {
    console.error('[Drive] Health Check Failed:', error.message);
    return { status: 'error', message: error.message };
  }
};

module.exports = {
  drive,
  checkDriveHealth,
};
