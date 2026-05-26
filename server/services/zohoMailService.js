const axios = require("axios");
const FormData = require("form-data");
const zohoAuthService = require("./zohoAuthService");

const mailClient = axios.create({
  baseURL: "https://mail.zoho.eu/api",
  timeout: 10000,
});

function buildZohoError(error) {
  if (error?.code === "ZOHO_RECONNECT_REQUIRED") {
    throw error;
  }

  if (error?.code === "ZOHO_NOT_CONNECTED") {
    throw error;
  }

  if (error?.code === "ECONNABORTED") {
    const timeoutError = new Error("Zoho Mail request timed out.");
    timeoutError.code = "ZOHO_TIMEOUT";
    throw timeoutError;
  }

  const status = error?.response?.status;
  const retryAfter = error?.response?.headers?.["retry-after"];
  const message =
    error?.response?.data?.data?.moreInfo ||
    error?.response?.data?.status?.description ||
    error?.response?.data?.message ||
    error.message ||
    "Zoho Mail request failed.";

  if (status === 429) {
    const rateError = new Error(message);
    rateError.code = "ZOHO_RATE_LIMITED";
    rateError.retryAfter = retryAfter;
    throw rateError;
  }

  if (status === 404) {
    const notFoundError = new Error(message);
    notFoundError.code = "ZOHO_NOT_FOUND";
    throw notFoundError;
  }

  const apiError = new Error(message);
  apiError.code = "ZOHO_API_ERROR";
  apiError.status = status;
  throw apiError;
}

async function request(config, allowRetry = true) {
  try {
    const token = await zohoAuthService.getValidAccessToken();
    const response = await mailClient.request({
      ...config,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        ...(config.headers || {}),
      },
    });

    return response;
  } catch (error) {
    if (error?.response?.status === 401 && allowRetry) {
      try {
        const token = await zohoAuthService.refreshAccessToken();
        return await mailClient.request({
          ...config,
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            ...(config.headers || {}),
          },
        });
      } catch (retryError) {
        const authError = new Error("Zoho authentication expired.");
        authError.code = "ZOHO_AUTH_EXPIRED";
        throw authError;
      }
    }

    buildZohoError(error);
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function normalizeMessage(message = {}) {
  return {
    messageId: String(message.messageId || message.msgId || message.messageid || ""),
    threadId: message.threadId ? String(message.threadId) : null,
    subject: message.subject || "",
    fromAddress:
      message.fromAddress ||
      message.sender ||
      message.from?.mailAddress ||
      message.from?.email ||
      "",
    toAddress:
      message.toAddress ||
      normalizeArray(message.toAddressList || message.toAddressListInfo)
        .map((entry) => entry?.mailAddress || entry?.email || entry)
        .filter(Boolean),
    summary: message.summary || message.snippet || "",
    receivedTime: Number(message.receivedTime || message.receivedTimeInGMT || Date.now()),
    hasAttachment: Boolean(Number(message.hasAttachment || 0) || message.hasAttachment === true),
    isRead: Boolean(Number(message.read) || message.isRead || message.status === 1),
    folderId: message.folderId ? String(message.folderId) : null,
  };
}

async function getAccountIdForEmail(zohoEmail) {
  const accounts = await listAccounts();
  const normalizedEmail = String(zohoEmail || "").trim().toLowerCase();

  const matchedAccount = accounts.find((account) => {
    const primaryEmail = String(account.primaryEmailAddress || account.mailboxAddress || "").toLowerCase();
    const mailboxEmail = String(account.incomingUserName || "").toLowerCase();
    const aliasMatch = normalizeArray(account.emailAddress).some(
      (entry) => String(entry?.mailId || "").toLowerCase() === normalizedEmail
    );

    return primaryEmail === normalizedEmail || mailboxEmail === normalizedEmail || aliasMatch;
  });

  if (!matchedAccount?.accountId) {
    const error = new Error("Zoho mailbox not found.");
    error.code = "ZOHO_ACCOUNT_NOT_FOUND";
    throw error;
  }

  return {
    zohoAccountId: String(matchedAccount.accountId),
    displayName: matchedAccount.displayName || matchedAccount.accountDisplayName || matchedAccount.mailboxAddress,
    zohoEmail:
      matchedAccount.primaryEmailAddress ||
      matchedAccount.mailboxAddress ||
      normalizedEmail,
  };
}

async function listAccounts() {
  const response = await request({ method: "GET", url: "/accounts" });
  return response.data?.data || [];
}

async function getFolders(zohoAccountId) {
  const response = await request({
    method: "GET",
    url: `/accounts/${zohoAccountId}/folders`,
  });

  return (response.data?.data || []).map((folder) => ({
    folderId: String(folder.folderId || folder.id || folder.folderID || ""),
    name: folder.folderName || folder.name || "",
    messageCount: Number(folder.messageCount || folder.total || 0),
    unreadCount: Number(folder.unreadCount || folder.unread || 0),
    type: folder.folderType || folder.type || "",
  }));
}

async function getMessages(zohoAccountId, folderId, options = {}) {
  const params = {
    folderId,
    limit: Number(options.limit || 20),
    start: Number(options.start || 0),
  };

  if (options.sortorder) params.sortorder = options.sortorder;
  if (options.searchKey) params.searchKey = options.searchKey;

  const response = await request({
    method: "GET",
    url: `/accounts/${zohoAccountId}/messages/view`,
    params,
  });

  const messages = (response.data?.data || []).map(normalizeMessage);
  return {
    messages,
    totalCount: Number(response.data?.summary?.total || response.data?.count || messages.length),
  };
}

async function getAttachmentInfo(zohoAccountId, folderId, messageId) {
  const response = await request({
    method: "GET",
    url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/attachmentinfo`,
  });

  return normalizeArray(response.data?.data).map((attachment) => ({
    attachmentId: String(attachment.attachmentId || attachment.attachId || ""),
    fileName: attachment.attachmentName || attachment.fileName || "attachment",
    size: Number(attachment.size || attachment.fileSize || 0),
    contentType: attachment.contentType || "application/octet-stream",
  }));
}

async function getMessage(zohoAccountId, messageId, folderId) {
  const [contentResponse, headerResponse, attachments] = await Promise.all([
    request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/content`,
      params: { includeBlockContent: true },
    }),
    request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/header`,
    }),
    getAttachmentInfo(zohoAccountId, folderId, messageId).catch(() => []),
  ]);

  const headerData = headerResponse.data?.data || {};
  const contentData = contentResponse.data?.data || {};
  const toAddresses = normalizeArray(headerData.toAddress || headerData.toAddressList)
    .map((entry) => entry?.mailAddress || entry?.email || entry)
    .filter(Boolean);
  const ccAddresses = normalizeArray(headerData.ccAddress || headerData.ccAddressList)
    .map((entry) => entry?.mailAddress || entry?.email || entry)
    .filter(Boolean);
  const bccAddresses = normalizeArray(headerData.bccAddress || headerData.bccAddressList)
    .map((entry) => entry?.mailAddress || entry?.email || entry)
    .filter(Boolean);

  return {
    messageId: String(messageId),
    subject: headerData.subject || "",
    fromAddress:
      headerData.fromAddress ||
      headerData.from?.mailAddress ||
      headerData.from?.email ||
      "",
    toAddresses,
    ccAddresses,
    bccAddresses,
    htmlBody: contentData.content || "",
    textBody: contentData.contentText || "",
    receivedTime: Number(headerData.receivedTime || headerData.sentDateInGMT || Date.now()),
    hasAttachment: attachments.length > 0,
    isRead: Boolean(headerData.status === 1 || headerData.read || headerData.isRead),
    attachments,
  };
}

async function sendMessage(zohoAccountId, payload) {
  const response = await request({
    method: "POST",
    url: `/accounts/${zohoAccountId}/messages`,
    data: {
      fromAddress: payload.fromAddress,
      toAddress: payload.toAddress,
      ccAddress: payload.ccAddress,
      bccAddress: payload.bccAddress,
      subject: payload.subject,
      content: payload.content,
      mailFormat: payload.mailFormat || "html",
      inReplyTo: payload.inReplyTo,
      attachmentId: payload.attachmentIds,
    },
  });

  const data = response.data?.data || response.data || {};
  return {
    messageId: String(data.messageId || data.mailId || ""),
    subject: data.subject || payload.subject,
    status: response.data?.status?.description || "success",
  };
}

async function replyToMessage(zohoAccountId, messageId, payload) {
  const response = await request({
    method: "POST",
    url: `/accounts/${zohoAccountId}/messages/${messageId}`,
    data: {
      mode: payload.mode || "reply",
      content: payload.content,
      toAddress: payload.toAddress,
      ccAddress: payload.ccAddress,
      attachmentId: payload.attachmentIds,
      mailFormat: "html",
    },
  });

  const data = response.data?.data || response.data || {};
  return {
    messageId: String(data.messageId || data.mailId || ""),
    subject: data.subject || "",
    status: response.data?.status?.description || "success",
  };
}

async function searchMessages(zohoAccountId, query, options = {}) {
  const response = await request({
    method: "GET",
    url: `/accounts/${zohoAccountId}/messages/search`,
    params: {
      searchKey: query,
      limit: Number(options.limit || 20),
      start: Number(options.start || 0),
    },
  });

  const messages = (response.data?.data || []).map(normalizeMessage);
  return {
    messages,
    totalCount: Number(response.data?.summary?.total || response.data?.count || messages.length),
  };
}

async function uploadAttachment(zohoAccountId, file) {
  const form = new FormData();
  form.append("attachment", file.buffer, {
    contentType: file.mimetype,
    filename: file.originalname,
    knownLength: file.size,
  });

  const response = await request({
    method: "POST",
    url: `/accounts/${zohoAccountId}/messages/attachments`,
    params: { uploadType: "multipart" },
    data: form,
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const attachment = normalizeArray(response.data?.data)[0] || {};
  return {
    attachmentId: attachment.attachmentId || attachment.storeName || attachment.attachmentPath,
    attachmentName: attachment.attachmentName || file.originalname,
    attachmentPath: attachment.attachmentPath,
    storeName: attachment.storeName,
  };
}

async function downloadAttachment(zohoAccountId, folderId, messageId, attachmentId) {
  return request({
    method: "GET",
    url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`,
    responseType: "stream",
    headers: { Accept: "application/octet-stream" },
  });
}

async function markAsRead(zohoAccountId, messageId) {
  await request({
    method: "PUT",
    url: `/accounts/${zohoAccountId}/updatemessage`,
    data: {
      mode: "read",
      messageId: [String(messageId)],
    },
  });
}

async function moveToFolder(zohoAccountId, messageId, targetFolderId) {
  await request({
    method: "PUT",
    url: `/accounts/${zohoAccountId}/updatemessage`,
    data: {
      mode: "moveMessage",
      messageId: [String(messageId)],
      folderId: String(targetFolderId),
    },
  });
}

async function deleteMessage(zohoAccountId, messageId) {
  await request({
    method: "DELETE",
    url: `/accounts/${zohoAccountId}/messages/${messageId}`,
  });
}

module.exports = {
  downloadAttachment,
  getAccountIdForEmail,
  getFolders,
  getMessage,
  getMessages,
  listAccounts,
  markAsRead,
  moveToFolder,
  deleteMessage,
  replyToMessage,
  searchMessages,
  sendMessage,
  uploadAttachment,
};
