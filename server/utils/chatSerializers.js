function normalizeMessage(messageDoc) {
  if (!messageDoc) return null;

  const sender = messageDoc.senderId && typeof messageDoc.senderId === "object"
    ? {
        _id: String(messageDoc.senderId._id || messageDoc.senderId),
        name: messageDoc.senderId.name || "Unknown user",
        email: messageDoc.senderId.email || "",
      }
    : {
        _id: String(messageDoc.senderId),
        name: "Unknown user",
        email: "",
      };

  return {
    _id: String(messageDoc._id),
    conversationId: String(messageDoc.conversationId),
    sender,
    messageText: (() => {
      if (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) return "This message was deleted.";
      if (messageDoc.messageText) return messageDoc.messageText;
      if (messageDoc.messageType === "image") return "Photo";
      if (messageDoc.messageType === "archive") return messageDoc.fileName || "Archive";
      if (messageDoc.fileUrl) return messageDoc.fileName || "Document";
      return "";
    })(),
    rawMessageText: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? "This message was deleted." : (messageDoc.messageText || ""),
    fileUrl: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? "" : (messageDoc.fileUrl || ""),
    fileName: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? "" : (messageDoc.fileName || ""),
    fileSize: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? 0 : (messageDoc.fileSize || 0),
    mimeType: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? "" : (messageDoc.mimeType || ""),
    messageType: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone) ? "text" : (messageDoc.messageType || "text"),
    isRead: Boolean(messageDoc.isRead),
    readAt: messageDoc.readAt,
    readBy: Array.isArray(messageDoc.readBy) ? messageDoc.readBy.map(String) : [],
    editedAt: messageDoc.editedAt,
    isDeleted: Boolean(messageDoc.isDeleted || messageDoc.isDeletedForEveryone),
    deletedAt: messageDoc.deletedAt,
    isForwarded: Boolean(messageDoc.isForwarded),
    isDeletedForEveryone: Boolean(messageDoc.isDeletedForEveryone),
    deletedBy: messageDoc.deletedBy ? String(messageDoc.deletedBy) : null,
    deletedFor: Array.isArray(messageDoc.deletedFor) ? messageDoc.deletedFor.map(d => String(d.userId)) : [],
    reactions: (messageDoc.isDeleted || messageDoc.isDeletedForEveryone)
      ? []
      : Array.isArray(messageDoc.reactions)
      ? messageDoc.reactions.map(r => ({
          userId: String(r.userId),
          emoji: r.emoji,
          reactedAt: r.reactedAt
        }))
      : [],
    replyTo: messageDoc.replyTo && typeof messageDoc.replyTo === "object"
      ? {
          _id: String(messageDoc.replyTo._id),
          senderName: messageDoc.replyTo.senderId && typeof messageDoc.replyTo.senderId === "object"
            ? messageDoc.replyTo.senderId.name || "User"
            : "User",
          messageText: (messageDoc.replyTo.isDeleted || messageDoc.replyTo.isDeletedForEveryone)
            ? "This message was deleted."
            : (messageDoc.replyTo.messageText || ""),
          fileUrl: (messageDoc.replyTo.isDeleted || messageDoc.replyTo.isDeletedForEveryone) ? "" : (messageDoc.replyTo.fileUrl || ""),
          fileName: (messageDoc.replyTo.isDeleted || messageDoc.replyTo.isDeletedForEveryone) ? "" : (messageDoc.replyTo.fileName || ""),
          messageType: (messageDoc.replyTo.isDeleted || messageDoc.replyTo.isDeletedForEveryone) ? "text" : (messageDoc.replyTo.messageType || "text")
        }
      : null,
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
  };
}

function buildConversationSummary(conversationDoc, currentUserId, unreadCount, presenceMap) {
  const participants = Array.isArray(conversationDoc.participants) ? conversationDoc.participants : [];
  const isGroup = Boolean(conversationDoc.isGroup);
  const otherParticipants = participants.filter(
    (participant) => String(participant._id) !== String(currentUserId)
  );
  const primaryParticipant = otherParticipants[0] || participants[0];
  const primaryId = primaryParticipant ? String(primaryParticipant._id) : "";
  const presence = presenceMap[primaryId] || {
    userId: primaryId,
    isOnline: false,
    lastSeen: primaryParticipant?.lastSeenAt || null,
  };

  return {
    _id: String(conversationDoc._id),
    isGroup,
    groupName: conversationDoc.groupName || "",
    displayName: isGroup
      ? conversationDoc.groupName || otherParticipants.map((participant) => participant.name || participant.email || "User").join(", ")
      : primaryParticipant?.name || primaryParticipant?.email || "User",
    participants: participants.map((participant) => ({
      _id: String(participant._id),
      name: participant.name || participant.email || "User",
      email: participant.email || "",
      role: participant.role || "",
      department: participant.department || "",
      lastSeenAt: participant.lastSeenAt || null,
      isOnline: Boolean(presenceMap[String(participant._id)]?.isOnline),
    })),
    counterpart: !isGroup && primaryParticipant
      ? {
          _id: primaryId,
          name: primaryParticipant.name || primaryParticipant.email || "User",
          email: primaryParticipant.email || "",
          role: primaryParticipant.role || "",
          department: primaryParticipant.department || "",
          lastSeenAt: primaryParticipant.lastSeenAt || null,
          isOnline: Boolean(presence.isOnline),
        }
      : null,
    unreadCount,
    lastMessage: normalizeMessage(conversationDoc.lastMessageId),
    lastMessageAt: conversationDoc.lastMessageAt,
    createdAt: conversationDoc.createdAt,
    updatedAt: conversationDoc.updatedAt,
  };
}

module.exports = {
  buildConversationSummary,
  normalizeMessage,
};
