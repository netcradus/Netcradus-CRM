const InternalMail = require("../models/InternalMail");
const User = require("../models/User");
const { emitToUsers } = require("../socket");
const fs = require("fs");
const path = require("path");

const sanitizeString = (str, max) => {
  return String(str || "").trim().substring(0, max);
};

// 1. Send Internal Mail
exports.sendMail = async (req, res) => {
  try {
    const { recipients, subject, body, draftId, replyTo, threadId } = req.body;

    let recipientIds = Array.isArray(recipients) ? recipients : [recipients];
    recipientIds = [...new Set(recipientIds.filter(Boolean).map(id => String(id).trim()))];

    if (recipientIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one recipient is required." });
    }

    // Validate active CRM users
    const activeUsers = await User.find({ _id: { $in: recipientIds }, isDisabled: { $ne: true } }).select("_id");
    if (activeUsers.length !== recipientIds.length) {
      return res.status(400).json({ success: false, message: "One or more selected recipients are invalid or inactive." });
    }

    const cleanSubject = sanitizeString(subject, 200);
    const cleanBody = sanitizeString(body, 10000);

    const attachments = (req.files || []).map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));

    let resolvedReplyTo = null;
    let resolvedThreadId = null;

    if (replyTo) {
      const originalMail = await InternalMail.findById(replyTo);
      if (!originalMail) {
        return res.status(404).json({ success: false, message: "Original mail not found." });
      }

      // Check if user has permission to access original mail
      const isSender = String(originalMail.sender) === String(req.user.id);
      const isRecipient = originalMail.recipients.some(r => String(r) === String(req.user.id));
      if (!isSender && !isRecipient) {
        return res.status(403).json({ success: false, message: "Unauthorized: You do not have permission to reply to this mail." });
      }

      // Validate the reply recipient matches original sender
      const originalSenderId = String(originalMail.sender);
      if (recipientIds.length !== 1 || recipientIds[0] !== originalSenderId) {
        return res.status(400).json({ success: false, message: "Reply recipient must match the original sender." });
      }

      // Verify sender is active
      const originalSenderUser = await User.findOne({ _id: originalSenderId, isDisabled: { $ne: true } });
      if (!originalSenderUser) {
        return res.status(400).json({ success: false, message: "The original sender is inactive or disabled." });
      }

      resolvedReplyTo = originalMail._id;
      resolvedThreadId = originalMail.threadId || originalMail._id;
    }

    let mail;

    if (draftId) {
      // Transition existing draft to sent
      mail = await InternalMail.findOne({ _id: draftId, sender: req.user.id, status: "draft" });
      if (!mail) {
        return res.status(404).json({ success: false, message: "Draft not found or unauthorized." });
      }
      mail.recipients = recipientIds;
      mail.subject = cleanSubject;
      mail.body = cleanBody;
      mail.status = "sent";
      mail.readBy = [req.user.id];
      if (resolvedReplyTo) mail.replyTo = resolvedReplyTo;
      if (resolvedThreadId) mail.threadId = resolvedThreadId;
      // Append any new attachments uploaded
      if (attachments.length > 0) {
        mail.attachments.push(...attachments);
      }
      await mail.save();
    } else {
      // Create new sent mail
      mail = new InternalMail({
        sender: req.user.id,
        recipients: recipientIds,
        subject: cleanSubject,
        body: cleanBody,
        attachments,
        status: "sent",
        readBy: [req.user.id],
        replyTo: resolvedReplyTo,
        threadId: resolvedThreadId
      });
      await mail.save();
    }

    // Emit Socket.IO event to all recipients
    emitToUsers(recipientIds, "new_mail", {
      _id: mail._id,
      subject: mail.subject,
      sender: {
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });

    return res.status(201).json({
      success: true,
      message: "Mail sent successfully.",
      data: mail
    });

  } catch (error) {
    console.error("sendMail error:", error);
    return res.status(500).json({ success: false, message: "Failed to send mail.", error: error.message });
  }
};

// 2. Save Draft
exports.saveDraft = async (req, res) => {
  try {
    const { recipients, subject, body, replyTo } = req.body;

    let recipientIds = [];
    if (recipients) {
      recipientIds = Array.isArray(recipients) ? recipients : [recipients];
      recipientIds = [...new Set(recipientIds.filter(Boolean).map(id => String(id).trim()))];
    }

    const cleanSubject = sanitizeString(subject, 200);
    const cleanBody = sanitizeString(body, 10000);

    const attachments = (req.files || []).map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));

    let resolvedReplyTo = null;
    let resolvedThreadId = null;

    if (replyTo) {
      const originalMail = await InternalMail.findById(replyTo);
      if (!originalMail) {
        return res.status(404).json({ success: false, message: "Original mail not found." });
      }
      const isSender = String(originalMail.sender) === String(req.user.id);
      const isRecipient = originalMail.recipients.some(r => String(r) === String(req.user.id));
      if (!isSender && !isRecipient) {
        return res.status(403).json({ success: false, message: "Unauthorized: You do not have permission to access original mail." });
      }
      resolvedReplyTo = originalMail._id;
      resolvedThreadId = originalMail.threadId || originalMail._id;
    }

    const draft = new InternalMail({
      sender: req.user.id,
      recipients: recipientIds,
      subject: cleanSubject,
      body: cleanBody,
      attachments,
      status: "draft",
      readBy: [req.user.id],
      replyTo: resolvedReplyTo,
      threadId: resolvedThreadId
    });

    await draft.save();

    return res.status(201).json({
      success: true,
      message: "Draft saved successfully.",
      data: draft
    });

  } catch (error) {
    console.error("saveDraft error:", error);
    return res.status(500).json({ success: false, message: "Failed to save draft.", error: error.message });
  }
};

// 3. Update Draft
exports.updateDraft = async (req, res) => {
  try {
    const { mailId } = req.params;
    const { recipients, subject, body, status, replyTo } = req.body;

    const draft = await InternalMail.findOne({ _id: mailId, sender: req.user.id, status: "draft" });
    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found or unauthorized." });
    }

    if (replyTo) {
      const originalMail = await InternalMail.findById(replyTo);
      if (originalMail) {
        draft.replyTo = originalMail._id;
        draft.threadId = originalMail.threadId || originalMail._id;
      }
    }

    if (recipients) {
      let recipientIds = Array.isArray(recipients) ? recipients : [recipients];
      draft.recipients = [...new Set(recipientIds.filter(Boolean).map(id => String(id).trim()))];
    }

    draft.subject = sanitizeString(subject || draft.subject, 200);
    draft.body = sanitizeString(body || draft.body, 10000);

    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
      draft.attachments.push(...attachments);
    }

    if (status === "sent") {
      if (draft.recipients.length === 0) {
        return res.status(400).json({ success: false, message: "At least one recipient is required to send." });
      }
      // Validate active recipients
      const activeUsers = await User.find({ _id: { $in: draft.recipients }, isDisabled: { $ne: true } }).select("_id");
      if (activeUsers.length !== draft.recipients.length) {
        return res.status(400).json({ success: false, message: "One or more recipients are invalid or inactive." });
      }

      draft.status = "sent";
      draft.readBy = [req.user.id];

      // Emit Socket
      emitToUsers(draft.recipients, "new_mail", {
        _id: draft._id,
        subject: draft.subject,
        sender: {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email
        }
      });
    }

    await draft.save();

    return res.json({
      success: true,
      message: draft.status === "sent" ? "Mail sent successfully." : "Draft updated successfully.",
      data: draft
    });

  } catch (error) {
    console.error("updateDraft error:", error);
    return res.status(500).json({ success: false, message: "Failed to update draft.", error: error.message });
  }
};

// 4. List Inbox
exports.listInbox = async (req, res) => {
  try {
    const mails = await InternalMail.find({
      recipients: req.user.id,
      status: "sent",
      deletedBy: { $ne: req.user.id }
    })
      .populate("sender", "_id name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: mails });
  } catch (error) {
    console.error("listInbox error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch inbox." });
  }
};

// 5. List Sent Mails
exports.listSent = async (req, res) => {
  try {
    const mails = await InternalMail.find({
      sender: req.user.id,
      status: "sent",
      deletedBy: { $ne: req.user.id }
    })
      .populate("recipients", "_id name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: mails });
  } catch (error) {
    console.error("listSent error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sent mails." });
  }
};

// 6. List Drafts
exports.listDrafts = async (req, res) => {
  try {
    const mails = await InternalMail.find({
      sender: req.user.id,
      status: "draft",
      deletedBy: { $ne: req.user.id }
    })
      .populate("recipients", "_id name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: mails });
  } catch (error) {
    console.error("listDrafts error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch drafts." });
  }
};

// 7. List Deleted
exports.listDeleted = async (req, res) => {
  try {
    const mails = await InternalMail.find({
      deletedBy: req.user.id
    })
      .populate("sender", "_id name email role")
      .populate("recipients", "_id name email role")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, data: mails });
  } catch (error) {
    console.error("listDeleted error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch deleted mails." });
  }
};

// 8. Read Single Mail
exports.readMail = async (req, res) => {
  try {
    const { mailId } = req.params;
    const mail = await InternalMail.findById(mailId)
      .populate("sender", "_id name email role")
      .populate("recipients", "_id name email role")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "_id name email role"
        }
      });

    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const isSender = String(mail.sender._id || mail.sender) === String(req.user.id);
    const isRecipient = mail.recipients.some(r => String(r._id || r) === String(req.user.id));

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    // Automatically mark read if recipient and not already marked
    if (isRecipient && !mail.readBy.some(id => String(id) === String(req.user.id))) {
      mail.readBy.push(req.user.id);
      await mail.save();
    }

    return res.json({ success: true, data: mail });
  } catch (error) {
    console.error("readMail error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve mail." });
  }
};

// 9. Mark Read / Unread
exports.toggleReadState = async (req, res) => {
  try {
    const { mailId } = req.params;
    const { isRead } = req.body;

    const mail = await InternalMail.findById(mailId);
    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const isRecipient = mail.recipients.some(r => String(r) === String(req.user.id));
    if (!isRecipient) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    const userIndex = mail.readBy.indexOf(req.user.id);

    if (isRead) {
      if (userIndex === -1) mail.readBy.push(req.user.id);
    } else {
      if (userIndex !== -1) mail.readBy.splice(userIndex, 1);
    }

    await mail.save();
    return res.json({ success: true, message: `Mail marked as ${isRead ? "read" : "unread"}.` });

  } catch (error) {
    console.error("toggleReadState error:", error);
    return res.status(500).json({ success: false, message: "Failed to update read state." });
  }
};

// 10. Star / Unstar
exports.toggleStarred = async (req, res) => {
  try {
    const { mailId } = req.params;
    const { isStarred } = req.body;

    const mail = await InternalMail.findById(mailId);
    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const isSender = String(mail.sender) === String(req.user.id);
    const isRecipient = mail.recipients.some(r => String(r) === String(req.user.id));

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    const userIndex = mail.starredBy.indexOf(req.user.id);

    if (isStarred) {
      if (userIndex === -1) mail.starredBy.push(req.user.id);
    } else {
      if (userIndex !== -1) mail.starredBy.splice(userIndex, 1);
    }

    await mail.save();
    return res.json({ success: true, message: `Mail ${isStarred ? "starred" : "unstarred"}.` });

  } catch (error) {
    console.error("toggleStarred error:", error);
    return res.status(500).json({ success: false, message: "Failed to update starred state." });
  }
};

// 11. Soft Delete
exports.softDelete = async (req, res) => {
  try {
    const { mailId } = req.params;
    const mail = await InternalMail.findById(mailId);

    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const isSender = String(mail.sender) === String(req.user.id);
    const isRecipient = mail.recipients.some(r => String(r) === String(req.user.id));

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    if (!mail.deletedBy.some(id => String(id) === String(req.user.id))) {
      mail.deletedBy.push(req.user.id);
      await mail.save();
    }

    return res.json({ success: true, message: "Mail moved to deleted items." });

  } catch (error) {
    console.error("softDelete error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete mail." });
  }
};

// 12. Restore deleted mail
exports.restoreMail = async (req, res) => {
  try {
    const { mailId } = req.params;
    const mail = await InternalMail.findById(mailId);

    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const deleteIndex = mail.deletedBy.indexOf(req.user.id);
    if (deleteIndex === -1) {
      return res.status(400).json({ success: false, message: "Mail is not in deleted items." });
    }

    mail.deletedBy.splice(deleteIndex, 1);
    await mail.save();

    return res.json({ success: true, message: "Mail restored successfully." });

  } catch (error) {
    console.error("restoreMail error:", error);
    return res.status(500).json({ success: false, message: "Failed to restore mail." });
  }
};

// 13. Download Attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { mailId, attachmentId } = req.params;
    const mail = await InternalMail.findById(mailId);

    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail not found." });
    }

    const isSender = String(mail.sender) === String(req.user.id);
    const isRecipient = mail.recipients.some(r => String(r) === String(req.user.id));

    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    const attachment = mail.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found." });
    }

    const filePath = path.resolve(attachment.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File does not exist on disk." });
    }

    res.download(filePath, attachment.originalname);

  } catch (error) {
    console.error("downloadAttachment error:", error);
    return res.status(500).json({ success: false, message: "Failed to download attachment." });
  }
};

// 14. Get Unread Count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await InternalMail.countDocuments({
      recipients: req.user.id,
      status: "sent",
      deletedBy: { $ne: req.user.id },
      readBy: { $ne: req.user.id }
    });

    return res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve unread count." });
  }
};

// 15. Get Active Users List for Compose field
exports.getActiveUsers = async (req, res) => {
  try {
    const users = await User.find({ isDisabled: { $ne: true } })
      .select("_id name email role designation department")
      .lean();
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("getActiveUsers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user directory." });
  }
};
