/**
 * taskQueueService.js
 *
 * Smart Task Queue & Scheduling Service
 *
 * KEY DESIGN RULE:
 *   Only tasks with status "queued" or "active" are managed by the queue system.
 *   Legacy tasks in "pending" / "in_progress" are intentionally LEFT ALONE.
 *   This prevents the queue from interfering with tasks created before this
 *   feature was introduced.
 */

const Task = require("../models/Task");
const { nextWorkingDay, addWorkingDays, getTodayShiftDate } = require("../utils/dateUtils");

const HOURS_PER_DAY = 8;

/**
 * Statuses that ARE managed by the queue system.
 * Only these are touched when recalculating positions.
 */
const QUEUE_MANAGED_STATUSES = ["queued", "active"];

/**
 * All statuses that represent "user has work to do" — used for the API
 * display endpoint only, not for queue logic.
 */
const ALL_PENDING_STATUSES = ["queued", "active", "pending", "in_progress"];

/* ─────────────────────────────────────────────────────────────
   RULE 2 + 3  — scheduling math
───────────────────────────────────────────────────────────── */

/**
 * Calculate the scheduledDate for the NEXT task in queue,
 * given information about the PREVIOUS task.
 *
 * @param {Object} previousTask  – must have: scheduledDate, estimatedHours, dueDate
 * @returns {Date}
 */
function calculateNextTaskDate(previousTask) {
  const { scheduledDate, estimatedHours = HOURS_PER_DAY, dueDate } = previousTask;
  const baseDate = scheduledDate ? new Date(scheduledDate) : getTodayShiftDate();

  // RULE 3 — if dueDate is further out than estimatedHours would naturally end,
  // treat dueDate as the blocking end of this task's calendar slot.
  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    const naturalEndMs =
      baseDate.getTime() + Math.ceil(estimatedHours / HOURS_PER_DAY) * 86400000;

    if (dueDateObj.getTime() > naturalEndMs) {
      return nextWorkingDay(dueDateObj);
    }
  }

  // RULE 2 — full day (≤ 8h) → next working day; multi-day → add days needed
  if (estimatedHours <= 8) {
    return nextWorkingDay(baseDate);
  }

  const daysNeeded = Math.ceil(estimatedHours / HOURS_PER_DAY);
  return addWorkingDays(baseDate, daysNeeded);
}

/* ─────────────────────────────────────────────────────────────
   Internal — fetch ONLY queue-managed tasks (queued / active)
   sorted correctly
───────────────────────────────────────────────────────────── */
async function fetchManagedQueue(userId) {
  return Task.find({
    assignedTo: userId,
    taskType: { $ne: "self" },
    status: { $in: QUEUE_MANAGED_STATUSES },
  })
    .sort({ queuePosition: 1, createdAt: 1 })
    .lean();
}

/* ─────────────────────────────────────────────────────────────
   Public — fetch ALL pending tasks for a user (for display/API)
───────────────────────────────────────────────────────────── */
async function fetchUserQueue(userId) {
  return Task.find({
    assignedTo: userId,
    taskType: { $ne: "self" },
    status: { $in: ALL_PENDING_STATUSES },
  })
    .sort({ queuePosition: 1, createdAt: 1 })
    .lean();
}

/* ─────────────────────────────────────────────────────────────
   Recalculate positions + scheduled dates for queue-managed tasks
   ONLY — never touches pending/in_progress tasks.
───────────────────────────────────────────────────────────── */
async function recalculateQueue(userId) {
  const managedTasks = await fetchManagedQueue(userId);
  if (!managedTasks.length) return;

  const today = getTodayShiftDate();
  let prevTask = null;

  for (let i = 0; i < managedTasks.length; i++) {
    const task = managedTasks[i];
    const isFirst = i === 0;

    // Status: first → "active"; rest → "queued"
    const newStatus = isFirst ? "active" : "queued";

    // ── FIX: active task always gets position null (it is not "in queue")
    //         queued tasks are numbered from 1 among themselves
    const newPosition = isFirst ? null : i; // i=1 → #1 in queue, i=2 → #2, etc.

    // Scheduled date
    let newScheduledDate;
    if (isFirst) {
      newScheduledDate = task.actualStartDate
        ? new Date(task.actualStartDate)
        : today;
    } else {
      newScheduledDate = calculateNextTaskDate(prevTask);
    }

    // Write only if something actually changed
    const posChanged = task.queuePosition !== newPosition;
    const statusChanged = task.status !== newStatus;
    const dateChanged =
      String(task.scheduledDate ? new Date(task.scheduledDate).toISOString() : null) !==
      String(newScheduledDate ? newScheduledDate.toISOString() : null);

    if (posChanged || statusChanged || dateChanged) {
      const update = {
        queuePosition: newPosition,
        status: newStatus,
        scheduledDate: newScheduledDate,
      };
      if (isFirst && !task.actualStartDate) {
        update.actualStartDate = today;
      }
      await Task.findByIdAndUpdate(task._id, update);
    }

    prevTask = {
      scheduledDate: newScheduledDate,
      estimatedHours: task.estimatedHours || HOURS_PER_DAY,
      dueDate: task.dueDate,
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   RULE 1 — Queue assignment (called from createTask)
───────────────────────────────────────────────────────────── */

/**
 * Determine the correct status, queuePosition, scheduledDate and queuedAt
 * for a NEW task being assigned to a user.
 *
 * FIX: Active task gets queuePosition = null (it is NOT "in queue").
 *      Queued tasks are numbered 1, 2, 3... among themselves only.
 *      This means the first queued task is always #1, regardless of the
 *      active task existing.
 */
async function assignToQueue(userId, estimatedHours, dueDate) {
  const today = getTodayShiftDate();

  // Only look at queue-managed tasks (active + queued)
  const managedTasks = await fetchManagedQueue(userId);

  // Check if user already has an active task
  const hasActiveTask = managedTasks.some((t) => t.status === "active");

  // No queue-managed tasks at all → assign immediately as active
  if (!managedTasks.length) {
    return {
      status: "active",
      queuePosition: null, // FIX: active task has no queue position
      scheduledDate: today,
      actualStartDate: today,
      queuedAt: null,
    };
  }

  // User already has queue-managed tasks → queue the new one
  // Count only currently QUEUED tasks (not the active one) for position
  const currentlyQueuedCount = managedTasks.filter((t) => t.status === "queued").length;

  // Schedule after the last task in the entire managed queue
  const lastTask = managedTasks[managedTasks.length - 1];
  const scheduledDate = calculateNextTaskDate({
    scheduledDate: lastTask.scheduledDate || today,
    estimatedHours: lastTask.estimatedHours || HOURS_PER_DAY,
    dueDate: lastTask.dueDate,
  });

  return {
    status: "queued",
    queuePosition: currentlyQueuedCount + 1, // FIX: #1 in queue if no other queued tasks
    scheduledDate,
    actualStartDate: null,
    queuedAt: new Date(),
  };
}

/* ─────────────────────────────────────────────────────────────
   RULE 1 — Queue progression (called when a task is completed)
───────────────────────────────────────────────────────────── */

/**
 * Called whenever a task is marked completed.
 * Promotes the first "queued" task to "active" and renumbers the rest.
 *
 * FIX: Promoted task gets queuePosition = null (it becomes active, not queued).
 *      Remaining queued tasks are renumbered from 1.
 */
async function progressTaskQueue(userId) {
  const today = getTodayShiftDate();

  const queuedTasks = await Task.find({
    assignedTo: userId,
    taskType: { $ne: "self" },
    status: "queued",
  })
    .sort({ queuePosition: 1, createdAt: 1 })
    .lean();

  if (!queuedTasks.length) return; // Queue is now empty

  let prevTask = null;

  for (let i = 0; i < queuedTasks.length; i++) {
    const task = queuedTasks[i];
    const isFirst = i === 0;

    const newStatus = isFirst ? "active" : "queued";
    // FIX: promoted task → null position; remaining → 1-based among queued only
    const newPosition = isFirst ? null : i; // i=1 → #1, i=2 → #2, etc.

    let newScheduledDate;
    if (isFirst) {
      newScheduledDate = today;
    } else {
      newScheduledDate = calculateNextTaskDate(prevTask);
    }

    const update = {
      queuePosition: newPosition,
      status: newStatus,
      scheduledDate: newScheduledDate,
    };
    if (isFirst) update.actualStartDate = today;

    await Task.findByIdAndUpdate(task._id, update);

    prevTask = {
      scheduledDate: newScheduledDate,
      estimatedHours: task.estimatedHours || HOURS_PER_DAY,
      dueDate: task.dueDate,
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   Utility — next available date for a user (frontend preview)
───────────────────────────────────────────────────────────── */

/**
 * Returns the date after which a user will be free for a new task.
 * Only considers queue-managed tasks (queued / active).
 * Returns null if the user has no managed tasks (available now).
 */
async function getUserNextAvailableDate(userId) {
  const lastTask = await Task.findOne({
    assignedTo: userId,
    taskType: { $ne: "self" },
    status: { $in: QUEUE_MANAGED_STATUSES },
  })
    .sort({ queuePosition: -1, createdAt: -1 })
    .lean();

  if (!lastTask) return null; // User is free now

  return calculateNextTaskDate({
    scheduledDate: lastTask.scheduledDate || new Date(),
    estimatedHours: lastTask.estimatedHours || HOURS_PER_DAY,
    dueDate: lastTask.dueDate,
  });
}

module.exports = {
  assignToQueue,
  progressTaskQueue,
  recalculateQueue,
  calculateNextTaskDate,
  getUserNextAvailableDate,
  fetchUserQueue,
};
