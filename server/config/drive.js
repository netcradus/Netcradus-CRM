const { google } = require('googleapis');

/**
 * Initializes the Google Drive API client using a Service Account.
 * Credentials are read from GOOGLE_SERVICE_ACCOUNT_KEY_JSON (full JSON as single-line string).
 * Uses the full 'drive' scope to support streaming files uploaded by the service account.
 *
 * NOTE: 'drive.file' scope is intentionally NOT used — it would prevent the server from
 * streaming files that were already uploaded in previous sessions.
 */
const initDrive = () => {
  try {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
    if (!raw) {
      console.error('[Drive] GOOGLE_SERVICE_ACCOUNT_KEY_JSON is not set in environment.');
      return null;
    }

    const credentials = JSON.parse(raw);

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const driveClient = google.drive({ version: 'v3', auth });
    console.log('[Drive] Google Drive client initialized successfully.');
    return driveClient;
  } catch (error) {
    console.error('[Drive] Initialization failed:', error.message);
    return null;
  }
};

// Export as singleton — initialized once at startup
module.exports = initDrive();
