const { Readable } = require('stream');
const { drive } = require('../config/drive');

/**
 * driveService — pure Google Drive API wrappers with no business logic.
 * All functions require the drive client to be initialized.
 */

/**
 * Helper to handle Google Drive API errors consistently.
 * Detects token expiry/invalid_grant and formats a 503 response for the client.
 */
const handleDriveError = (error, context = 'Drive Operation') => {
  const message = error.message || '';
  console.error(`[DriveService] ${context} error:`, message);

  // Detect token expiration or revoked access (typical of Refresh Token expiration after 6 months or password change)
  if (message.includes('invalid_grant') || message.includes('Token has been expired')) {
    const customError = new Error('File storage is temporarily unavailable. Please contact your administrator.');
    customError.status = 503;
    customError.code = 'DRIVE_AUTH_EXPIRED';
    throw customError;
  }

  // General error (maintain original status if present, or 500)
  const generalError = new Error(message || 'Internal Drive error.');
  generalError.status = error.status || 500;
  generalError.code = error.code || 'DRIVE_ERROR';
  throw generalError;
};

/**
 * Sanitizes a name for use in Google Drive (strips forbidden characters).
 * @param {string} name
 * @returns {string}
 */
const sanitizeDriveName = (name = '') => {
  return name
    .replace(/[/\\:*?"<>|]/g, '-')       // replace forbidden chars
    .replace(/[\u0000-\u001f]/g, '')       // strip control characters
    .trim()
    .substring(0, 100)                     // max 100 chars
    || 'untitled';
};

/**
 * Creates a folder in Google Drive.
 * @param {string} name - Display name for the folder
 * @param {string} parentFolderId - Drive ID of the parent folder
 * @returns {Promise<{ folderId: string, folderName: string }>}
 */
const createFolder = async (name, parentFolderId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    const safeName = sanitizeDriveName(name);

    const res = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });

    return {
      folderId: res.data.id,
      folderName: res.data.name,
    };
  } catch (err) {
    handleDriveError(err, 'createFolder');
  }
};

/**
 * Uploads a file buffer to a Drive folder.
 * @param {Buffer} buffer - File content
 * @param {string} fileName - Sanitized file name
 * @param {string} mimeType - MIME type of the file
 * @param {string} parentFolderId - Drive ID of the destination folder
 * @returns {Promise<{ driveFileId: string, driveViewLink: string, webContentLink: string }>}
 */
const uploadFile = async (buffer, fileName, mimeType, parentFolderId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    const safeName = sanitizeDriveName(fileName);
    const stream = Readable.from(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: [parentFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    return {
      driveFileId: res.data.id,
      driveViewLink: res.data.webViewLink || '',
      webContentLink: res.data.webContentLink || '',
    };
  } catch (err) {
    handleDriveError(err, 'uploadFile');
  }
};

/**
 * Permanently deletes a file (or folder) from Google Drive.
 * @param {string} driveFileId - Drive file/folder ID
 * @returns {Promise<boolean>} true on success
 */
const deleteFile = async (driveFileId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    await drive.files.delete({
      fileId: driveFileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (err) {
    if (err.code === 404) {
      console.warn(`[DriveService] File ${driveFileId} not found on Drive (already deleted?)`);
      return true;
    }
    handleDriveError(err, 'deleteFile');
  }
};

/**
 * Streams a file directly to an Express response object.
 * Sets the correct Content-Type header automatically.
 * @param {string} driveFileId - Drive file ID
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
const streamFile = async (driveFileId, res) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    // First fetch metadata to get mimeType
    const meta = await drive.files.get({
      fileId: driveFileId,
      fields: 'mimeType, name',
      supportsAllDrives: true,
    });

    res.setHeader('Content-Type', meta.data.mimeType || 'application/octet-stream');

    const response = await drive.files.get(
      {
        fileId: driveFileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'stream' }
    );

    response.data.pipe(res);
  } catch (err) {
    handleDriveError(err, 'streamFile');
  }
};

const getFileBuffer = async (driveFileId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    const response = await drive.files.get(
      {
        fileId: driveFileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data);
  } catch (err) {
    handleDriveError(err, 'getFileBuffer');
  }
};

/**
 * Fetches metadata for a Drive file.
 * @param {string} driveFileId
 * @returns {Promise<{ name: string, mimeType: string, size: number, createdTime: string }>}
 */
const getFileMetadata = async (driveFileId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    const res = await drive.files.get({
      fileId: driveFileId,
      fields: 'id, name, mimeType, size, createdTime',
      supportsAllDrives: true,
    });

    return {
      name: res.data.name,
      mimeType: res.data.mimeType,
      size: parseInt(res.data.size || '0', 10),
      createdTime: res.data.createdTime,
    };
  } catch (err) {
    handleDriveError(err, 'getFileMetadata');
  }
};

/**
 * Lists all files directly inside a Drive folder (non-recursive).
 * Used for sync/audit purposes only.
 * @param {string} driveFolderId
 * @returns {Promise<Array<{ driveFileId: string, name: string, mimeType: string, size: number }>>}
 */
const listFilesInFolder = async (driveFolderId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    const res = await drive.files.list({
      q: `'${driveFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'drive',
      driveId: process.env.DRIVE_SHARED_ID || undefined,
    });

    return (res.data.files || []).map(f => ({
      driveFileId: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: parseInt(f.size || '0', 10),
    }));
  } catch (err) {
    handleDriveError(err, 'listFilesInFolder');
  }
};

/**
 * Moves a file to a different parent folder in Drive.
 * @param {string} driveFileId - Drive file ID
 * @param {string} oldParentFolderId - Current parent folder ID
 * @param {string} newParentFolderId - Target parent folder ID
 * @returns {Promise<boolean>}
 */
const moveFile = async (driveFileId, oldParentFolderId, newParentFolderId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    await drive.files.update({
      fileId: driveFileId,
      addParents: newParentFolderId,
      removeParents: oldParentFolderId,
      fields: 'id, parents',
      supportsAllDrives: true,
    });

    return true;
  } catch (err) {
    handleDriveError(err, 'moveFile');
  }
};

module.exports = {
  createFolder,
  uploadFile,
  deleteFile,
  streamFile,
  getFileMetadata,
  getFileBuffer,
  listFilesInFolder,
  moveFile,
  sanitizeDriveName,
};
