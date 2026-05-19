const mongoose = require("mongoose");
const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const OrgHierarchy = require("../models/OrgHierarchy");
const {
  REVIEWER_ROLES,
  createNotifications,
  getReviewerUserIds,
} = require("../services/taskNotificationService");
const {
  canAssignTask,
  getAssignableUserIds,
  getSuperiorsForUser,
  isUserSuperiorTo,
  getSubordinatesForUser,
} = require("../utils/hierarchyUtils");
const {
  assignToQueue,
  progressTaskQueue,
  fetchUserQueue,
  getUserNextAvailableDate,
} = require("../services/taskQueueService");

const ALL_VALID_STATUSES = ["pending", "in_progress", "completed", "reviewed", "queued", "active"];

const TASK_POPULATE = [
  { path: "assignedBy", select: "name email role" },
  { path: "assignedTo", select: "name email role" },
  { path: "createdBy", select: "name email role department" },
  { path: "approvedBy", select: "name email role" },
  { path: "rejectedBy", select: "name email role" },
  { path: "statusHistory.changedBy", select: "name email role" },
  { path: "approvalHistory.performedBy", select: "name email role" },
];

function isReviewer(user) {
  return REVIEWER_ROLES.includes(user?.role);
}

function canAssignTasks(user) {
  return Boolean(user?._id);
}

function canLoadAssignableUsers(user) {
  return Boolean(user?._id);
}

function canViewAllTasks(user) {
  return user?.role === "super_user";
}

function canManageTask(user, task) {
  if (user?.role === "super_user") return true;
  if (user?.role === "admin") return true;
  if (task?.taskType === "self") {
    const creatorId = task?.createdBy?._id || task?.createdBy;
    return String(creatorId) === String(user._id);
  }
  const assignedById = task?.assignedBy?._id || task?.assignedBy;
  return String(assignedById) === String(user._id);
}

function canAccessTask(user, task) {
  if (canViewAllTasks(user)) return true;
  const assignedToId = task?.assignedTo?._id || task?.assignedTo;
  const assignedById = task?.assignedBy?._id || task?.assignedBy;
  const createdById = task?.createdBy?._id || task?.createdBy;

  return [assignedToId, assignedById, createdById]
    .filter(Boolean)
    .some((id) => String(id) === String(user._id));
}

async function writeTaskAudit({ action, performedBy, taskId, note = "", details = {} }) {
  return AuditLog.create({
    action,
    performedBy,
    userId: performedBy,
    entityType: "Task",
    entityId: taskId,
    note,
    details,
  });
}

async function getVisibleTaskUserIds(currentUser) {
  const assignableIds = await getAssignableUserIds(currentUser._id);
  if (assignableIds === "ALL") return "ALL";
  if (!Array.isArray(assignableIds)) return [];
  return assignableIds;
}

async function buildTaskQuery(query = {}, currentUser, options = {}) {
  const filter = {};
  const andFilters = [];
  const { status, role, priority, assignedTo, search, startDate, endDate } = query;

  if (!options.includeSelfTasks) {
    andFilters.push({ taskType: { $ne: "self" } });
  }

  if (options.onlyMine) {
    andFilters.push({ assignedTo: currentUser._id });
  } else if (!canViewAllTasks(currentUser)) {
    const descendantUserIds = await getVisibleTaskUserIds(currentUser);
    andFilters.push({
      $or: [
        { assignedTo: currentUser._id },
        { assignedBy: currentUser._id },
        ...(descendantUserIds.length ? [{ assignedTo: { $in: descendantUserIds } }] : []),
      ],
    });
  }

  if (status) andFilters.push({ status: { $in: status.split(",").filter(Boolean) } });
  if (role) andFilters.push({ role: { $in: role.split(",").filter(Boolean) } });
  if (priority) andFilters.push({ priority: { $in: priority.split(",").filter(Boolean) } });
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) andFilters.push({ assignedTo });

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

    const { title, description, assignedTo, priority, dueDate, estimatedHours } = req.body;

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

    const assignmentCheck = await canAssignTask(req.user._id, assignee._id, req.user.role);
    if (!assignmentCheck.allowed) {
      return res.status(403).json({ success: false, message: assignmentCheck.reason });
    }

    // ── Smart Queue Logic (Rule 1) ──
    const hours = estimatedHours != null ? Number(estimatedHours) : 8;
    const queueData = await assignToQueue(assignee._id, hours, dueDate);

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      assignedBy: req.user._id,
      assignedTo: assignee._id,
      createdBy: req.user._id,
      role: assignee.role,
      priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
      status: queueData.status,
      dueDate: new Date(dueDate),
      estimatedHours: hours,
      queuePosition: queueData.queuePosition,
      scheduledDate: queueData.scheduledDate,
      actualStartDate: queueData.actualStartDate,
      queuedAt: queueData.queuedAt,
      statusHistory: [
        {
          status: queueData.status,
          changedBy: req.user._id,
          note: queueData.status === "queued"
            ? `Task queued (position ${queueData.queuePosition}) for ${assignee.name || "user"}`
            : `Task assigned to ${assignee.name || "user"}`,
        },
      ],
    });

    await createNotifications({
      taskId: task._id,
      userIds: [assignee._id],
      message: queueData.status === "queued"
        ? `New task queued (position ${queueData.queuePosition}): ${task.title}`
        : `New task assigned: ${task.title}`,
    });

    const populatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create task", error: error.message });
  }
}

async function createSelfTask(req, res) {
  try {
    if (req.user.role === "super_user") {
      return res.status(403).json({ success: false, message: "Super users cannot create self tasks." });
    }

    const { title, description, priority, dueDate, estimatedHours } = req.body;
    const trimmedTitle = String(title || "").trim();
    const trimmedDescription = String(description || "").trim();

    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (trimmedTitle.length > 200) {
      return res.status(400).json({ success: false, message: "Title cannot exceed 200 characters" });
    }
    if (trimmedDescription.length > 2000) {
      return res.status(400).json({ success: false, message: "Description cannot exceed 2000 characters" });
    }
    if (dueDate) {
      const dueDateError = validateDueDate(dueDate);
      if (dueDateError) {
        return res.status(400).json({ success: false, message: dueDateError });
      }
    }

    const task = await Task.create({
      title: trimmedTitle,
      description: trimmedDescription,
      assignedBy: null,
      assignedTo: req.user._id,
      createdBy: req.user._id,
      role: req.user.role,
      priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
      status: "pending",
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours != null && estimatedHours !== "" ? Number(estimatedHours) : null,
      taskType: "self",
      selfTaskStatus: "draft",
      statusHistory: [
        {
          status: "pending",
          changedBy: req.user._id,
          note: "Self task created",
        },
      ],
    });

    await writeTaskAudit({
      action: "self_task_created",
      performedBy: req.user._id,
      taskId: task._id,
    });

    const populatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error("Create Self Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create self task", error: error.message });
  }
}

async function submitSelfTaskForApproval(req, res) {
  try {
    const task = await findTaskOr404(req.params.taskId, res);
    if (!task) return;

    if (task.taskType !== "self") {
      return res.status(400).json({ success: false, message: "Only self tasks can be submitted for approval" });
    }
    if (String(task.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the task creator can submit this task for approval" });
    }
    if (!["draft", "revision"].includes(task.selfTaskStatus)) {
      return res.status(400).json({ success: false, message: "This self task cannot be submitted in its current state" });
    }
    if (task.status !== "completed") {
      return res.status(400).json({ success: false, message: "Mark the task as complete before submitting for approval." });
    }

    const hierarchyEntry = await OrgHierarchy.findOne({ userId: req.user._id }).select("parentId").lean();
    if (!hierarchyEntry?.parentId) {
      return res.status(400).json({
        success: false,
        message: "You have no manager assigned. Contact HR to set up your reporting hierarchy before submitting self tasks.",
      });
    }

    const wasRevision = task.selfTaskStatus === "revision";
    task.selfTaskStatus = "pending_approval";
    task.submittedForApprovalAt = new Date();
    if (wasRevision) task.revisionCount += 1;
    task.approvalHistory.push({
      action: wasRevision ? "revised" : "submitted",
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await task.save();

    const superiorUserIds = await getSuperiorsForUser(req.user._id);
    if (superiorUserIds.length) {
      await createNotifications({
        taskId: task._id,
        userIds: superiorUserIds,
        message: `${req.user.name || "An employee"} submitted a self task for approval: ${task.title}`,
        targetPath: "/tasks?tab=pending-approvals",
        type: "self_task_approval_requested",
      });
    } else {
      const superUsers = await User.find({ role: "super_user", isDisabled: false }).select("_id").lean();
      await createNotifications({
        taskId: task._id,
        userIds: superUsers.map((user) => user._id),
        message: `${req.user.name || "An employee"} submitted a self task, but no active superior is available: ${task.title}`,
        targetPath: "/tasks?tab=pending-approvals",
        type: "self_task_approval_requested",
      });
    }

    await writeTaskAudit({
      action: wasRevision ? "self_task_revised" : "self_task_submitted",
      performedBy: req.user._id,
      taskId: task._id,
    });

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Submit Self Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit self task", error: error.message });
  }
}

async function approveSelfTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.taskId, res);
    if (!task) return;

    if (task.taskType !== "self" || task.selfTaskStatus !== "pending_approval") {
      return res.status(400).json({ success: false, message: "This self task is not pending approval" });
    }
    if (!(await isUserSuperiorTo(req.user._id, task.createdBy))) {
      return res.status(403).json({ success: false, message: "You are not authorised to approve this task." });
    }

    const note = String(req.body.note || "").trim().slice(0, 500);
    const reviewedAt = new Date();
    const updatedTask = await Task.findOneAndUpdate(
      { _id: task._id, selfTaskStatus: "pending_approval" },
      {
        $set: {
          selfTaskStatus: "approved",
          approvedBy: req.user._id,
          approvedAt: reviewedAt,
          approvalNote: note,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: "",
        },
        $push: {
          approvalHistory: {
            action: "approved",
            performedBy: req.user._id,
            performedAt: reviewedAt,
            note,
          },
        },
      },
      { new: true }
    ).populate(TASK_POPULATE).lean();

    if (!updatedTask) {
      return res.status(409).json({ success: false, message: "This task has already been reviewed." });
    }

    await createNotifications({
      taskId: task._id,
      userIds: [task.createdBy],
      message: `Your self task "${task.title}" has been approved by ${req.user.name || "your manager"}.`,
      targetPath: "/tasks?tab=self",
      type: "self_task_approved",
    });

    await writeTaskAudit({
      action: "self_task_approved",
      performedBy: req.user._id,
      taskId: task._id,
      note,
    });

    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Approve Self Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve self task", error: error.message });
  }
}

async function rejectSelfTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.taskId, res);
    if (!task) return;

    const reason = String(req.body.reason || "").trim();
    if (reason.length < 10) {
      return res.status(400).json({ success: false, message: "Rejection reason must be at least 10 characters" });
    }
    if (task.taskType !== "self" || task.selfTaskStatus !== "pending_approval") {
      return res.status(400).json({ success: false, message: "This self task is not pending approval" });
    }
    if (!(await isUserSuperiorTo(req.user._id, task.createdBy))) {
      return res.status(403).json({ success: false, message: "You are not authorised to approve this task." });
    }

    const reviewedAt = new Date();
    const updatedTask = await Task.findOneAndUpdate(
      { _id: task._id, selfTaskStatus: "pending_approval" },
      {
        $set: {
          selfTaskStatus: "rejected",
          rejectedBy: req.user._id,
          rejectedAt: reviewedAt,
          rejectionReason: reason.slice(0, 500),
          approvedBy: null,
          approvedAt: null,
          approvalNote: "",
        },
        $push: {
          approvalHistory: {
            action: "rejected",
            performedBy: req.user._id,
            performedAt: reviewedAt,
            note: reason.slice(0, 500),
          },
        },
      },
      { new: true }
    ).populate(TASK_POPULATE).lean();

    if (!updatedTask) {
      return res.status(409).json({ success: false, message: "This task has already been reviewed." });
    }

    await createNotifications({
      taskId: task._id,
      userIds: [task.createdBy],
      message: `Your self task "${task.title}" was rejected. Reason: ${reason.slice(0, 500)}`,
      targetPath: "/tasks?tab=self",
      type: "self_task_rejected",
    });

    await writeTaskAudit({
      action: "self_task_rejected",
      performedBy: req.user._id,
      taskId: task._id,
      note: reason.slice(0, 500),
    });

    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Reject Self Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject self task", error: error.message });
  }
}

async function getPendingApprovals(req, res) {
  try {
    const subordinateUserIds = await getSubordinatesForUser(req.user._id);
    const tasks = subordinateUserIds.length
      ? await Task.find({
          taskType: "self",
          selfTaskStatus: "pending_approval",
          createdBy: { $in: subordinateUserIds },
        })
          .populate(TASK_POPULATE)
          .sort({ submittedForApprovalAt: 1 })
          .lean()
      : [];

    return res.json({ success: true, tasks, total: tasks.length });
  } catch (error) {
    console.error("Get Pending Approvals Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending approvals", error: error.message });
  }
}

async function getMySelfTasks(req, res) {
  try {
    const filter = {
      taskType: "self",
      createdBy: req.user._id,
    };
    if (req.query.status) {
      filter.selfTaskStatus = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate(TASK_POPULATE)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, tasks, total: tasks.length });
  } catch (error) {
    console.error("Get My Self Tasks Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch self tasks", error: error.message });
  }
}

async function getTasks(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const filter = await buildTaskQuery(req.query, req.user);

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
    const filter = await buildTaskQuery(req.query, req.user, { onlyMine: true });
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

    const assignableIds = await getAssignableUserIds(req.user._id);
    const userQuery = {
      _id: { $ne: req.user._id },
      isDisabled: false,
    };

    if (req.user.role === "super_user" || assignableIds === "ALL") {
      userQuery.role = { $ne: "super_user" };
    } else if (Array.isArray(assignableIds)) {
      userQuery._id = { $in: assignableIds };
    } else {
      userQuery._id = { $in: [] };
    }

    const users = await User.find(userQuery)
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
    if (task.taskType === "self" && !["draft", "rejected", "revision"].includes(task.selfTaskStatus)) {
      return res.status(403).json({ success: false, message: "Only draft or rejected self tasks can be edited" });
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
      if (task.taskType === "self" && !dueDate) {
        task.dueDate = null;
      } else {
        const dueDateError = validateDueDate(dueDate);
        if (dueDateError) {
          return res.status(400).json({ success: false, message: dueDateError });
        }
        task.dueDate = new Date(dueDate);
      }
      task.reminderSentAt = null;
    }

    if (status !== undefined) {
      if (!ALL_VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      task.status = status;
    }

    if (req.body.estimatedHours !== undefined) {
      task.estimatedHours = Number(req.body.estimatedHours) || null;
    }

    task.statusHistory.push({
      status: task.status,
      changedBy: req.user._id,
      note: "Task details updated",
    });
    if (task.taskType === "self" && task.selfTaskStatus === "rejected") {
      task.selfTaskStatus = "revision";
      task.approvedBy = null;
      task.approvedAt = null;
      task.approvalNote = "";
      task.approvalHistory.push({
        action: "revised",
        performedBy: req.user._id,
        performedAt: new Date(),
        note: "Self task revised",
      });
    }

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update task", error: error.message });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You are not allowed to update this task" });
    }

    const { status } = req.body;
    if (!ALL_VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    task.status = status;
    if (status === "completed") task.completionTime = new Date();
    task.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: "Task status updated",
    });

    await task.save();

    // ── Queue Progression (Rule 1, Step 3) ──
    if (status === "completed") {
      try {
        await progressTaskQueue(task.assignedTo);
      } catch (queueErr) {
        console.error("Queue Progression Error (updateTaskStatus):", queueErr);
      }
    }

    const updatedTask = await Task.findById(task._id).populate(TASK_POPULATE).lean();
    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update task status", error: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await findTaskOr404(req.params.id, res);
    if (!task) return;

    if (!canManageTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You can only delete tasks that you assigned" });
    }
    if (task.taskType === "self" && !["draft", "rejected"].includes(task.selfTaskStatus)) {
      return res.status(403).json({ success: false, message: "Tasks pending or completed approval cannot be deleted." });
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

    // ── Queue Progression (Rule 1, Step 1-3) ──
    try {
      await progressTaskQueue(task.assignedTo);
    } catch (queueErr) {
      console.error("Queue Progression Error (completeTask):", queueErr);
    }

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

async function getUserQueue(req, res) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const queue = await fetchUserQueue(userId);
    const populatedQueue = await Task.populate(queue, TASK_POPULATE);
    const nextAvailable = await getUserNextAvailableDate(userId);

    return res.json({
      success: true,
      data: populatedQueue,
      nextAvailableDate: nextAvailable,
    });
  } catch (error) {
    console.error("Get User Queue Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user queue", error: error.message });
  }
}



module.exports = {
  createTask,
  createSelfTask,
  submitSelfTaskForApproval,
  approveSelfTask,
  rejectSelfTask,
  getPendingApprovals,
  getMySelfTasks,
  getTasks,
  getMyTasks,
  getAssignableUsers,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  setTaskTiming,
  completeTask,
  reviewTask,
  addTaskComment,
  getTaskComments,
  getUserQueue,
};
