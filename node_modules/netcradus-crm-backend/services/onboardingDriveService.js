const User = require("../models/User");
const UserStorage = require("../models/UserStorage");
const Document = require("../models/Document");
const { drive } = require("../config/drive");
const driveService = require("./driveService");

const ONBOARDING_FOLDER_NAME = "onboarding-documents";

const resolveStorageOwner = async () => {
  let storageOwner = await User.findOne({ role: "hr" }).select("_id role name email");

  if (!storageOwner) {
    console.warn("No HR user found — uploading to super_user folder");
    storageOwner = await User.findOne({ role: "super_user" }).select("_id role name email");
  }

  if (!storageOwner) {
    throw new Error("No HR or super_user available for onboarding document storage.");
  }

  return storageOwner;
};

const getOnboardingFolder = async (rootFolderId) => {
  const files = await driveService.listFilesInFolder(rootFolderId);
  const existing = files.find(
    (file) =>
      file.name === ONBOARDING_FOLDER_NAME &&
      file.mimeType === "application/vnd.google-apps.folder"
  );

  if (existing) {
    return {
      folderId: existing.driveFileId,
      folderName: existing.name,
    };
  }

  return driveService.createFolder(ONBOARDING_FOLDER_NAME, rootFolderId);
};

const uploadToHrFolder = async (fileBuffer, fileName, mimeType, employeeUserId) => {
  const storageOwner = await resolveStorageOwner();
  const storage = await UserStorage.findOne({ userId: storageOwner._id });

  if (!storage?.personalRootFolderId) {
    throw new Error("Storage root folder not found for onboarding document owner.");
  }

  const folder = await getOnboardingFolder(storage.personalRootFolderId);
  const uploadResult = await driveService.uploadFile(fileBuffer, fileName, mimeType, folder.folderId);

  await Document.create({
    ownerId: storageOwner._id,
    folderId: folder.folderId,
    folderName: folder.folderName,
    originalName: fileName,
    safeName: driveService.sanitizeDriveName(fileName),
    mimeType,
    fileSizeBytes: fileBuffer.length,
    fileSizeMB: Number((fileBuffer.length / (1024 * 1024)).toFixed(4)),
    driveFileId: uploadResult.driveFileId,
    driveViewLink: uploadResult.driveViewLink,
    entityType: "user",
    entityId: employeeUserId,
  });

  return {
    driveFileId: uploadResult.driveFileId,
    fileName,
    fileSizeMB: Number((fileBuffer.length / (1024 * 1024)).toFixed(4)),
  };
};

const getFileAsBase64 = async (driveFileId, fileName) => {
  try {
    if (!drive) {
      throw new Error("Google Drive client is not initialized.");
    }

    const response = await drive.files.get(
      {
        fileId: driveFileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );

    const base64 = await new Promise((resolve, reject) => {
      const chunks = [];
      response.data.on("data", (chunk) => chunks.push(chunk));
      response.data.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString("base64"));
      });
      response.data.on("error", reject);
    });

    const mimeType = response.headers["content-type"] || "application/octet-stream";

    return {
      name: fileName || `document-${driveFileId}`,
      content: base64,
      type: mimeType,
    };
  } catch (err) {
    console.error(`Failed to fetch Drive file ${driveFileId}:`, err.message);
    return null;
  }
};

module.exports = {
  uploadToHrFolder,
  getFileAsBase64,
};
