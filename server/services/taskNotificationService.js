const TaskNotification = require("../models/TaskNotification");
const User = require("../models/User");
const { emitToUsers } = require("../socket");

const REVIEWER_ROLES = ["super_user", "hr"];

async function createNotifications({ taskId = null, userIds, message, targetPath = "" }) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean).map(String))];

  if (!uniqueUserIds.length || !message) {
    return [];
  }

  const notifications = await TaskNotification.insertMany(
    uniqueUserIds.map((userId) => ({
      taskId,
      userId,
      message,
      targetPath,
    }))
  );

  emitToUsers(uniqueUserIds, "notification:new", {
    taskId: taskId ? String(taskId) : null,
    message,
    targetPath,
  });

  return notifications;
}

async function getReviewerUserIds() {
  const users = await User.find({ role: { $in: REVIEWER_ROLES } }).select("_id").lean();
  return users.map((user) => String(user._id));
}

module.exports = {
  REVIEWER_ROLES,
  createNotifications,
  getReviewerUserIds,
};
