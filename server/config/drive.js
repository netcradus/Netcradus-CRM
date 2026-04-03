const { google } = require('googleapis');

/**
 * Initializes the Google Drive API client using a Service Account.
 * Credentials should be stored in GOOGLE_SERVICE_ACCOUNT_KEY_JSON as a single-line JSON string.
 */
const initDrive = () => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Google Drive Initialization Error:', error.message);
    return null;
  }
};

module.exports = initDrive();
