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
    messageText: messageDoc.isDeleted ? "This message was deleted." : messageDoc.messageText,
    rawMessageText: messageDoc.messageText,
    isRead: Boolean(messageDoc.isRead),
    readAt: messageDoc.readAt,
    editedAt: messageDoc.editedAt,
    isDeleted: Boolean(messageDoc.isDeleted),
    deletedAt: messageDoc.deletedAt,
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
  };
}

function buildConversationSummary(conversationDoc, currentUserId, unreadCount, presenceMap) {
  const participants = Array.isArray(conversationDoc.participants) ? conversationDoc.participants : [];
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
    participants: participants.map((participant) => ({
      _id: String(participant._id),
      name: participant.name || participant.email || "User",
      email: participant.email || "",
      role: participant.role || "",
      department: participant.department || "",
      lastSeenAt: participant.lastSeenAt || null,
    })),
    counterpart: primaryParticipant
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
