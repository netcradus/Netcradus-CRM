const User = require("../models/User");
const EmailThread = require("../models/EmailThread");
const ZohoAccount = require("../models/ZohoAccount");
const { emitToUsers } = require("../socket");
const zohoAuthService = require("./zohoAuthService");
const zohoMailService = require("./zohoMailService");

const POLL_INTERVAL_MS = 2 * 60 * 1000;

let pollingHandle = null;

function normalizeFolderName(folderName = "") {
  const value = String(folderName || "").trim().toLowerCase();
  if (value.includes("inbox")) return "inbox";
  if (value.includes("sent")) return "sent";
  if (value.includes("draft")) return "drafts";
  if (value.includes("trash")) return "trash";
  return value;
}

async function getInboxFolder(zohoAccountId) {
  const folders = await zohoMailService.getFolders(zohoAccountId);
  const inbox = folders.find((folder) => normalizeFolderName(folder.name) === "inbox");
  if (!inbox) {
    const error = new Error("Inbox folder not found.");
    error.code = "ZOHO_NOT_FOUND";
    throw error;
  }

  return inbox;
}

async function syncInboxForUser(userId) {
  const account = await ZohoAccount.findOne({ userId, isActive: true }).lean();
  if (!account) {
    return 0;
  }

  const inboxFolder = await getInboxFolder(account.zohoAccountId);
  const { messages } = await zohoMailService.getMessages(account.zohoAccountId, inboxFolder.folderId, {
    limit: 25,
    start: 0,
  });

  let newMessages = 0;

  for (const message of messages) {
    const existing = await EmailThread.findOne({ zohoMessageId: message.messageId }).lean();
    if (existing) {
      continue;
    }

    await EmailThread.create({
      zohoMessageId: message.messageId,
      zohoThreadId: message.threadId,
      zohoAccountId: account.zohoAccountId,
      zohoFolderId: message.folderId || inboxFolder.folderId,
      ownerUserId: account.userId,
      subject: message.subject,
      fromAddress: message.fromAddress,
      toAddresses: Array.isArray(message.toAddress) ? message.toAddress : [message.toAddress].filter(Boolean),
      snippet: String(message.summary || "").slice(0, 200),
      hasAttachments: message.hasAttachment,
      isRead: message.isRead,
      folder: "inbox",
      receivedAt: new Date(message.receivedTime),
    });

    newMessages += 1;

    if (!message.isRead) {
      emitToUsers([String(account.userId)], "new_mail", {
        messageId: message.messageId,
        subject: message.subject,
        fromAddress: message.fromAddress,
        snippet: String(message.summary || "").slice(0, 200),
        receivedAt: new Date(message.receivedTime),
        hasAttachments: message.hasAttachment,
        folder: "inbox",
      });
    }
  }

  return newMessages;
}

async function startPolling() {
  if (pollingHandle) {
    return;
  }

  const connected = await zohoAuthService.isConnected();
  if (!connected) {
    console.info("[Zoho Mail] Organization not connected. Skipping inbox polling.");
    return;
  }

  pollingHandle = setInterval(async () => {
    const users = await User.find({ zohoConnected: true, zohoAccountId: { $ne: null } }).select("_id").lean();

    for (const user of users) {
      try {
        await syncInboxForUser(user._id);
      } catch (error) {
        console.error(`[Zoho Mail] Inbox sync failed for user ${user._id}:`, error.message);
      }
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollingHandle) {
    clearInterval(pollingHandle);
    pollingHandle = null;
  }
}

module.exports = {
  startPolling,
  stopPolling,
  syncInboxForUser,
};
