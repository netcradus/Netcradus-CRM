// services/notificationService.js

const TaskNotification = require("../models/TaskNotification");
const User = require("../models/User");
const { emitToUsers } = require("../socket");

const REVIEWER_ROLES = ["super_user", "hr"];

/**
 * Create notifications for one or more users and emit them via socket.
 *
 * @param {Object} params
 * @param {String|ObjectId|null} params.taskId
 * @param {Array<String|ObjectId>} params.userIds
 * @param {String} params.message
 * @param {String} params.targetPath
 * @param {String} params.type
 */
async function createNotifications({
  taskId = null,
  userIds,
  message,
  targetPath = "",
  type = "general",
}) {
  const uniqueUserIds = [
    ...new Set((userIds || []).filter(Boolean).map(String)),
  ];

  if (!uniqueUserIds.length || !message) {
    return [];
  }

  const notifications = await TaskNotification.insertMany(
    uniqueUserIds.map((userId) => ({
      taskId,
      userId,
      message,
      targetPath,
      type,
    }))
  );

  // Real-time socket event
  emitToUsers(uniqueUserIds, "notification:new", {
    taskId: taskId ? String(taskId) : null,
    message,
    targetPath,
    type,
  });

  return notifications;
}

/**
 * Get all reviewer user IDs.
 * Reviewers = super_user + hr
 */
async function getReviewerUserIds() {
  const users = await User.find({
    role: { $in: REVIEWER_ROLES },
  })
    .select("_id")
    .lean();

  return users.map((user) => String(user._id));
}

/**
 * Notify reviewers when a task is completed.
 *
 * @param {Object} task - Populated task document
 */
async function notifyTaskCompleted(task) {
  if (!task) return [];

  const reviewerUserIds = await getReviewerUserIds();

  if (!reviewerUserIds.length) return [];

  const completedBy =
    task.assignedTo?.name ||
    task.assignedTo?.fullName ||
    "A user";

  return createNotifications({
    taskId: task._id,
    userIds: reviewerUserIds,
    message: `Task "${task.title}" has been marked as completed by ${completedBy}.`,
    targetPath: `/tasks/${task._id}`,
    type: "task_completed",
  });
}

module.exports = {
  REVIEWER_ROLES,
  createNotifications,
  getReviewerUserIds,
  notifyTaskCompleted,
};