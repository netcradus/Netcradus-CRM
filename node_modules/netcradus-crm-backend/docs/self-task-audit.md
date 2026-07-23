<!--
Phase 0 audit findings

Tasks are currently created through POST /api/tasks in server/controllers/tasksController.js.
The route is protected globally by auth middleware in server/index.js before /api/tasks is mounted.
createTask validates title, assignedTo, and dueDate, checks the assignee, verifies hierarchy assignment with canAssignTask, schedules the task through assignToQueue, creates a Task document, and sends a TaskNotification to the assignee. Tasks are stored in the existing Task collection.

Task model fields in server/models/Task.js:
- title: String, required, trimmed
- description: String, trimmed, default ""
- assignedBy: ObjectId ref User, required
- assignedTo: ObjectId ref User, required
- role: String, required, trimmed, lowercase
- priority: enum low, medium, high, urgent; default medium
- status: enum pending, in_progress, completed, reviewed, queued, active; default pending
- dueDate: Date, required
- estimatedDuration: String, trimmed, default ""
- estimatedHours: Number, default null
- queuePosition: Number, default null
- scheduledDate: Date, default null
- actualStartDate: Date, default null
- queuedAt: Date, default null
- completionTime: Date, default null
- reviewedAt: Date, default null
- reminderSentAt: Date, default null
- statusHistory: array of { status, changedBy, note, changedAt }
- timestamps: createdAt, updatedAt

Hierarchy is implemented for task assignment through server/models/OrgHierarchy.js, not User.reportsTo.
OrgHierarchy has userId, priorityLevel, parentId, positionX, and positionY.
server/utils/hierarchyUtils.js builds descendant relationships from OrgHierarchy.parentId and userId.
User also has reportsTo, but current task assignment does not use it.

Task assignment currently works through canAssignTask(currentUserId, targetUserId, currentUserRole):
- Users cannot assign tasks to themselves.
- super_user can assign to anyone.
- Users in OrgHierarchy can assign only to descendant users under their hierarchy node.
- If a user is missing from OrgHierarchy, only fallback roles superadmin, super_admin, admin, administrator, and hr may assign.
- getAssignableUsers excludes the current user and disabled users.

Task statuses currently in use are:
- pending
- in_progress
- completed
- reviewed
- queued
- active

Tasks do not currently have an approver concept. Completed tasks can be reviewed by REVIEWER_ROLES (super_user and hr), but there are no approvedBy/rejectedBy approval fields or approval history.

Task notifications currently use in-app TaskNotification documents plus Socket.IO real-time events.
createNotifications inserts TaskNotification records and emits notification:new to user-specific socket rooms.
TaskNotification type is explicitly enumerated as task, storage_low, and general.
The frontend notification bell fetches /api/notifications and listens for notification:new only while the bell is open.

The frontend task list is client/src/features/Tasks/Tasks.js.
It fetches /api/tasks with filters and pagination, fetches /api/tasks/assignable-users for the assignment dropdown, and fetches /api/tasks/queue/:userId for queue display.
The rendered table shows title, assignee, assigner, priority, status, queue, scheduled date, estimated hours, due date, and actions.
Role visibility is backend-driven by buildTaskQuery: super_user sees all tasks; other users see tasks assigned to them, tasks assigned by them, and tasks assigned to their descendant users. The frontend does not independently determine task visibility beyond using localStorage role/userId for button visibility.

Role-based restrictions on task creation are mostly hierarchy-based.
canAssignTasks currently returns true for any authenticated user, but createTask still calls canAssignTask, which enforces hierarchy, role fallback, and no self-assignment.

Option chosen: Option A, extend the existing Task model.
Reason: the existing task surface is already centralized around one Task collection, comments, queue logic, notifications, dashboard fetching, and task visibility. Adding taskType and approval fields keeps queries and UI integration straightforward while preserving existing assigned-task behavior through default taskType: assigned.
-->
