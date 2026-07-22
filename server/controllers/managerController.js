const User = require("../models/User");
const OrgHierarchy = require("../models/OrgHierarchy");
const { getSubordinatesForUser } = require("../utils/hierarchyUtils");


/**
 * GET /api/manager/team
 * Returns all direct and indirect subordinates of the authenticated manager.
 * Guarded by rbac(["super_user", "manager"]).
 */
const getMyTeam = async (req, res) => {
  try {
    const managerId = req.user._id;

    // Get all subordinate user IDs via hierarchy traversal
    const subordinateIds = await getSubordinatesForUser(managerId);

    if (!subordinateIds.length) {
      return res.status(200).json({ success: true, team: [], total: 0 });
    }

    const team = await User.find({
      _id: { $in: subordinateIds },
      isDisabled: false,
    })
      .select("_id name email role designation department reportsTo createdAt")
      .populate("reportsTo", "name email role designation")
      .lean();

    return res.status(200).json({ success: true, team, total: team.length });
  } catch (err) {
    console.error("managerController.getMyTeam error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/team/:userId
 * Returns read-only profile of a specific subordinate.
 * Only accessible if the requested user is an actual subordinate of the manager.
 * Guarded by rbac(["super_user", "manager"]).
 */
const getTeamMember = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { userId } = req.params;

    // Verify the requested user is actually a subordinate
    const subordinateIds = await getSubordinatesForUser(managerId);
    const isSubordinate = subordinateIds.some((id) => String(id) === String(userId));

    // Super users bypass the subordinate check
    if (!isSubordinate && req.user.role !== "super_user") {
      return res.status(403).json({
        success: false,
        message: "You can only view profiles of your direct or indirect team members.",
      });
    }

    const member = await User.findById(userId)
      .select("_id name email role designation department reportsTo createdAt isDisabled")
      .populate("reportsTo", "name email role designation")
      .lean();

    if (!member) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, member });
  } catch (err) {
    console.error("managerController.getTeamMember error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

const AttendanceRecord = require("../models/AttendanceRecord");
const LeaveApplication = require("../models/LeaveApplication");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Ticket = require("../models/Ticket");
const TaskNotification = require("../models/TaskNotification");
const { getSettings } = require("../config/attendanceSettings");
const { getTodayShiftDate, isWeekend, isHoliday, buildOfficeDateTime } = require("../utils/dateUtils");
const { getHolidaysForYear } = require("../services/holidayService");
const AuditLog = require("../models/AuditLog");
const { getLeaveBalance, approveLeave, rejectLeave } = require("../services/leaveService");
const { createNotifications } = require("../services/taskNotificationService");

/**
 * GET /api/manager/dashboard
 * Returns operational metrics and team statistics for the authenticated manager.
 * Guarded by rbac(["manager"]).
 */
const getDashboardSummary = async (req, res) => {
  try {
    const managerId = req.user._id;

    // 1. Hierarchy Filter: Get subordinate IDs
    const subordinateIds = await getSubordinatesForUser(managerId);
    const teamMembersCount = subordinateIds.length;

    // 2. Team metrics
    let activeMembersCount = 0;
    let departmentsCount = 0;

    if (teamMembersCount > 0) {
      const subordinateUsers = await User.find({
        _id: { $in: subordinateIds },
        isDisabled: false,
      })
        .select("department")
        .lean();

      activeMembersCount = subordinateUsers.length;
      const depts = new Set(subordinateUsers.map((u) => u.department).filter(Boolean));
      departmentsCount = depts.size;
    }

    // 3. Attendance Summary Today
    const settings = await getSettings();
    const shiftDate = getTodayShiftDate(settings.timezone);

    const summaryResult = await getManagerAttendanceSummaryHelper(managerId, shiftDate);
    const presentToday = summaryResult.present;
    const absentToday = summaryResult.absent;
    const lateToday = summaryResult.late;
    const onLeaveToday = summaryResult.onLeave;
    const notMarkedToday = summaryResult.notMarked;

    // 4. Pending Leave Requests
    let pendingLeavesCount = 0;
    let recentLeaves = [];

    if (teamMembersCount > 0) {
      pendingLeavesCount = await LeaveApplication.countDocuments({
        userId: { $in: subordinateIds },
        status: "pending",
      });

      const recentLeaveDocs = await LeaveApplication.find({
        userId: { $in: subordinateIds },
        status: "pending",
      })
        .populate("userId", "name userId department designation")
        .populate("leaveTypeId", "name code")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentLeaves = recentLeaveDocs.map((l) => ({
        requestId: l._id,
        employeeId: l.userId?._id || null,
        employeeCustomId: l.userId?.userId || "—",
        employeeName: l.userId?.name || "Unknown",
        department: l.userId?.department || "General",
        designation: l.userId?.designation || "Staff",
        leaveType: l.leaveTypeId?.name || "Unknown",
        startDate: l.from,
        endDate: l.to,
        totalDays: l.totalDays,
        reason: l.reason,
        status: l.status,
        documents: l.documents || [],
        createdAt: l.createdAt,
      }));
    }

    // 5. Tasks statistics (Pending, Overdue, Completed)
    let pendingTasksCount = 0;
    let overdueTasksCount = 0;
    let completedTasksCount = 0;
    let recentPendingTasks = [];

    if (teamMembersCount > 0) {
      const currentDate = new Date();
      const completedStatuses = ["completed", "reviewed"];

      completedTasksCount = await Task.countDocuments({
        assignedTo: { $in: subordinateIds },
        status: { $in: completedStatuses },
      });

      overdueTasksCount = await Task.countDocuments({
        assignedTo: { $in: subordinateIds },
        status: { $not: { $in: completedStatuses } },
        dueDate: { $ne: null, $lt: currentDate },
      });

      pendingTasksCount = await Task.countDocuments({
        assignedTo: { $in: subordinateIds },
        status: { $not: { $in: completedStatuses } },
        $or: [{ dueDate: null }, { dueDate: { $gte: currentDate } }],
      });

      const recentTaskDocs = await Task.find({
        assignedTo: { $in: subordinateIds },
        status: { $not: { $in: completedStatuses } },
      })
        .populate("assignedTo", "name")
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(5)
        .lean();

      recentPendingTasks = recentTaskDocs.map((t) => ({
        taskId: t._id,
        title: t.title,
        assignedEmployee: t.assignedTo?.name || "Unknown",
        priority: t.priority,
        dueDate: t.dueDate,
        status: t.status,
        project: null, // Task model has no project reference
      }));
    }

    // 6. Active Projects
    let activeProjectsCount = 0;
    let recentActiveProjects = [];
    const activeProjectStatuses = ["ongoing", "new", "under_review", "approved", "in_progress", "testing", "on_hold", "maintenance"];
    const teamUserIds = [managerId, ...subordinateIds];

    activeProjectsCount = await Project.countDocuments({
      isDeleted: { $ne: true },
      status: { $in: activeProjectStatuses },
      $or: [
        { createdBy: { $in: teamUserIds } },
        { assignedEngineer: { $in: teamUserIds } },
        { collaborators: { $in: teamUserIds } },
      ],
    });

    const recentProjectDocs = await Project.find({
      isDeleted: { $ne: true },
      status: { $in: activeProjectStatuses },
      $or: [
        { createdBy: { $in: teamUserIds } },
        { assignedEngineer: { $in: teamUserIds } },
        { collaborators: { $in: teamUserIds } },
      ],
    })
      .populate("assignedEngineer", "name")
      .populate("collaborators", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentActiveProjects = recentProjectDocs.map((p) => {
      const assignedEmployees = [];
      if (p.assignedEngineer?.name) {
        assignedEmployees.push(p.assignedEngineer.name);
      }
      if (p.collaborators && p.collaborators.length) {
        p.collaborators.forEach((c) => {
          if (c.name && !assignedEmployees.includes(c.name)) {
            assignedEmployees.push(c.name);
          }
        });
      }
      return {
        projectId: p._id,
        projectName: p.name,
        status: p.status,
        startDate: p.startDate,
        deadline: p.deadline,
        assignedEmployees,
        completionPercentage: null, // Project has no completion field
      };
    });

    // 7. Open Support Tickets
    let openTicketsCount = 0;
    let highPriorityTicketsCount = 0;
    let recentOpenTickets = [];
    const openTicketStatuses = ["open", "in-progress"];
    const ticketUserIds = [managerId, ...subordinateIds];

    openTicketsCount = await Ticket.countDocuments({
      status: { $in: openTicketStatuses },
      raisedBy: { $in: ticketUserIds },
    });

    highPriorityTicketsCount = await Ticket.countDocuments({
      status: { $in: openTicketStatuses },
      raisedBy: { $in: ticketUserIds },
      priority: { $in: ["high", "urgent"] },
    });

    const recentTicketDocs = await Ticket.find({
      status: { $in: openTicketStatuses },
      raisedBy: { $in: ticketUserIds },
    })
      .populate("raisedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentOpenTickets = recentTicketDocs.map((t) => ({
      ticketId: t.ticketId,
      title: t.title,
      raisedBy: t.raisedBy?.name || "Unknown",
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
    }));

    // 8. Upcoming Meetings
    // Manager is strictly restricted from seeing CRM Leads/Client details.
    // Therefore, meetings query must return 0 and empty list.
    const upcomingMeetingsCount = 0;
    const nextMeetings = [];

    // 9. Notifications Summary
    const [unreadNotificationsCount, recentNotificationsDocs] = await Promise.all([
      TaskNotification.countDocuments({
        userId: managerId,
        isRead: false,
      }),
      TaskNotification.find({ userId: managerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const recentNotifications = recentNotificationsDocs.map((n) => ({
      notificationId: n._id,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    // 10. Team Performance & Rates
    const totalTasksCount = completedTasksCount + pendingTasksCount + overdueTasksCount;
    
    let taskCompletionRate = null;
    let roundedTaskRate = null;
    if (totalTasksCount > 0) {
      taskCompletionRate = (completedTasksCount / totalTasksCount) * 100;
      roundedTaskRate = Math.round(taskCompletionRate * 100) / 100;
    }

    let attendanceRate = null;
    let roundedAttendanceRate = null;
    const overdueRate = totalTasksCount > 0 ? (overdueTasksCount / totalTasksCount) * 100 : 0;
    const roundedOverdueRate = Math.round(overdueRate * 100) / 100;

    if (teamMembersCount > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRecords = await AttendanceRecord.find({
        userId: { $in: subordinateIds },
        shiftDate: { $gte: thirtyDaysAgo },
      })
        .select("status")
        .lean();

      let presentDays = 0;
      let totalDays = 0;

      recentRecords.forEach((rec) => {
        if (["present", "half_day"].includes(rec.status)) {
          presentDays += rec.status === "half_day" ? 0.5 : 1;
          totalDays += 1;
        } else if (rec.status === "absent") {
          totalDays += 1;
        }
      });

      if (totalDays > 0) {
        attendanceRate = (presentDays / totalDays) * 100;
        roundedAttendanceRate = Math.round(attendanceRate * 100) / 100;
      }
    }

    const projectCompletionRate = null;

    // Calculate Team Performance Percentage with safe dynamic weight redistribution
    let teamPerformancePercentage = null;
    let roundedPerformance = null;

    const tasksAvailable = taskCompletionRate !== null;
    const attendanceAvailable = attendanceRate !== null;

    let totalWeight = 0;
    if (tasksAvailable) totalWeight += 0.50;
    if (attendanceAvailable) totalWeight += 0.30;

    if (totalWeight > 0) {
      let weightedSum = 0;
      if (tasksAvailable) weightedSum += taskCompletionRate * 0.50;
      if (attendanceAvailable) weightedSum += attendanceRate * 0.30;
      
      teamPerformancePercentage = weightedSum / totalWeight;
      roundedPerformance = Math.min(100, Math.max(0, Math.round(teamPerformancePercentage * 100) / 100));
    }

    return res.status(200).json({
      success: true,
      data: {
        team: {
          totalMembers: teamMembersCount,
          activeMembers: activeMembersCount,
          departments: departmentsCount,
        },
        attendance: {
          presentToday,
          activeNow: summaryResult.activeNow,
          lateToday,
          onLeaveToday,
          absentToday,
          notMarkedToday,
        },
        leaves: {
          pendingCount: pendingLeavesCount,
          recentRequests: recentLeaves,
        },
        tasks: {
          pendingCount: pendingTasksCount,
          overdueCount: overdueTasksCount,
          completedCount: completedTasksCount,
          recentPendingTasks,
        },
        projects: {
          activeCount: activeProjectsCount,
          averageCompletionPercentage: projectCompletionRate,
          recentActiveProjects,
        },
        tickets: {
          openCount: openTicketsCount,
          highPriorityCount: highPriorityTicketsCount,
          recentOpenTickets,
        },
        meetings: {
          upcomingCount: upcomingMeetingsCount,
          nextMeetings,
        },
        notifications: {
          unreadCount: unreadNotificationsCount,
          recentNotifications,
        },
        performance: {
          completionRate: roundedTaskRate,
          attendanceRate: roundedAttendanceRate,
          overdueRate: roundedOverdueRate,
          teamPerformancePercentage: roundedPerformance,
        },
      },
    });
  } catch (err) {
    console.error("managerController.getDashboardSummary error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/projects
 * Returns manager-scoped projects.
 */
const getManagerProjects = async (req, res) => {
  try {
    const managerId = req.user._id;
    const subordinateIds = await getSubordinatesForUser(managerId);
    const teamUserIds = [managerId, ...subordinateIds];

    const { status, industry, search, sortBy = "createdAt", page = 1, limit = 12 } = req.query;

    const query = {
      isDeleted: { $ne: true },
      $or: [
        { createdBy: managerId },
        { assignedEngineer: { $in: teamUserIds } },
        { collaborators: { $in: teamUserIds } }
      ]
    };

    if (status) {
      query.status = status;
    }
    if (industry) {
      query.industry = industry;
    }
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { tagline: { $regex: search, $options: "i" } }
        ]
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    let sortOption = {};
    if (sortBy === "name") {
      sortOption = { name: 1 };
    } else if (sortBy === "createdAt") {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { isFeatured: -1, createdAt: -1 };
    }

    const projects = await Project.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate("assignedEngineer", "name email role designation department")
      .populate("collaborators", "name email role designation department")
      .populate("createdBy", "name email role designation department")
      .lean();

    const total = await Project.countDocuments(query);

    // Omit budgeting and sensitive information
    const sanitizedProjects = projects.map(project => {
      delete project.expectedBudget;
      delete project.partnerNotes;
      delete project.internalNotes;
      delete project.deploymentId;
      delete project.deploymentPassword;
      delete project.stagingUrl;
      delete project.githubUrl;
      delete project.serverNotes;
      return project;
    });

    return res.status(200).json({
      success: true,
      projects: sanitizedProjects,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (err) {
    console.error("managerController.getManagerProjects error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * POST /api/manager/projects
 * Creates a project with manager scope assignment validation.
 */
const createManagerProject = async (req, res) => {
  try {
    const managerId = req.user._id;
    const subordinateIds = await getSubordinatesForUser(managerId);
    const teamUserIds = [managerId, ...subordinateIds];

    const allowedFields = [
      "name",
      "tagline",
      "description",
      "showcaseDescription",
      "status",
      "startDate",
      "endDate",
      "deadline",
      "industry",
      "techStack",
      "assignedEngineer",
      "collaborators"
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    // Validate assignedEngineer
    if (payload.assignedEngineer) {
      const assignedId = String(payload.assignedEngineer);
      if (!teamUserIds.map(String).includes(assignedId)) {
        return res.status(403).json({
          success: false,
          message: "You can only assign yourself or members of your reporting hierarchy."
        });
      }
    }

    // Validate collaborators
    if (payload.collaborators && Array.isArray(payload.collaborators)) {
      for (const colId of payload.collaborators) {
        if (!teamUserIds.map(String).includes(String(colId))) {
          return res.status(403).json({
            success: false,
            message: "You can only assign collaborators from your reporting hierarchy."
          });
        }
      }
    }

    payload.createdBy = managerId;
    payload.isDeleted = false;

    const project = new Project(payload);
    await project.save();

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      project
    });
  } catch (err) {
    console.error("managerController.createManagerProject error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/projects/:projectId
 * Returns sanitized project details if in manager scope.
 */
const getManagerProjectDetails = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { projectId } = req.params;

    const subordinateIds = await getSubordinatesForUser(managerId);
    const teamUserIds = [managerId, ...subordinateIds];

    const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } })
      .populate("assignedEngineer", "name email role designation department")
      .populate("collaborators", "name email role designation department")
      .populate("createdBy", "name email role designation department")
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Verify manager scope
    const isCreatedByManager = String(project.createdBy?._id || project.createdBy) === String(managerId);
    const isAssignedToTeam = project.assignedEngineer && teamUserIds.map(String).includes(String(project.assignedEngineer?._id || project.assignedEngineer));
    const isCollaboratorTeam = project.collaborators && project.collaborators.some(col => teamUserIds.map(String).includes(String(col._id || col)));

    if (!isCreatedByManager && !isAssignedToTeam && !isCollaboratorTeam) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You do not have permissions to view this project."
      });
    }

    const safeProject = {
      _id: project._id,
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      industry: project.industry,
      techStack: project.techStack || [],
      liveUrl: project.liveUrl,
      stagingUrl: project.stagingUrl,
      githubUrl: project.githubUrl,
      deploymentPlatform: project.deploymentPlatform,
      environment: project.environment,
      serverNotes: project.serverNotes,
      internalNotes: project.description,
      showcaseCopy: project.showcaseDescription,
      documents: project.documents || [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy ? {
        _id: project.createdBy._id,
        name: project.createdBy.name,
        email: project.createdBy.email,
        role: project.createdBy.role,
        designation: project.createdBy.designation,
        department: project.createdBy.department
      } : null,
      assignedEngineer: project.assignedEngineer ? {
        _id: project.assignedEngineer._id,
        name: project.assignedEngineer.name,
        email: project.assignedEngineer.email,
        role: project.assignedEngineer.role,
        designation: project.assignedEngineer.designation,
        department: project.assignedEngineer.department
      } : null,
      collaborators: (project.collaborators || []).map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        designation: u.designation,
        department: u.department
      })),
      sensitiveFields: project.sensitiveFields || []
    };

    return res.status(200).json({
      success: true,
      project: safeProject
    });
  } catch (err) {
    console.error("managerController.getManagerProjectDetails error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * PATCH /api/manager/projects/:projectId
 * Updates sanitized project fields if in manager scope.
 */
const updateManagerProject = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { projectId } = req.params;

    const subordinateIds = await getSubordinatesForUser(managerId);
    const teamUserIds = [managerId, ...subordinateIds];

    const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Verify manager scope
    const isCreatedByManager = String(project.createdBy) === String(managerId);
    const isAssignedToTeam = project.assignedEngineer && teamUserIds.map(String).includes(String(project.assignedEngineer));
    const isCollaboratorTeam = project.collaborators && project.collaborators.some(col => teamUserIds.map(String).includes(String(col)));

    if (!isCreatedByManager && !isAssignedToTeam && !isCollaboratorTeam) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You do not have permissions to update this project."
      });
    }

    const allowedFields = [
      "name",
      "tagline",
      "description",
      "showcaseDescription",
      "status",
      "startDate",
      "endDate",
      "deadline",
      "industry",
      "techStack",
      "assignedEngineer",
      "collaborators"
    ];

    // Validate updates
    if (req.body.assignedEngineer) {
      const assignedId = String(req.body.assignedEngineer);
      if (!teamUserIds.map(String).includes(assignedId)) {
        return res.status(403).json({
          success: false,
          message: "You can only assign yourself or members of your reporting hierarchy."
        });
      }
    }

    if (req.body.collaborators && Array.isArray(req.body.collaborators)) {
      for (const colId of req.body.collaborators) {
        if (!teamUserIds.map(String).includes(String(colId))) {
          return res.status(403).json({
            success: false,
            message: "You can only assign collaborators from your reporting hierarchy."
          });
        }
      }
    }

    // Perform updates only on allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    project.updatedBy = managerId;
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("assignedEngineer", "name email role designation department")
      .populate("collaborators", "name email role designation department")
      .populate("createdBy", "name email role designation department")
      .lean();

    // Omit sensitive/finance fields
    delete populatedProject.expectedBudget;
    delete populatedProject.partnerNotes;
    delete populatedProject.internalNotes;
    delete populatedProject.deploymentId;
    delete populatedProject.deploymentPassword;
    delete populatedProject.stagingUrl;
    delete populatedProject.githubUrl;
    delete populatedProject.serverNotes;

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: populatedProject
    });
  } catch (err) {
    console.error("managerController.updateManagerProject error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * Resolves standard resolved attendance status for a team user, prioritizing punch data
 * and overlaying approved leaves, weekends, and holidays.
 */
function resolveAttendanceStatus(u, rec, leave, isWknd, isHldy, shiftDate, timezone) {
  let status = 'not_marked';
  let punchIn = null;
  let punchOut = null;
  let workingDurationSeconds = 0;
  let breakDurationSeconds = 0;
  let overtimeSeconds = 0;
  let lateByMinutes = 0;
  let earlyExitMinutes = 0;
  let isLate = false;

  const hasPunch = rec && rec.punchIn;

  if (hasPunch) {
    status = rec.status;
    punchIn = rec.punchIn || null;
    punchOut = rec.punchOut || null;
    workingDurationSeconds = (rec.netWorkDurationMinutes || 0) * 60;
    breakDurationSeconds = (rec.totalBreakDurationMinutes || 0) * 60;
    overtimeSeconds = (rec.overtimeMinutes || 0) * 60;
    earlyExitMinutes = 0;

    if (timezone) {
      const thresholdTime = buildOfficeDateTime(shiftDate, "10:00", timezone);
      const punchInTime = new Date(rec.punchIn);
      const punchInTimestamp = punchInTime.getTime();
      const thresholdTimestamp = thresholdTime.getTime();

      isLate = punchInTimestamp > thresholdTimestamp;
      lateByMinutes = isLate ? Math.floor((punchInTimestamp - thresholdTimestamp) / 60000) : 0;
    } else {
      lateByMinutes = rec.lateByMinutes || 0;
      isLate = rec.isLate || false;
    }
  } else if (leave) {
    status = 'on_leave';
  } else if (rec) {
    status = rec.status;
    isLate = false;
  } else if (isWknd) {
    status = 'weekend';
  } else if (isHldy) {
    status = 'holiday';
  } else {
    status = 'absent';
  }

  return {
    userId: u._id,
    employeeId: u.userId || '',
    employeeName: u.name,
    email: u.email,
    department: u.department || 'General',
    designation: u.designation || '',
    status,
    normalizedStatus: status,
    punchIn,
    punchOut,
    workingDurationSeconds,
    breakDurationSeconds,
    overtimeSeconds,
    lateByMinutes,
    earlyExitMinutes,
    isLate,
    isOnBreak: rec?.isOnBreak || false,
    currentBreakStart: rec?.currentBreakStart || null,
    totalBreakDurationMinutes: rec?.totalBreakDurationMinutes || 0,
    shiftDate
  };
}

/**
 * Shared helper to get the manager-scoped attendance summary.
 * Returns the exact counts used for summary cards.
 */
async function getManagerAttendanceSummaryHelper(managerId, selectedDate) {
  const subordinateIds = await getSubordinatesForUser(managerId);

  if (!subordinateIds.length) {
    return {
      totalEmployees: 0,
      present: 0,
      activeNow: 0,
      late: 0,
      onLeave: 0,
      absent: 0,
      notMarked: 0,
      resolvedRecords: []
    };
  }

  const settings = await getSettings();
  const timezone = settings.timezone;
  const holidays = await getHolidaysForYear(selectedDate.getFullYear());
  const isWknd = isWeekend(selectedDate, settings.weekends, timezone);
  const isHldy = isHoliday(selectedDate, holidays);

  const allTeamUsers = await User.find({
    _id: { $in: subordinateIds },
    isDisabled: false,
    role: { $nin: ['super_user', 'partner'] }
  })
  .select('_id name email role department designation userId')
  .lean();

  const allTeamUserIds = allTeamUsers.map(u => u._id);

  const [allRecords, allLeaves] = await Promise.all([
    AttendanceRecord.find({ shiftDate: selectedDate, userId: { $in: allTeamUserIds } }).lean(),
    LeaveApplication.find({
      userId: { $in: allTeamUserIds },
      status: 'approved',
      from: { $lte: selectedDate },
      to: { $gte: selectedDate }
    }).lean()
  ]);

  const allRecordMap = new Map(allRecords.map(r => [r.userId.toString(), r]));
  const allLeaveMap = new Map(allLeaves.map(l => [l.userId.toString(), l]));

  const resolvedRecords = allTeamUsers.map(u => {
    const rec = allRecordMap.get(u._id.toString());
    const leave = allLeaveMap.get(u._id.toString());
    return resolveAttendanceStatus(u, rec, leave, isWknd, isHldy, selectedDate, timezone);
  });

  return {
    totalEmployees: resolvedRecords.length,
    present: resolvedRecords.filter(r => ['present', 'half_day'].includes(r.normalizedStatus)).length,
    activeNow: resolvedRecords.filter(r => r.punchIn && !r.punchOut).length,
    late: resolvedRecords.filter(r => r.isLate === true).length,
    onLeave: resolvedRecords.filter(r => r.normalizedStatus === 'on_leave').length,
    absent: resolvedRecords.filter(r => r.normalizedStatus === 'absent').length,
    notMarked: resolvedRecords.filter(r => ['weekend', 'holiday', 'not_marked'].includes(r.normalizedStatus)).length,
    resolvedRecords
  };
}

/**
 * GET /api/manager/attendance
 * Returns manager-scoped team attendance list and snapshot summary.
 */
const getManagerAttendance = async (req, res) => {
  try {
    const managerId = req.user._id;
    const subordinateIds = await getSubordinatesForUser(managerId);

    // If no subordinates, return empty list
    if (!subordinateIds.length) {
      return res.status(200).json({
        success: true,
        summary: {
          totalEmployees: 0,
          present: 0,
          activeNow: 0,
          late: 0,
          onLeave: 0,
          absent: 0,
          notMarked: 0
        },
        records: []
      });
    }

    const { date, department, employeeId, status: statusFilter, search } = req.query;

    const settings = await getSettings();
    const timezone = settings.timezone;

    // Default to today if no date provided
    let shiftDate = getTodayShiftDate(timezone);
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        shiftDate = new Date(Date.UTC(year, month - 1, day));
      }
    }

    const summaryResult = await getManagerAttendanceSummaryHelper(managerId, shiftDate);
    const { resolvedRecords, ...summary } = summaryResult;

    // 5. Apply query parameters filters to resolvedRecords for the row data response
    let filteredRecords = resolvedRecords;

    if (department) {
      filteredRecords = filteredRecords.filter(r => r.department === department);
    }
    if (employeeId) {
      filteredRecords = filteredRecords.filter(r => r.userId.toString() === employeeId.toString());
    }
    if (search) {
      const term = search.toLowerCase();
      filteredRecords = filteredRecords.filter(r => 
        r.employeeName.toLowerCase().includes(term) ||
        r.employeeId.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active_now') {
        filteredRecords = filteredRecords.filter(r => r.punchIn && !r.punchOut);
      } else if (statusFilter === 'late') {
        filteredRecords = filteredRecords.filter(r => r.isLate);
      } else {
        filteredRecords = filteredRecords.filter(r => r.status === statusFilter);
      }
    }

    return res.status(200).json({
      success: true,
      summary,
      records: filteredRecords
    });

  } catch (err) {
    console.error("managerController.getManagerAttendance error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/leaves/pending
 * Returns pending leave requests of subordinates.
 */
const getManagerPendingLeaves = async (req, res) => {
  try {
    const managerId = req.user._id;
    const subordinateIds = await getSubordinatesForUser(managerId);

    if (!subordinateIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const applications = await LeaveApplication.find({
      userId: { $in: subordinateIds },
      status: 'pending'
    })
      .populate('userId', 'name email role department designation userId')
      .populate('leaveTypeId', 'name code')
      .sort({ appliedAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: applications });
  } catch (err) {
    console.error("managerController.getManagerPendingLeaves error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/leaves/:leaveId
 * Returns details of a specific leave request plus the employee's current leave balance breakdown.
 */
const getManagerLeaveDetails = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { leaveId } = req.params;

    const leave = await LeaveApplication.findById(leaveId)
      .populate('userId', 'name email role department designation userId')
      .populate('leaveTypeId', 'name code')
      .lean();

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    const leaveUserId = leave.userId?._id || leave.userId;

    // Self-approval protection
    if (String(leaveUserId) === String(managerId)) {
      return res.status(403).json({ success: false, message: 'You cannot approve or reject your own leave request.' });
    }

    // Verify hierarchy
    const subordinateIds = await getSubordinatesForUser(managerId);
    const subordinateIdStrs = subordinateIds.map(id => id.toString());
    const leaveUserIdStr = leaveUserId.toString();

    if (!subordinateIdStrs.includes(leaveUserIdStr)) {
      return res.status(403).json({ success: false, message: 'Access denied. Employee is not in your hierarchy.' });
    }

    // Fetch leave balances for the year of the leave
    const year = new Date(leave.from).getFullYear();
    const balances = await getLeaveBalance(leaveUserIdStr, year);

    res.status(200).json({
      success: true,
      data: {
        ...leave,
        balances
      }
    });
  } catch (err) {
    console.error("managerController.getManagerLeaveDetails error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * PATCH /api/manager/leaves/:leaveId/approve
 * Approves a pending leave request.
 */
const approveManagerLeave = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { leaveId } = req.params;
    const { reviewNote } = req.body;

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    // Self-approval protection
    if (String(leave.userId) === String(managerId)) {
      return res.status(403).json({ success: false, message: 'You cannot approve or reject your own leave request.' });
    }

    // Verify hierarchy
    const subordinateIds = await getSubordinatesForUser(managerId);
    const subordinateIdStrs = subordinateIds.map(id => id.toString());
    if (!subordinateIdStrs.includes(leave.userId.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. Employee is not in your hierarchy.' });
    }

    // Status validation
    if (leave.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'This leave request has already been processed.' });
    }

    // Call shared service to approve leave and handle balances
    const updatedLeave = await approveLeave(leaveId, managerId, reviewNote);

    // Audit log
    await AuditLog.create({
      userId: managerId,
      action: 'LEAVE_APPROVED',
      targetId: updatedLeave._id,
      targetModel: 'LeaveApplication',
      details: { forUser: updatedLeave.userId, days: updatedLeave.totalDays, reviewedByRole: 'manager' }
    });

    // Notify employee
    try {
      const typeLabel = updatedLeave.leaveTypeId?.name || 'Leave';
      const formattedDate = new Date(updatedLeave.from).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      await createNotifications({
        userIds: [updatedLeave.userId],
        message: `Your ${typeLabel} request for ${formattedDate} has been approved by your manager.`,
        targetPath: '/leave'
      });
    } catch (notificationError) {
      console.error('Leave Approval Notification Error:', notificationError);
    }

    res.status(200).json({ success: true, data: updatedLeave });
  } catch (err) {
    console.error("managerController.approveManagerLeave error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/manager/leaves/:leaveId/reject
 * Rejects a pending leave request.
 */
const rejectManagerLeave = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { leaveId } = req.params;
    const { reviewNote } = req.body;

    if (!reviewNote || !reviewNote.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    }

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    // Self-approval protection
    if (String(leave.userId) === String(managerId)) {
      return res.status(403).json({ success: false, message: 'You cannot approve or reject your own leave request.' });
    }

    // Verify hierarchy
    const subordinateIds = await getSubordinatesForUser(managerId);
    const subordinateIdStrs = subordinateIds.map(id => id.toString());
    if (!subordinateIdStrs.includes(leave.userId.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. Employee is not in your hierarchy.' });
    }

    // Status validation
    if (leave.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'This leave request has already been processed.' });
    }

    // Call shared service to reject leave and release pending balances
    const updatedLeave = await rejectLeave(leaveId, managerId, reviewNote);

    // Audit log
    await AuditLog.create({
      userId: managerId,
      action: 'LEAVE_REJECTED',
      targetId: updatedLeave._id,
      targetModel: 'LeaveApplication',
      details: { forUser: updatedLeave.userId, reviewedByRole: 'manager' }
    });

    // Notify employee
    try {
      await createNotifications({
        userIds: [updatedLeave.userId],
        message: `Your leave request has been rejected. Reason: ${reviewNote}`,
        targetPath: '/leave'
      });
    } catch (notificationError) {
      console.error('Leave Rejection Notification Error:', notificationError);
    }

    res.status(200).json({ success: true, data: updatedLeave });
  } catch (err) {
    console.error("managerController.rejectManagerLeave error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyTeam,
  getTeamMember,
  getDashboardSummary,
  getManagerProjects,
  createManagerProject,
  getManagerProjectDetails,
  updateManagerProject,
  getManagerAttendance,
  getManagerPendingLeaves,
  getManagerLeaveDetails,
  approveManagerLeave,
  rejectManagerLeave
};
