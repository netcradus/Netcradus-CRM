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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isEmailLike(value) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(value || "").trim());
}

function collectEmails(value, emails = new Set()) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (isEmailLike(trimmedValue)) {
      emails.add(normalizeEmail(trimmedValue));
    }
    return emails;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectEmails(entry, emails));
    return emails;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectEmails(entry, emails));
  }

  return emails;
}

function getAccountId(account = {}) {
  return account.accountId || account.accountID || account.account_id || account.id || account.mailAccountId;
}

function normalizeAccountsResponse(data) {
  const payload = data?.data || data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.mailAccounts)) return payload.mailAccounts;
  if (payload && typeof payload === "object") return Object.values(payload).filter((entry) => entry && typeof entry === "object");
  return [];
}

function getAccountDedupKey(account = {}) {
  const accountId = getAccountId(account);
  if (accountId) {
    return `id:${String(accountId)}`;
  }

  const emails = [...collectEmails(account)].sort();
  if (emails.length) {
    return `emails:${emails.join("|")}`;
  }

  return null;
}

function mergeAccounts(...accountGroups) {
  const mergedAccounts = [];
  const seenKeys = new Set();

  accountGroups.flat().forEach((account) => {
    if (!account || typeof account !== "object") {
      return;
    }

    const dedupKey = getAccountDedupKey(account);
    if (dedupKey && seenKeys.has(dedupKey)) {
      return;
    }

    if (dedupKey) {
      seenKeys.add(dedupKey);
    }

    mergedAccounts.push(account);
  });

  return mergedAccounts;
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
  const accounts = await listAvailableAccounts();
  const normalizedEmail = normalizeEmail(zohoEmail);

  const matchedAccount = accounts.find((account) => {
    const accountEmails = collectEmails(account);
    return accountEmails.has(normalizedEmail);
  });

  const accountId = matchedAccount ? getAccountId(matchedAccount) : null;
  if (!accountId) {
    const error = new Error("Zoho mailbox not found.");
    error.code = "ZOHO_ACCOUNT_NOT_FOUND";
    error.availableEmails = accounts
      .flatMap((account) => [...collectEmails(account)])
      .filter(Boolean)
      .slice(0, 10);
    throw error;
  }

  const matchedEmails = [...collectEmails(matchedAccount)];
  return {
    zohoAccountId: String(accountId),
    displayName: matchedAccount.displayName || matchedAccount.accountDisplayName || matchedAccount.mailboxAddress,
    zohoEmail:
      normalizeEmail(matchedAccount.primaryEmailAddress) ||
      normalizeEmail(matchedAccount.mailboxAddress) ||
      matchedEmails[0] ||
      normalizedEmail,
  };
}

async function listAccounts() {
  const response = await request({ method: "GET", url: "/accounts" });
  return normalizeAccountsResponse(response.data);
}

async function listOrganizationAccounts() {
  if (!process.env.ZOHO_ORG_ID) {
    return [];
  }

  const response = await request({
    method: "GET",
    url: `/organization/${process.env.ZOHO_ORG_ID}/accounts`,
  });

  return normalizeAccountsResponse(response.data);
}

async function listAvailableAccounts() {
  const [personalResult, organizationResult] = await Promise.allSettled([
    listAccounts(),
    listOrganizationAccounts(),
  ]);

  const personalAccounts = personalResult.status === "fulfilled" ? personalResult.value : [];
  const organizationAccounts = organizationResult.status === "fulfilled" ? organizationResult.value : [];

  if (personalResult.status === "rejected" && organizationResult.status === "rejected") {
    throw organizationResult.reason || personalResult.reason;
  }

  return mergeAccounts(personalAccounts, organizationAccounts);
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
  let response;

  try {
    response = await request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/messages/${messageId}/attachmentinfo`,
    });
  } catch (error) {
    if (!folderId) {
      throw error;
    }

    response = await request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/attachmentinfo`,
    });
  }

  return normalizeArray(response.data?.data).map((attachment) => ({
    attachmentId: String(attachment.attachmentId || attachment.attachId || ""),
    fileName: attachment.attachmentName || attachment.fileName || "attachment",
    size: Number(attachment.size || attachment.fileSize || 0),
    contentType: attachment.contentType || "application/octet-stream",
  }));
}

async function getMessage(zohoAccountId, messageId, folderId) {
  const [contentResponse, headerResponse, attachments] = await Promise.all([
    requestMessageResource(zohoAccountId, messageId, folderId, "content", {
      params: { includeBlockContent: true },
    }),
    requestMessageResource(zohoAccountId, messageId, folderId, "header"),
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
  try {
    return await request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/messages/${messageId}/attachments/${attachmentId}`,
      responseType: "stream",
      headers: { Accept: "application/octet-stream" },
    });
  } catch (error) {
    if (!folderId) {
      throw error;
    }

    return request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`,
      responseType: "stream",
      headers: { Accept: "application/octet-stream" },
    });
  }
}

async function requestMessageResource(zohoAccountId, messageId, folderId, resource, config = {}) {
  try {
    return await request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/messages/${messageId}/${resource}`,
      ...config,
    });
  } catch (error) {
    if (!folderId) {
      throw error;
    }

    return request({
      method: "GET",
      url: `/accounts/${zohoAccountId}/folders/${folderId}/messages/${messageId}/${resource}`,
      ...config,
    });
  }
}

async function markAsRead(zohoAccountId, messageId) {
  await request({
    method: "PUT",
    url: `/accounts/${zohoAccountId}/updatemessage`,
    data: {
      mode: "markAsRead",
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
  listAvailableAccounts,
  listOrganizationAccounts,
  markAsRead,
  moveToFolder,
  deleteMessage,
  replyToMessage,
  searchMessages,
  sendMessage,
  uploadAttachment,
};
