# Netcradus CRM - Backend

## Google Drive Setup (Shared Drive)

### Prerequisites
1. **Shared Drive**: You must create a Shared Drive in your Google Workspace.
2. **Service Account**: Ensure your Service Account has **Contributor** or **Content Manager** access to the Shared Drive.

### Configuration
Update your `.env` file with the following:
- `DRIVE_SHARED_ID`: The ID of the Shared Drive itself (found in the URL: `drive.google.com/drive/u/0/folders/SHARED_DRIVE_ID`).
- `DRIVE_FOLDER_ID`: The ID of a specific folder **inside** that Shared Drive where files will be stored. 
  > [!IMPORTANT]
  > Using a standard "My Drive" folder ID will **not** work, as Service Accounts have zero personal storage quota.

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
