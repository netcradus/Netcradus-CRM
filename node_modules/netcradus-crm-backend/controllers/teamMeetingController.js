const TeamMeeting = require("../models/TeamMeeting");
const Project = require("../models/Project");
const User = require("../models/User");
const { getSubordinatesForUser } = require("../utils/hierarchyUtils");
const { createNotifications } = require("../services/taskNotificationService");

const isSuperUser = (user) => String(user?.role || "").trim().toLowerCase() === "super_user";

// Helper to validate project access for manager team
async function validateProjectAccess(projectId, managerId) {
  if (!projectId) return true;

  const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } }).lean();
  if (!project) return false;

  const subordinateIds = await getSubordinatesForUser(managerId);
  const teamUserIds = [managerId, ...subordinateIds].map(id => id.toString());

  const createdBy = project.createdBy?.toString();
  const assignedEngineer = project.assignedEngineer?.toString();
  const collaborators = (project.collaborators || []).map(c => c.toString());

  const hasAccess = teamUserIds.includes(createdBy) || 
                    (assignedEngineer && teamUserIds.includes(assignedEngineer)) || 
                    collaborators.some(c => teamUserIds.includes(c));

  return hasAccess;
}

// ✅ GET ALL TEAM MEETINGS
exports.getMeetings = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { search, date, meetingType, projectId, status, upcoming, past } = req.query;

    const query = {
      $or: [
        { organizer: managerId },
        { participants: managerId }
      ]
    };

    if (meetingType) {
      query.meetingType = meetingType;
    }

    if (projectId) {
      query.relatedProject = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.meetingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (upcoming === "true") {
      query.meetingDate = { $gte: new Date() };
      query.status = "scheduled";
    } else if (past === "true") {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { meetingDate: { $lt: new Date() } },
          { status: { $in: ["completed", "cancelled"] } }
        ]
      });
    }

    if (search) {
      const pattern = new RegExp(search.trim(), "i");
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: pattern },
          { agenda: pattern },
          { notes: pattern }
        ]
      });
    }

    // Sort: upcoming scheduled first, otherwise reverse chronological
    let sortOption = { meetingDate: -1, startTime: -1 };
    if (upcoming === "true") {
      sortOption = { meetingDate: 1, startTime: 1 };
    }

    const meetings = await TeamMeeting.find(query)
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("relatedProject", "name")
      .sort(sortOption)
      .lean();

    res.json({ success: true, data: meetings });
  } catch (err) {
    console.error("teamMeetingController.getMeetings error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ GET ONE TEAM MEETING
exports.getMeeting = async (req, res) => {
  try {
    const managerId = req.user._id.toString();
    const meeting = await TeamMeeting.findById(req.params.meetingId)
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("relatedProject", "name")
      .lean();

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const isOrganizer = meeting.organizer?._id?.toString() === managerId;
    const isParticipant = (meeting.participants || []).some(p => p._id?.toString() === managerId);

    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a participant or organizer of this meeting." });
    }

    res.json({ success: true, data: meeting });
  } catch (err) {
    console.error("teamMeetingController.getMeeting error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ CREATE TEAM MEETING
exports.createMeeting = async (req, res) => {
  try {
    const managerId = req.user._id;
    const {
      title,
      meetingType,
      agenda,
      notes,
      meetingDate,
      startTime,
      endTime,
      participants = [],
      relatedProject,
      location,
      meetingLink,
      reminderMinutes,
    } = req.body;

    if (!title || !meetingType || !meetingDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    // 1. Fetch subordinates and validate participants list
    const subordinateIds = await getSubordinatesForUser(managerId);
    const subordinateIdStrs = subordinateIds.map(id => id.toString());
    const allowedUserIds = [managerId.toString(), ...subordinateIdStrs];

    // Ensure no duplicates and sanitize
    const uniqueParticipants = Array.from(new Set(participants.map(p => p.toString())));

    // Check hierarchy violations
    const invalidParticipants = uniqueParticipants.filter(id => !allowedUserIds.includes(id));
    if (invalidParticipants.length > 0) {
      return res.status(403).json({
        success: false,
        message: "You can only invite employees within your organization hierarchy."
      });
    }

    // 2. Validate participant counts/requirements
    const subordinateParticipants = uniqueParticipants.filter(id => id !== managerId.toString());

    if (meetingType === "one_to_one") {
      if (subordinateParticipants.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "One-to-One meetings must select exactly one subordinate."
        });
      }
    } else {
      // Must have at least one participant other than organizer
      if (subordinateParticipants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Team meetings must include at least one participant other than the organizer."
        });
      }
    }

    // Ensure the organizer is explicitly in the participants array for querying
    if (!uniqueParticipants.includes(managerId.toString())) {
      uniqueParticipants.push(managerId.toString());
    }

    // 3. Validate start & end time
    if (endTime <= startTime) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    // 4. Validate project scope
    if (relatedProject) {
      const isProjectAccessible = await validateProjectAccess(relatedProject, managerId);
      if (!isProjectAccessible) {
        return res.status(403).json({ success: false, message: "Access denied. Linked project is outside your team scope." });
      }
    }

    // 5. Save meeting
    const meeting = new TeamMeeting({
      title,
      meetingType,
      agenda,
      notes,
      meetingDate,
      startTime,
      endTime,
      participants: uniqueParticipants,
      relatedProject: relatedProject || null,
      location,
      meetingLink,
      reminderMinutes,
      organizer: managerId,
      createdBy: managerId,
      status: "scheduled"
    });

    const saved = await meeting.save();
    
    // Notify invitees (excluding manager/organizer)
    const notifyUserIds = uniqueParticipants.filter(id => id !== managerId.toString());
    if (notifyUserIds.length > 0) {
      try {
        const typeLabel = meetingType === "one_to_one" ? "One-to-One" : "Team";
        const formattedDate = new Date(meetingDate).toLocaleDateString();
        await createNotifications({
          userIds: notifyUserIds,
          message: `Your manager has scheduled a ${typeLabel} meeting: "${title}" on ${formattedDate} at ${startTime}.`,
          targetPath: "/dashboard"
        });
      } catch (err) {
        console.error("TeamMeeting Notification Error:", err);
      }
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("teamMeetingController.createMeeting error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ EDIT / RESCHEDULE TEAM MEETING
exports.updateMeeting = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { meetingId } = req.params;

    const meeting = await TeamMeeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found." });
    }

    // 1. Authorization check: only organizer can edit
    if (meeting.organizer.toString() !== managerId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Only the meeting organizer can modify this meeting." });
    }

    // 2. Cancellation check
    if (meeting.status === "cancelled") {
      return res.status(409).json({ success: false, message: "Cancelled meetings cannot be modified." });
    }

    const {
      title,
      meetingType,
      agenda,
      notes,
      meetingDate,
      startTime,
      endTime,
      participants,
      relatedProject,
      location,
      meetingLink,
      reminderMinutes,
    } = req.body;

    const updateFields = { updatedBy: managerId };

    if (title !== undefined) updateFields.title = title;
    if (agenda !== undefined) updateFields.agenda = agenda;
    if (notes !== undefined) updateFields.notes = notes;
    if (location !== undefined) updateFields.location = location;
    if (meetingLink !== undefined) updateFields.meetingLink = meetingLink;
    if (reminderMinutes !== undefined) updateFields.reminderMinutes = reminderMinutes;

    // Time ranges validation
    const checkStartTime = startTime !== undefined ? startTime : meeting.startTime;
    const checkEndTime = endTime !== undefined ? endTime : meeting.endTime;
    if (checkEndTime <= checkStartTime) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }
    if (startTime !== undefined) updateFields.startTime = startTime;
    if (endTime !== undefined) updateFields.endTime = endTime;
    if (meetingDate !== undefined) updateFields.meetingDate = meetingDate;

    // Participants validation
    let resolvedParticipants = meeting.participants.map(p => p.toString());
    if (participants !== undefined) {
      const subordinateIds = await getSubordinatesForUser(managerId);
      const subordinateIdStrs = subordinateIds.map(id => id.toString());
      const allowedUserIds = [managerId.toString(), ...subordinateIdStrs];

      const uniqueParticipants = Array.from(new Set(participants.map(p => p.toString())));
      const invalidParticipants = uniqueParticipants.filter(id => !allowedUserIds.includes(id));
      
      if (invalidParticipants.length > 0) {
        return res.status(403).json({
          success: false,
          message: "You can only invite employees within your organization hierarchy."
        });
      }

      const activeMeetingType = meetingType !== undefined ? meetingType : meeting.meetingType;
      const subordinateParticipants = uniqueParticipants.filter(id => id !== managerId.toString());

      if (activeMeetingType === "one_to_one") {
        if (subordinateParticipants.length !== 1) {
          return res.status(400).json({
            success: false,
            message: "One-to-One meetings must select exactly one subordinate."
          });
        }
      } else {
        if (subordinateParticipants.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Team meetings must include at least one participant other than the organizer."
          });
        }
      }

      if (!uniqueParticipants.includes(managerId.toString())) {
        uniqueParticipants.push(managerId.toString());
      }
      resolvedParticipants = uniqueParticipants;
      updateFields.participants = uniqueParticipants;
    }
    if (meetingType !== undefined) updateFields.meetingType = meetingType;

    // Project scope validation
    if (relatedProject !== undefined) {
      if (relatedProject) {
        const isProjectAccessible = await validateProjectAccess(relatedProject, managerId);
        if (!isProjectAccessible) {
          return res.status(403).json({ success: false, message: "Access denied. Linked project is outside your team scope." });
        }
        updateFields.relatedProject = relatedProject;
      } else {
        updateFields.relatedProject = null;
      }
    }

    const updated = await TeamMeeting.findByIdAndUpdate(meetingId, updateFields, { new: true })
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("relatedProject", "name");

    // Notify invitees of reschedule
    const notifyUserIds = resolvedParticipants.filter(id => id !== managerId.toString());
    if (notifyUserIds.length > 0) {
      try {
        const dateString = new Date(updated.meetingDate).toLocaleDateString();
        await createNotifications({
          userIds: notifyUserIds,
          message: `Meeting rescheduled: "${updated.title}" is now on ${dateString} at ${updated.startTime}.`,
          targetPath: "/dashboard"
        });
      } catch (err) {
        console.error("TeamMeeting Reschedule Notification Error:", err);
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("teamMeetingController.updateMeeting error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ CANCEL TEAM MEETING
exports.cancelMeeting = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { meetingId } = req.params;
    const { cancelReason } = req.body;

    if (!cancelReason || !cancelReason.trim()) {
      return res.status(400).json({ success: false, message: "Cancellation reason is required." });
    }

    const meeting = await TeamMeeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found." });
    }

    // Authorization check: only organizer can cancel
    if (meeting.organizer.toString() !== managerId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Only the meeting organizer can cancel this meeting." });
    }

    // Cancellation check
    if (meeting.status === "cancelled") {
      return res.status(409).json({ success: false, message: "Meeting is already cancelled." });
    }

    meeting.status = "cancelled";
    meeting.cancelReason = cancelReason.trim();
    meeting.cancelledBy = managerId;
    meeting.cancelledAt = new Date();

    const saved = await meeting.save();

    // Notify invitees of cancellation
    const notifyUserIds = (meeting.participants || [])
      .map(id => id.toString())
      .filter(id => id !== managerId.toString());

    if (notifyUserIds.length > 0) {
      try {
        await createNotifications({
          userIds: notifyUserIds,
          message: `Meeting cancelled: "${meeting.title}". Reason: ${cancelReason.trim()}`,
          targetPath: "/dashboard"
        });
      } catch (err) {
        console.error("TeamMeeting Cancellation Notification Error:", err);
      }
    }

    res.json({ success: true, data: saved });
  } catch (err) {
    console.error("teamMeetingController.cancelMeeting error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
