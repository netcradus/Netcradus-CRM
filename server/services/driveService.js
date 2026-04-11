const { Readable } = require('stream');
const drive = require('../config/drive');

/**
 * driveService — pure Google Drive API wrappers with no business logic.
 * All functions require the drive client to be initialized.
 */

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

  const safeName = sanitizeDriveName(name);

  const res = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id, name',
  });

  return {
    folderId: res.data.id,
    folderName: res.data.name,
  };
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
  });

  return {
    driveFileId: res.data.id,
    driveViewLink: res.data.webViewLink || '',
    webContentLink: res.data.webContentLink || '',
  };
};

/**
 * Permanently deletes a file (or folder) from Google Drive.
 * @param {string} driveFileId - Drive file/folder ID
 * @returns {Promise<boolean>} true on success
 */
const deleteFile = async (driveFileId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  try {
    await drive.files.delete({ fileId: driveFileId });
    return true;
  } catch (err) {
    if (err.code === 404) {
      // File already gone from Drive — treat as success
      console.warn(`[DriveService] File ${driveFileId} not found on Drive (already deleted?)`);
      return true;
    }
    throw err;
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

  // First fetch metadata to get mimeType
  const meta = await drive.files.get({
    fileId: driveFileId,
    fields: 'mimeType, name',
  });

  res.setHeader('Content-Type', meta.data.mimeType || 'application/octet-stream');

  const response = await drive.files.get(
    { fileId: driveFileId, alt: 'media' },
    { responseType: 'stream' }
  );

  response.data.pipe(res);
};

/**
 * Fetches metadata for a Drive file.
 * @param {string} driveFileId
 * @returns {Promise<{ name: string, mimeType: string, size: number, createdTime: string }>}
 */
const getFileMetadata = async (driveFileId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  const res = await drive.files.get({
    fileId: driveFileId,
    fields: 'id, name, mimeType, size, createdTime',
  });

  return {
    name: res.data.name,
    mimeType: res.data.mimeType,
    size: parseInt(res.data.size || '0', 10),
    createdTime: res.data.createdTime,
  };
};

/**
 * Lists all files directly inside a Drive folder (non-recursive).
 * Used for sync/audit purposes only.
 * @param {string} driveFolderId
 * @returns {Promise<Array<{ driveFileId: string, name: string, mimeType: string, size: number }>>}
 */
const listFilesInFolder = async (driveFolderId) => {
  if (!drive) throw new Error('Google Drive client is not initialized.');

  const res = await drive.files.list({
    q: `'${driveFolderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 1000,
  });

  return (res.data.files || []).map(f => ({
    driveFileId: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: parseInt(f.size || '0', 10),
  }));
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

  await drive.files.update({
    fileId: driveFileId,
    addParents: newParentFolderId,
    removeParents: oldParentFolderId,
    fields: 'id, parents',
  });

  return true;
};

module.exports = {
  createFolder,
  uploadFile,
  deleteFile,
  streamFile,
  getFileMetadata,
  listFilesInFolder,
  moveFile,
  sanitizeDriveName,
};
