const TaskNotification = require("../models/TaskNotification");

async function getNotifications(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const [notifications, unreadCount] = await Promise.all([
      TaskNotification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .maxTimeMS(2000)
        .lean(),
      TaskNotification.countDocuments({
        userId: req.user._id,
        isRead: false,
      }).maxTimeMS(2000),
    ]);

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
}

async function markNotificationRead(req, res) {
  try {
    const notification = await TaskNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notification", error: error.message });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await TaskNotification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications", error: error.message });
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
