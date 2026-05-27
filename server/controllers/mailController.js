const mongoose = require("mongoose");
const multer = require("multer");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const Account = require("../models/accountModel");
const EmailThread = require("../models/EmailThread");
const zohoMailService = require("../services/zohoMailService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const LINKED_MODELS = {
  lead: Lead,
  contact: Contact,
  deal: Deal,
  account: Account,
};

function isSuperUser(req) {
  return String(req.user?.role || "").trim().toLowerCase() === "super_user";
}

function normalizeFolderName(folderName = "") {
  const value = String(folderName || "").trim().toLowerCase();
  if (value.includes("inbox")) return "inbox";
  if (value.includes("sent")) return "sent";
  if (value.includes("draft")) return "drafts";
  if (value.includes("trash")) return "trash";
  return value;
}

function mapMailError(error, res) {
  if (error?.code === "ZOHO_AUTH_EXPIRED") {
    return res.status(503).json({
      success: false,
      message: "Mail service authentication expired. Contact administrator.",
    });
  }

  if (error?.code === "ZOHO_RECONNECT_REQUIRED") {
    return res.status(503).json({
      success: false,
      message: "Zoho Mail connection needs to be reconnected by an administrator.",
      code: "ZOHO_RECONNECT_REQUIRED",
    });
  }

  if (error?.code === "ZOHO_RATE_LIMITED") {
    if (error.retryAfter) {
      res.setHeader("Retry-After", error.retryAfter);
    }
    return res.status(429).json({
      success: false,
      message: "Too many requests to mail service. Please wait and try again.",
    });
  }

  if (error?.code === "ZOHO_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: "Email not found.",
    });
  }

  if (error?.code === "ZOHO_TIMEOUT") {
    return res.status(504).json({
      success: false,
      message: "Mail service timed out.",
    });
  }

  if (error?.code === "ZOHO_API_ERROR") {
    return res.status(502).json({
      success: false,
      message: "Mail service error.",
    });
  }

  return null;
}

async function getThreadForOwnership(req, messageId) {
  const query = { zohoMessageId: String(messageId) };
  if (!isSuperUser(req)) {
    query.ownerUserId = req.user.id;
  }
  return EmailThread.findOne(query);
}

async function mergeThreads(messages, ownerUserId) {
  const threadDocs = await EmailThread.find({
    ownerUserId,
    zohoMessageId: { $in: messages.map((message) => String(message.messageId)) },
  }).lean();
  const threadMap = new Map(threadDocs.map((thread) => [String(thread.zohoMessageId), thread]));

  return messages.map((message) => {
    const thread = threadMap.get(String(message.messageId));
    return {
      ...message,
      isLinked: Boolean(thread?.linkedEntityType && thread?.linkedEntityId),
      linkedEntityType: thread?.linkedEntityType || null,
      linkedEntityId: thread?.linkedEntityId || null,
      crmNote: thread?.crmNote || "",
      emailThreadId: thread?._id || null,
    };
  });
}

function sanitizeSearchQuery(query) {
  return String(query || "")
    .replace(/[<>{}[\]^`~]/g, " ")
    .replace(/["'\\]/g, "\\$&")
    .trim();
}

function validateEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function shouldRetryMessageLookup(error) {
  return error?.code === "ZOHO_NOT_FOUND" || error?.code === "ZOHO_API_ERROR";
}

async function getMessageWithFolderFallback(zohoAccountId, messageId, preferredFolderIds = []) {
  const allFolders = await zohoMailService.getFolders(zohoAccountId);
  const candidateFolderIds = [
    ...preferredFolderIds.filter(Boolean).map((folderId) => String(folderId)),
    ...allFolders.map((folder) => String(folder.folderId || "")).filter(Boolean),
  ].filter((folderId, index, array) => array.indexOf(folderId) === index);

  let lastError = null;

  for (const folderId of candidateFolderIds) {
    try {
      const message = await zohoMailService.getMessage(zohoAccountId, messageId, folderId);
      return { message, folderId };
    } catch (error) {
      lastError = error;
      if (!shouldRetryMessageLookup(error)) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  const error = new Error("Email not found.");
  error.code = "ZOHO_NOT_FOUND";
  throw error;
}

async function ensureThreadMetadata(req, messageId, folderId, folderName) {
  return EmailThread.findOneAndUpdate(
    { zohoMessageId: String(messageId) },
    {
      $setOnInsert: {
        zohoMessageId: String(messageId),
        zohoAccountId: req.zohoAccount.zohoAccountId,
        ownerUserId: req.user.id,
        createdAt: new Date(),
      },
      $set: {
        zohoFolderId: folderId || null,
        folder: folderName || null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getFolders(req, res) {
  try {
    const folders = await zohoMailService.getFolders(req.zohoAccount.zohoAccountId);
    return res.json({ success: true, folders });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to fetch folders." });
  }
}

async function getMessages(req, res) {
  try {
    const { folderId, limit = 20, start = 0 } = req.query;
    if (!folderId) {
      return res.status(400).json({ success: false, message: "folderId is required." });
    }

    const folders = await zohoMailService.getFolders(req.zohoAccount.zohoAccountId);
    const selectedFolder = folders.find((folder) => String(folder.folderId) === String(folderId));
    const result = await zohoMailService.getMessages(req.zohoAccount.zohoAccountId, folderId, { limit, start });

    await Promise.all(
      result.messages.map((message) =>
        EmailThread.findOneAndUpdate(
          { zohoMessageId: String(message.messageId) },
          {
            $setOnInsert: {
              zohoMessageId: String(message.messageId),
              zohoThreadId: message.threadId,
              zohoAccountId: req.zohoAccount.zohoAccountId,
              ownerUserId: req.user.id,
              createdAt: new Date(),
            },
            $set: {
              zohoFolderId: message.folderId || String(folderId),
              subject: message.subject,
              fromAddress: message.fromAddress,
              toAddresses: Array.isArray(message.toAddress) ? message.toAddress : [message.toAddress].filter(Boolean),
              snippet: String(message.summary || "").slice(0, 200),
              hasAttachments: message.hasAttachment,
              isRead: message.isRead,
              folder: normalizeFolderName(selectedFolder?.name),
              receivedAt: new Date(message.receivedTime),
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        )
      )
    );

    const mergedMessages = await mergeThreads(result.messages, req.user.id);
    return res.json({ success: true, ...result, messages: mergedMessages });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
}

async function getMessage(req, res) {
  try {
    const { messageId } = req.params;
    const requestedFolderId = req.query.folderId ? String(req.query.folderId) : null;
    let thread = await getThreadForOwnership(req, messageId);
    if (!thread && !requestedFolderId) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    const { message, folderId: resolvedFolderId } = await getMessageWithFolderFallback(
      req.zohoAccount.zohoAccountId,
      messageId,
      [requestedFolderId, thread?.zohoFolderId]
    );
    await zohoMailService.markAsRead(req.zohoAccount.zohoAccountId, messageId);

    thread = await EmailThread.findOneAndUpdate(
      { zohoMessageId: String(messageId) },
      {
        $set: {
          zohoAccountId: req.zohoAccount.zohoAccountId,
          ownerUserId: req.user.id,
          zohoFolderId: resolvedFolderId || requestedFolderId || thread?.zohoFolderId || null,
          subject: message.subject,
          fromAddress: message.fromAddress,
          toAddresses: message.toAddresses,
          hasAttachments: message.hasAttachment,
          isRead: true,
          receivedAt: new Date(message.receivedTime),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      success: true,
      message: {
        ...message,
        folderId: resolvedFolderId || requestedFolderId || thread?.zohoFolderId || null,
        isLinked: Boolean(thread?.linkedEntityType && thread?.linkedEntityId),
        linkedEntityType: thread?.linkedEntityType || null,
        linkedEntityId: thread?.linkedEntityId || null,
        crmNote: thread?.crmNote || "",
      },
    });
  } catch (error) {
    console.warn("[Zoho Mail] Failed to open message", {
      code: error?.code,
      message: error?.message,
      zohoMessageId: req.params?.messageId,
      requestedFolderId: req.query?.folderId || null,
      userId: req.user?.id || null,
    });
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to fetch message." });
  }
}

async function sendMessage(req, res) {
  try {
    const { toAddress, ccAddress, bccAddress, subject, content, attachmentIds, inReplyTo } = req.body;
    if (!validateEmailAddress(toAddress)) {
      return res.status(400).json({ success: false, message: "A valid toAddress is required." });
    }

    const response = await zohoMailService.sendMessage(req.zohoAccount.zohoAccountId, {
      fromAddress: req.zohoAccount.zohoEmail,
      toAddress,
      ccAddress,
      bccAddress,
      subject,
      content,
      attachmentIds,
      inReplyTo,
      mailFormat: "html",
    });

    await EmailThread.create({
      zohoMessageId: response.messageId,
      zohoAccountId: req.zohoAccount.zohoAccountId,
      ownerUserId: req.user.id,
      subject,
      fromAddress: req.zohoAccount.zohoEmail,
      toAddresses: [toAddress],
      snippet: String(content || "").replace(/<[^>]+>/g, "").slice(0, 200),
      hasAttachments: Array.isArray(attachmentIds) && attachmentIds.length > 0,
      isRead: true,
      folder: "sent",
      receivedAt: new Date(),
      createdAt: new Date(),
    });

    return res.json({ success: true, messageId: response.messageId });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to send message." });
  }
}

async function replyToMessage(req, res) {
  try {
    const { messageId } = req.params;
    const thread = await getThreadForOwnership(req, messageId);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    const { content, toAddress, ccAddress, attachmentIds } = req.body;
    const response = await zohoMailService.replyToMessage(req.zohoAccount.zohoAccountId, messageId, {
      content,
      toAddress,
      ccAddress,
      attachmentIds,
    });

    return res.json({ success: true, messageId: response.messageId });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to reply to message." });
  }
}

async function searchMessages(req, res) {
  try {
    const q = sanitizeSearchQuery(req.query.q);
    if (q.length < 2) {
      return res.status(400).json({ success: false, message: "Search query must be at least 2 characters." });
    }

    const result = await zohoMailService.searchMessages(req.zohoAccount.zohoAccountId, q, {
      limit: req.query.limit || 20,
      start: req.query.start || 0,
    });

    await Promise.all(
      result.messages.map((message) =>
        EmailThread.findOneAndUpdate(
          { zohoMessageId: String(message.messageId) },
          {
            $setOnInsert: {
              zohoMessageId: String(message.messageId),
              zohoThreadId: message.threadId,
              zohoAccountId: req.zohoAccount.zohoAccountId,
              ownerUserId: req.user.id,
              createdAt: new Date(),
            },
            $set: {
              zohoFolderId: message.folderId || null,
              subject: message.subject,
              fromAddress: message.fromAddress,
              toAddresses: Array.isArray(message.toAddress) ? message.toAddress : [message.toAddress].filter(Boolean),
              snippet: String(message.summary || "").slice(0, 200),
              hasAttachments: message.hasAttachment,
              isRead: message.isRead,
              receivedAt: new Date(message.receivedTime),
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        )
      )
    );

    const mergedMessages = await mergeThreads(result.messages, req.user.id);
    return res.json({ success: true, ...result, messages: mergedMessages });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to search messages." });
  }
}

const uploadAttachment = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "File is required." });
      }

      const result = await zohoMailService.uploadAttachment(req.zohoAccount.zohoAccountId, req.file);
      return res.json({
        success: true,
        attachmentId: result.attachmentId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (error) {
      return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to upload attachment." });
    }
  },
];

async function downloadAttachment(req, res) {
  try {
    const { messageId, attachmentId } = req.params;
    const thread = await getThreadForOwnership(req, messageId);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    const response = await zohoMailService.downloadAttachment(
      thread.zohoAccountId,
      thread.zohoFolderId,
      messageId,
      attachmentId
    );

    res.setHeader("Content-Disposition", "attachment");
    if (response.headers["content-type"]) {
      res.setHeader("Content-Type", response.headers["content-type"]);
    }

    response.data.pipe(res);
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to download attachment." });
  }
}

async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const thread = await getThreadForOwnership(req, messageId);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    await zohoMailService.deleteMessage(thread.zohoAccountId, messageId);
    await EmailThread.findOneAndUpdate(
      { zohoMessageId: String(messageId) },
      { $set: { folder: "trash" } }
    );

    return res.json({ success: true });
  } catch (error) {
    return mapMailError(error, res) || res.status(500).json({ success: false, message: "Failed to delete message." });
  }
}

async function linkEmailToEntity(req, res) {
  const { messageId } = req.params;
  const { entityType, entityId } = req.body;

  if (!LINKED_MODELS[entityType]) {
    return res.status(400).json({ success: false, message: "Invalid entity type." });
  }

  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    return res.status(400).json({ success: false, message: "Invalid entityId." });
  }

  const entity = await LINKED_MODELS[entityType].findById(entityId).lean();
  if (!entity) {
    return res.status(404).json({ success: false, message: "Entity not found." });
  }

  const thread = await getThreadForOwnership(req, messageId);
  if (!thread) {
    return res.status(404).json({ success: false, message: "Email not found." });
  }

  const updatedThread = await EmailThread.findOneAndUpdate(
    { zohoMessageId: String(messageId) },
    {
      $set: {
        linkedEntityType: entityType,
        linkedEntityId: entityId,
        linkedAt: new Date(),
        linkedBy: req.user.id,
      },
    },
    { new: true }
  ).lean();

  return res.json({ success: true, emailThread: updatedThread });
}

async function unlinkEmailFromEntity(req, res) {
  const { messageId } = req.params;
  const thread = await getThreadForOwnership(req, messageId);
  if (!thread) {
    return res.status(404).json({ success: false, message: "Email not found." });
  }

  const updatedThread = await EmailThread.findOneAndUpdate(
    { zohoMessageId: String(messageId) },
    {
      $set: {
        linkedEntityType: null,
        linkedEntityId: null,
        linkedAt: null,
        linkedBy: null,
      },
    },
    { new: true }
  ).lean();

  return res.json({ success: true, emailThread: updatedThread });
}

async function getEmailsForEntity(req, res) {
  const { entityType, entityId } = req.params;
  if (!LINKED_MODELS[entityType]) {
    return res.status(400).json({ success: false, message: "Invalid entity type." });
  }

  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    return res.status(400).json({ success: false, message: "Invalid entityId." });
  }

  const query = {
    linkedEntityType: entityType,
    linkedEntityId: entityId,
  };

  if (!isSuperUser(req)) {
    query.ownerUserId = req.user.id;
  }

  const emails = await EmailThread.find(query).sort({ receivedAt: -1 }).lean();
  return res.json({ success: true, emails });
}

async function updateCrmNote(req, res) {
  const { messageId } = req.params;
  const note = String(req.body.note || "");
  const thread = await getThreadForOwnership(req, messageId);
  if (!thread) {
    return res.status(404).json({ success: false, message: "Email not found." });
  }

  const updatedThread = await EmailThread.findOneAndUpdate(
    { zohoMessageId: String(messageId) },
    { $set: { crmNote: note.slice(0, 1000) } },
    { new: true }
  ).lean();

  return res.json({ success: true, emailThread: updatedThread });
}

module.exports = {
  deleteMessage,
  downloadAttachment,
  getEmailsForEntity,
  getFolders,
  getMessage,
  getMessages,
  linkEmailToEntity,
  replyToMessage,
  searchMessages,
  sendMessage,
  unlinkEmailFromEntity,
  updateCrmNote,
  uploadAttachment,
};
