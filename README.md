# Netcradus CRM - Backend

## Modules
- Projects: super-user portfolio records for company projects, sensitive field verification, Drive document attachments, and showcase visibility controls.
- Showcase: authenticated in-app presentation view for portfolio projects, available at `/showcase` with no public sharing URL.

## Google Drive Setup (OAuth2)

The system uses Google Drive for document storage. To ensure maximum storage quota and reliability, we use the **OAuth2 Refresh Token** method (Personal/Workspace account).

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable **Google Drive API**.
4. Configure the **OAuth Consent Screen** (Internal or External/Testing). Add yourself as a test user if External.
5. Create **OAuth 2.0 Client IDs** (Application type: "Web application").
6. Note your **Client ID** and **Client Secret**.

### 2. Generate Refresh Token
1. Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2. Click the gear icon (Settings) and check **"Use your own OAuth credentials"**. Enter your Client ID and Client Secret.
3. In the "Select & authorize APIs" box, find **Drive API v3** and select `https://www.googleapis.com/auth/drive`.
4. Click **Authorize APIs** and log in to your Google account.
5. In Step 2, click **Exchange authorization code for tokens**.
6. Note the **Refresh Token**.

### 3. Configuration
Update your `server/.env` file:
- `GOOGLE_CLIENT_ID`: From step 1.
- `GOOGLE_CLIENT_SECRET`: From step 1.
- `GOOGLE_REFRESH_TOKEN`: From step 2.
- `DRIVE_FOLDER_ID`: Create a folder in your Drive and copy its ID from the URL.

> [!CAUTION]
> **Refresh Token Longevity**: Refresh tokens for "Testing" apps expire after 7 days. Ensure your Google Cloud Project is set to "In Production" or use a Google Workspace account to avoid constant regeneration.

## Maintenance & Troubleshooting

### Geolocation Failures
The system uses `ip-api.com` for geolocation during attendance punch-in. If the service is slow or returns `ECONNRESET`, the system will:
1. Wait for up to 3 seconds.
2. Log a warning.
3. Proceed with the punch-in using the raw IP and `null` coordinates.
Attendance is **never** blocked by geolocation failures.

### Storage Data Cleanup
If you have `Document` records created before moving to Shared Drives, they may have invalid or non-functional `driveFileId`s.
- **Action**: Use the Super User admin panel to soft-delete these records.
- **Migration**: If some users failed to provision correctly, re-run the migration script:
  ```bash
  cd server
  node scripts/migrateExistingUserStorage.js
  ```
  Ensure `DRIVE_FOLDER_ID` and `DRIVE_SHARED_ID` are correctly set before running.
