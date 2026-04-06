const TaskNotification = require("../models/TaskNotification");
const User = require("../models/User");
const { emitToUsers } = require("../socket");

const REVIEWER_ROLES = ["admin", "hr"];

async function createNotifications({ taskId, userIds, message }) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean).map(String))];

  if (!uniqueUserIds.length || !message) {
    return [];
  }

  const notifications = await TaskNotification.insertMany(
    uniqueUserIds.map((userId) => ({
      taskId,
      userId,
      message,
    }))
  );

  emitToUsers(uniqueUserIds, "notification:new", {
    taskId: String(taskId),
    message,
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
