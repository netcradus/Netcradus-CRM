const mongoose = require("mongoose");
const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const User = require("../models/User");
const {
  REVIEWER_ROLES,
  createNotifications,
  getReviewerUserIds,
} = require("../services/taskNotificationService");

const TASK_POPULATE = [
  { path: "assignedBy", select: "name email role" },
  { path: "assignedTo", select: "name email role" },
  { path: "statusHistory.changedBy", select: "name email role" },
];

function isReviewer(user) {
  return REVIEWER_ROLES.includes(user?.role);
}

function canAssignTasks(user) {
  return ["super_user", "admin"].includes(user?.role);
}

function canLoadAssignableUsers(user) {
  return ["super_user", "admin", "hr"].includes(user?.role);
}

function canViewAllTasks(user) {
  return user?.role === "super_user" || isReviewer(user);
}

function isAdminScopedManager(user) {
  return user?.role === "admin";
}

function canManageTask(user, task) {
  if (user?.role === "super_user") return true;
  if (!isAdminScopedManager(user)) return false;
  return String(task.assignedBy) === String(user._id);
}

function canAccessTask(user, task) {
  if (canViewAllTasks(user)) return true;
  const assignedToId = task?.assignedTo?._id || task?.assignedTo;
  const assignedById = task?.assignedBy?._id || task?.assignedBy;

  return [assignedToId, assignedById]
    .filter(Boolean)
    .some((id) => String(id) === String(user._id));
}

function buildTaskQuery(query = {}, currentUser, options = {}) {
  const filter = {};
  const andFilters = [];
  const { status, role, priority, search, startDate, endDate } = query;

  if (options.onlyMine) {
    andFilters.push({ assignedTo: currentUser._id });
  } else if (isAdminScopedManager(currentUser)) {
    andFilters.push({
      $or: [
        { assignedTo: currentUser._id },
        { assignedBy: currentUser._id },
      ],
    });
  } else if (!canViewAllTasks(currentUser)) {
    andFilters.push({ assignedTo: currentUser._id });
  }

  if (status) andFilters.push({ status: { $in: status.split(",").filter(Boolean) } });
  if (role) andFilters.push({ role: { $in: role.split(",").filter(Boolean) } });
  if (priority) andFilters.push({ priority: { $in: priority.split(",").filter(Boolean) } });

  if (startDate || endDate) {
    const dueDateFilter = {};
    if (startDate) {
      dueDateFilter.$gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      const nextDay = new Date(`${endDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      dueDateFilter.$lt = nextDay;
    }
    andFilters.push({ dueDate: dueDateFilter });
  }

  if (search) {
    andFilters.push({
      $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (andFilters.length === 1) {
    return andFilters[0];
  }
  if (andFilters.length > 1) {
    filter.$and = andFilters;
  }

  return filter;
}

async function findTaskOr404(taskId, res) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    res.status(400).json({ success: false, message: "Invalid task ID" });
    return null;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return null;
  }

  return task;
}

function validateDueDate(dueDate) {
  if (!dueDate) return "Due date is required";
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return "Invalid due date";
  if (parsed.getTime() < Date.now() - 60000) return "Due date cannot be in the past";
  return "";
}

async function createTask(req, res) {
  try {
    if (!canAssignTasks(req.user)) {
      return res.status(403).json({ success: false, message: "Only Super Users and Administrators can create tasks" });
    }

    const { title, description, assignedTo, priority, dueDate, status } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: "Assigned user is required" });
    }

    const dueDateError = validateDueDate(dueDate);
    if (dueDateError) {
      return res.status(400).json({ success: false, message: dueDateError });
    }

    const assignee = await User.findById(assignedTo).select("_id name role");
    if (!assignee) {
      return res.status(404).json({ success: false, message: "Assigned user not found" });
    }

    const normalizedStatus = ["pending", "in_progress"].includes(status) ? status : "pending";

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      assignedBy: req.user._id,
      assignedTo: assignee._id,
      role: assignee.role,
      priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
      status: normalizedStatus,
      dueDate: new Date(dueDate),
      statusHistory: [
        {
          status: normalizedStatus,
          changedBy: req.user._id,
          note: `Task assigned to ${assignee.name || "user"}`,
        },
      ],
    });

    await createNotifications({
      taskId: task._id,
      userIds: [assignee._id],
      message: `New task assigned: ${task.title}`,
    });

    const populatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create task", error: error.message });
  }
}

async function getTasks(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const filter = buildTaskQuery(req.query, req.user);

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .populate(TASK_POPULATE)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: tasks,
      pagination: {
        totalTasks,
        totalPages: Math.ceil(totalTasks / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
  }
}

async function getMyTasks(req, res) {
  try {
    const filter = buildTaskQuery(req.query, req.user, { onlyMine: true });
    const tasks = await Task.find(filter)
      .populate(TASK_POPULATE)
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .lean();

    return res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Get My Tasks Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your tasks", error: error.message });
  }
}

async function getAssignableUsers(req, res) {
  try {
    if (!canLoadAssignableUsers(req.user)) {
      return res.status(403).json({ success: false, message: "You are not allowed to load assignable users" });
    }

    const users = await User.find({ role: { $ne: "super_user" } })
      .select("_id name email role")
      .sort({ name: 1, email: 1 })
      .lean();

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get Assignable Users Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignable users", error: error.message });
  }
}

async function getTaskById(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You are not allowed to view this task" });
    }

    const populatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: populatedTask });
  } catch (error) {
    console.error("Get Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch task", error: error.message });
  }
}

async function updateTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canManageTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You can only update tasks that you assigned" });
    }

    const { title, description, dueDate, priority, status } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ success: false, message: "Title cannot be empty" });
      }
      task.title = String(title).trim();
    }

    if (description !== undefined) {
      task.description = String(description || "").trim();
    }

    if (priority !== undefined) {
      if (!["low", "medium", "high", "urgent"].includes(priority)) {
        return res.status(400).json({ success: false, message: "Invalid priority value" });
      }
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      const dueDateError = validateDueDate(dueDate);
      if (dueDateError) {
        return res.status(400).json({ success: false, message: dueDateError });
      }
      task.dueDate = new Date(dueDate);
      task.reminderSentAt = null;
    }

    if (status !== undefined) {
      if (!["pending", "in_progress", "completed", "reviewed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      task.status = status;
    }

    task.statusHistory.push({
      status: task.status,
      changedBy: req.user._id,
      note: "Task details updated",
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update task", error: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canManageTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You can only delete tasks that you assigned" });
    }

    await Promise.all([
      Task.findByIdAndDelete(task._id),
      TaskComment.deleteMany({ taskId: task._id }),
    ]);

    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete task", error: error.message });
  }
}

async function setTaskTiming(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assignee can set timing" });
    }

    const estimatedDuration = String(req.body.estimatedDuration || "").trim();
    if (!estimatedDuration) {
      return res.status(400).json({ success: false, message: "Estimated duration is required" });
    }

    task.estimatedDuration = estimatedDuration;
    if (task.status === "pending") {
      task.status = "in_progress";
    }
    task.statusHistory.push({
      status: task.status,
      changedBy: req.user._id,
      note: `Estimated duration set to ${estimatedDuration}`,
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Set Task Timing Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update estimated duration", error: error.message });
  }
}

async function completeTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assignee can complete this task" });
    }

    task.status = "completed";
    task.completionTime = new Date();
    task.statusHistory.push({
      status: "completed",
      changedBy: req.user._id,
      note: "Task marked as complete",
    });

    await task.save();

    const reviewerUserIds = await getReviewerUserIds();
    await createNotifications({
      taskId: task._id,
      userIds: [...reviewerUserIds, task.assignedBy],
      message: `${req.user.name || "An employee"} completed task: ${task.title}`,
    });

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Complete Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to complete task", error: error.message });
  }
}

async function reviewTask(req, res) {
  try {
    if (!isReviewer(req.user)) {
      return res.status(403).json({ success: false, message: "Only Super Users or HR can review tasks" });
    }

    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    task.status = "reviewed";
    task.reviewedAt = new Date();
    task.statusHistory.push({
      status: "reviewed",
      changedBy: req.user._id,
      note: "Task reviewed",
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Review Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to review task", error: error.message });
  }
}

async function addTaskComment(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You are not allowed to comment on this task" });
    }

    const commentText = String(req.body.comment || "").trim();
    if (!commentText) {
      return res.status(400).json({ success: false, message: "Comment is required" });
    }

    const comment = await TaskComment.create({
      taskId: task._id,
      commentedBy: req.user._id,
      comment: commentText,
    });

    const isAssigneeCommenter = String(task.assignedTo) === String(req.user._id);

    task.statusHistory.push({
      status: task.status,
      changedBy: req.user._id,
      note: isAssigneeCommenter ? "Assignee comment added" : "Review comment added",
    });
    await task.save();

    try {
      let notificationUserIds = [];

      if (!isAssigneeCommenter) {
        notificationUserIds = [task.assignedTo];
      } else {
        const reviewerUserIds = await getReviewerUserIds();
        notificationUserIds = [
          task.assignedBy,
          ...reviewerUserIds,
        ];
      }

      await createNotifications({
        taskId: task._id,
        userIds: notificationUserIds,
        message: isReviewer(req.user)
          ? `New review comment on task: ${task.title}`
          : `${req.user.name || "An employee"} commented on task: ${task.title}`,
      });
    } catch (notificationError) {
      console.error("Task Comment Notification Error:", notificationError);
    }

    const populatedComment = await TaskComment.findById(comment._id)
      .populate("commentedBy", "name email role")
      .lean();

    return res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    console.error("Add Task Comment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to add comment", error: error.message });
  }
}

async function getTaskComments(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You are not allowed to view these comments" });
    }

    const comments = await TaskComment.find({ taskId: task._id })
      .populate("commentedBy", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, data: comments });
  } catch (error) {
    console.error("Get Task Comments Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch comments", error: error.message });
  }
}

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  getAssignableUsers,
  getTaskById,
  updateTask,
  deleteTask,
  setTaskTiming,
  completeTask,
  reviewTask,
  addTaskComment,
  getTaskComments,
};
