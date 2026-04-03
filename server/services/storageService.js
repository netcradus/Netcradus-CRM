const drive = require('../config/drive');
const dbx = require('../config/dropbox');
const { Readable } = require('stream');

/**
 * Uploads a file buffer to the configured storage provider.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} filename - The target filename.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<{fileId: string, viewLink: string}>}
 */
const uploadFile = async (buffer, filename, mimeType) => {
    const provider = process.env.STORAGE_PROVIDER || 'drive';

    if (provider === 'drive') {
        if (!drive) throw new Error("Google Drive is not configured properly.");
        
        const folderId = process.env.DRIVE_FOLDER_ID;
        const fileMetadata = {
            name: filename,
            parents: folderId ? [folderId] : undefined
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(buffer)
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        });

        return {
            fileId: response.data.id,
            viewLink: `/api/documents/view/${response.data.id}` // Internal route, NOT raw link
        };

    } else if (provider === 'dropbox') {
        if (!dbx) throw new Error("Dropbox is not configured properly.");

        const path = `/${filename}`;

        const response = await dbx.filesUpload({
            path: path,
            contents: buffer,
            mode: { ".tag": "overwrite" }
        });

        return {
            fileId: response.result.path_lower,
            viewLink: `/api/documents/view/${encodeURIComponent(response.result.path_lower)}` // Internal route
        };
    } else {
        throw new Error("Invalid STORAGE_PROVIDER configured.");
    }
};

/**
 * Streams a file to the Express response object.
 * @param {string} fileId - The Drive file ID or Dropbox path_lower.
 * @param {Object} res - The Express response object.
 * @param {string} mimeType - The MIME type to set in headers.
 */
const streamFile = async (fileId, res, mimeType) => {
    const provider = process.env.STORAGE_PROVIDER || 'drive';

    res.setHeader('Content-Type', mimeType);

    if (provider === 'drive') {
        if (!drive) throw new Error("Google Drive is not configured properly.");
        
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        response.data.pipe(res);

    } else if (provider === 'dropbox') {
        if (!dbx) throw new Error("Dropbox is not configured properly.");

        const response = await dbx.filesDownload({ path: fileId });
        
        // Dropbox SDK returns 'fileBinary' which is a Buffer in Node.js
        res.end(response.result.fileBinary);
    } else {
        throw new Error("Invalid STORAGE_PROVIDER configured.");
    }
};

/**
 * Deletes a file from the configured storage provider.
 * @param {string} fileId - The Drive file ID or Dropbox path_lower.
 */
const deleteFile = async (fileId) => {
    const provider = process.env.STORAGE_PROVIDER || 'drive';

    if (provider === 'drive') {
        if (!drive) throw new Error("Google Drive is not configured properly.");
        await drive.files.delete({ fileId: fileId });
    } else if (provider === 'dropbox') {
         if (!dbx) throw new Error("Dropbox is not configured properly.");
         await dbx.filesDeleteV2({ path: fileId });
    } else {
         throw new Error("Invalid STORAGE_PROVIDER configured.");
    }
};

module.exports = {
    uploadFile,
    streamFile,
    deleteFile
};
