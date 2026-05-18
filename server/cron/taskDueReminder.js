const Task = require("../models/Task");
const { createNotifications } = require("../services/taskNotificationService");

async function taskDueReminder() {
  try {
    const now = new Date();
    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: next24Hours },
      status: { $nin: ["completed", "reviewed"] },
      $or: [{ reminderSentAt: null }, { reminderSentAt: { $exists: false } }],
    }).select("_id title assignedTo").lean();

    for (const task of tasks) {
      await createNotifications({
        taskId: task._id,
        userIds: [task.assignedTo],
        message: `Reminder: "${task.title}" is due within 24 hours`,
      });

    }

    if (tasks.length) {
      await Task.updateMany(
        { _id: { $in: tasks.map((task) => task._id) } },
        { $set: { reminderSentAt: new Date() } }
      );
    }

    if (tasks.length > 0) {
      console.log(`[CRON taskDueReminder] Created ${tasks.length} reminder notification(s).`);
    }

    return tasks.length;
  } catch (error) {
    console.error("[CRON taskDueReminder] Error:", error.message);
    return 0;
  }
}

module.exports = taskDueReminder;
