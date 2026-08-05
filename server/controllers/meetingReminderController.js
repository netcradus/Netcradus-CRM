const mongoose = require("mongoose");
const MeetingReminder = require("../models/MeetingReminder");
const User = require("../models/User");
const Contact = require("../models/Contact");
const { createNotifications } = require("../services/taskNotificationService");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const ensureSuperUser = (req, res) => {
  if (normalizeRole(req.user?.role) === "super_user") {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only super admins can manage meeting reminders.",
  });
  return false;
};

exports.getMeetingReminders = async (req, res) => {
  try {
    const isSuper = normalizeRole(req.user?.role) === "super_user";

    const statusParam = req.query.status || "scheduled";
    const scopeParam = req.query.scope || "upcoming";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const query = {};
    if (isSuper) {
      query.createdBy = req.user._id;
    } else {
      // Normal employee: only see meetings they participate in
      query.participants = req.user._id;
    }

    // 1. Status Filter
    if (statusParam !== "all") {
      if (["scheduled", "completed", "cancelled"].includes(statusParam)) {
        query.status = statusParam;
      } else {
        query.status = "scheduled";
      }
    }

    // 2. Scope Filter
    const now = new Date();
    if (scopeParam === "upcoming") {
      query.meetingDateTime = { $gte: now };
    } else if (scopeParam === "past") {
      query.meetingDateTime = { $lt: now };
    }

    // 3. Sorting
    let sortOrder = { meetingDateTime: 1 };
    if (scopeParam === "past") {
      sortOrder = { meetingDateTime: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await MeetingReminder.countDocuments(query);
    const reminders = await MeetingReminder.find(query)
      .populate("createdBy", "name email role department designation")
      .populate("participants", "_id userId name email role department designation")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch matching contact details for custom participant/creator details (employeeId, profilePhoto)
    const userIds = new Set();
    reminders.forEach((r) => {
      if (r.createdBy?._id) userIds.add(String(r.createdBy._id));
      if (r.participants) {
        r.participants.forEach((p) => userIds.add(String(p._id)));
      }
    });

    const contacts = await Contact.find({ linkedUser: { $in: Array.from(userIds) } })
      .select("linkedUser employeeId profilePhoto")
      .lean();

    const contactMap = {};
    contacts.forEach((c) => {
      if (c.linkedUser) {
        contactMap[String(c.linkedUser)] = c;
      }
    });

    // Populate metadata details on response reminders list
    reminders.forEach((r) => {
      if (r.createdBy) {
        const contact = contactMap[String(r.createdBy._id)];
        r.createdBy = {
          ...r.createdBy,
          employeeId: contact?.employeeId || r.createdBy.userId || "",
          profilePhoto: contact?.profilePhoto || "",
        };
      }

      if (r.participants && r.participants.length > 0) {
        r.participants = r.participants.map((p) => {
          const contact = contactMap[String(p._id)];
          return {
            ...p,
            employeeId: contact?.employeeId || p.userId || "",
            profilePhoto: contact?.profilePhoto || "",
          };
        });
      } else {
        // Backward compatibility fallback for legacy reminders:
        // Treat creator as the sole participant
        if (r.createdBy) {
          r.participants = [
            {
              _id: r.createdBy._id,
              name: r.createdBy.name,
              email: r.createdBy.email,
              role: r.createdBy.role,
              department: r.createdBy.department,
              designation: r.createdBy.designation,
              employeeId: r.createdBy.employeeId,
              profilePhoto: r.createdBy.profilePhoto,
            },
          ];
        } else {
          r.participants = [];
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      reminders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get Meeting Reminders Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch meeting reminders", error: error.message });
  }
};

exports.createMeetingReminder = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const title = String(req.body.title || "").trim();
    const meetingLink = req.body.meetingLink ? String(req.body.meetingLink).trim() : "";

    let meetingDateTimeVal = null;
    if (req.body.meetingDateTime) {
      meetingDateTimeVal = new Date(req.body.meetingDateTime);
    } else if (req.body.meetingAt) {
      meetingDateTimeVal = new Date(req.body.meetingAt);
    } else if (req.body.date && req.body.time) {
      meetingDateTimeVal = new Date(`${req.body.date}T${req.body.time}`);
    }

    if (!title || !meetingDateTimeVal || Number.isNaN(meetingDateTimeVal.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Meeting title, date, and time are required.",
      });
    }

    if (meetingLink && !/^https?:\/\/\S+/i.test(meetingLink)) {
      return res.status(400).json({
        success: false,
        message: "Meeting link must be a valid http:// or https:// URL.",
      });
    }

    if (meetingDateTimeVal <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Meeting time must be in the future.",
      });
    }

    // Validate participants
    let participantIds = req.body.participants || [];
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ success: false, message: "Participants must be an array of user IDs." });
    }

    // De-duplicate
    participantIds = [...new Set(participantIds.filter(Boolean).map(String))];

    if (participantIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one participant must be selected." });
    }

    const invalidIds = participantIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, message: "Invalid participant User ID(s) provided." });
    }

    const activeUsers = await User.find({
      _id: { $in: participantIds },
      isDisabled: { $ne: true },
    }).select("_id").lean();

    if (activeUsers.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected participants are invalid, deactivated, or do not exist.",
      });
    }

    // Duplicate check
    const normalizedTitle = title.toLowerCase();
    const normalizedLink = meetingLink.toLowerCase();

    const sameTimeReminders = await MeetingReminder.find({
      createdBy: req.user._id,
      meetingDateTime: meetingDateTimeVal,
      status: "scheduled",
    });

    const isExactDuplicate = sameTimeReminders.some((r) => {
      const existingTitle = String(r.title || "").trim().toLowerCase();
      const existingLink = String(r.meetingLink || "").trim().toLowerCase();
      return existingTitle === normalizedTitle && existingLink === normalizedLink;
    });

    if (isExactDuplicate) {
      return res.status(409).json({
        success: false,
        message: "A meeting with the same title, link, and time already exists.",
      });
    }

    let warning = null;
    if (sameTimeReminders.length > 0) {
      warning = "Another meeting is already scheduled at this time.";
    }

    const notificationDelivery = participantIds.map((userId) => ({
      user: userId,
      oneHourSentAt: null,
      fifteenMinuteSentAt: null,
    }));

    const reminder = await MeetingReminder.create({
      title,
      meetingLink: meetingLink || undefined,
      meetingDateTime: meetingDateTimeVal,
      meetingAt: meetingDateTimeVal,
      createdBy: req.user._id,
      participants: participantIds,
      notificationDelivery,
    });

    // Send immediate "You have been added" notification to participants
    const organizerName = req.user.name || "Super User";
    const formattedDateString = meetingDateTimeVal.toLocaleDateString("en-IN", { dateStyle: "medium" });
    const formattedTimeString = meetingDateTimeVal.toLocaleTimeString("en-IN", { timeStyle: "short", timeZone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });
    const linkSuffix = meetingLink ? `. Link: ${meetingLink}` : "";
    const addedMessage = `You have been added to a meeting: "${title}", scheduled for ${formattedDateString} at ${formattedTimeString}. Organized by ${organizerName}${linkSuffix}`;

    try {
      await createNotifications({
        userIds: participantIds,
        message: addedMessage,
        targetPath: "/dashboard",
        type: "meeting_reminder",
        taskId: reminder._id,
      });
    } catch (notifErr) {
      console.error("Failed to send meeting addition notifications:", notifErr);
    }

    const responsePayload = {
      success: true,
      message: `Meeting reminder created successfully for ${participantIds.length} employee${participantIds.length > 1 ? "s" : ""}`,
      reminder,
    };
    if (warning) {
      responsePayload.warning = warning;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("Create Meeting Reminder Error:", error);
    res.status(500).json({ success: false, message: "Failed to create meeting reminder", error: error.message });
  }
};

exports.updateMeetingReminder = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const reminderId = req.params.id;
    const reminder = await MeetingReminder.findOne({
      _id: reminderId,
      createdBy: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: "Meeting reminder not found or access denied." });
    }

    if (reminder.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Only scheduled reminders can be edited." });
    }

    const title = req.body.title !== undefined ? String(req.body.title).trim() : reminder.title;
    const meetingLink = req.body.meetingLink !== undefined ? String(req.body.meetingLink || "").trim() : (reminder.meetingLink || "");

    const oldParticipantIds = reminder.participants ? reminder.participants.map(String) : [];
    const newParticipantIds = req.body.participants ? req.body.participants.map(String) : oldParticipantIds;

    let validatedParticipantIds = oldParticipantIds;
    if (req.body.participants !== undefined) {
      const uniqueNewIds = [...new Set(newParticipantIds.filter(Boolean))];
      if (uniqueNewIds.length === 0) {
        return res.status(400).json({ success: false, message: "At least one participant must be selected." });
      }
      const invalidIds = uniqueNewIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ success: false, message: "Invalid participant User ID(s) provided." });
      }

      const activeUsers = await User.find({
        _id: { $in: uniqueNewIds },
        isDisabled: { $ne: true },
      }).select("_id").lean();

      if (activeUsers.length !== uniqueNewIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected participants are invalid, deactivated, or do not exist.",
        });
      }
      validatedParticipantIds = uniqueNewIds;
    }

    const addedParticipants = validatedParticipantIds.filter((id) => !oldParticipantIds.includes(id));
    const removedParticipants = oldParticipantIds.filter((id) => !validatedParticipantIds.includes(id));
    const retainedParticipants = validatedParticipantIds.filter((id) => oldParticipantIds.includes(id));

    let meetingDateTimeVal = reminder.meetingDateTime;
    let dateTimeChanged = false;

    let reqDateTime = null;
    if (req.body.meetingDateTime) {
      reqDateTime = new Date(req.body.meetingDateTime);
    } else if (req.body.meetingAt) {
      reqDateTime = new Date(req.body.meetingAt);
    } else if (req.body.date && req.body.time) {
      reqDateTime = new Date(`${req.body.date}T${req.body.time}`);
    }

    if (reqDateTime) {
      if (Number.isNaN(reqDateTime.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date or time provided." });
      }
      if (reqDateTime.getTime() !== reminder.meetingDateTime.getTime()) {
        meetingDateTimeVal = reqDateTime;
        dateTimeChanged = true;
      }
    }

    if (!title) {
      return res.status(400).json({ success: false, message: "Meeting title cannot be empty." });
    }

    if (meetingLink && !/^https?:\/\/\S+/i.test(meetingLink)) {
      return res.status(400).json({ success: false, message: "Meeting link must be a valid http:// or https:// URL." });
    }

    if (meetingDateTimeVal <= new Date()) {
      return res.status(400).json({ success: false, message: "Meeting date and time must be in the future." });
    }

    const titleChanged = title !== reminder.title;
    const linkChanged = meetingLink !== (reminder.meetingLink || "");

    // Duplicate check
    const normalizedTitle = title.toLowerCase();
    const normalizedLink = meetingLink.toLowerCase();

    const sameTimeReminders = await MeetingReminder.find({
      _id: { $ne: reminderId },
      createdBy: req.user._id,
      meetingDateTime: meetingDateTimeVal,
      status: "scheduled",
    });

    const isExactDuplicate = sameTimeReminders.some((r) => {
      const existingTitle = String(r.title || "").trim().toLowerCase();
      const existingLink = String(r.meetingLink || "").trim().toLowerCase();
      return existingTitle === normalizedTitle && existingLink === normalizedLink;
    });

    if (isExactDuplicate) {
      return res.status(409).json({
        success: false,
        message: "A meeting with the same title, link, and time already exists.",
      });
    }

    let warning = null;
    if (sameTimeReminders.length > 0) {
      warning = "Another meeting is already scheduled at this time.";
    }

    // Build notification delivery map
    const oldDeliveryMap = {};
    (reminder.notificationDelivery || []).forEach((d) => {
      if (d.user) {
        oldDeliveryMap[String(d.user)] = d;
      }
    });

    const newNotificationDelivery = [];
    validatedParticipantIds.forEach((userId) => {
      const oldDelivery = oldDeliveryMap[userId];
      if (oldDelivery && !dateTimeChanged) {
        newNotificationDelivery.push({
          user: userId,
          oneHourSentAt: oldDelivery.oneHourSentAt,
          fifteenMinuteSentAt: oldDelivery.fifteenMinuteSentAt,
        });
      } else {
        newNotificationDelivery.push({
          user: userId,
          oneHourSentAt: null,
          fifteenMinuteSentAt: null,
        });
      }
    });

    reminder.title = title;
    reminder.meetingLink = meetingLink || undefined;
    reminder.meetingDateTime = meetingDateTimeVal;
    reminder.meetingAt = meetingDateTimeVal;
    reminder.participants = validatedParticipantIds;
    reminder.notificationDelivery = newNotificationDelivery;

    if (dateTimeChanged) {
      reminder.oneHourReminderSentAt = null;
      reminder.fifteenMinuteReminderSentAt = null;
    }

    await reminder.save();

    // Trigger update notifications
    const organizerName = req.user.name || "Super User";
    const formattedDateString = meetingDateTimeVal.toLocaleDateString("en-IN", { dateStyle: "medium" });
    const formattedTimeString = meetingDateTimeVal.toLocaleTimeString("en-IN", { timeStyle: "short", timeZone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });
    const linkSuffix = meetingLink ? `. Link: ${meetingLink}` : "";

    // 1. Newly added employees notification
    if (addedParticipants.length > 0) {
      try {
        const addedMessage = `You have been added to a meeting: "${title}", scheduled for ${formattedDateString} at ${formattedTimeString}. Organized by ${organizerName}${linkSuffix}`;
        await createNotifications({
          userIds: addedParticipants,
          message: addedMessage,
          targetPath: "/dashboard",
          type: "meeting_reminder",
          taskId: reminder._id,
        });
      } catch (err) {
        console.error("Failed to send added notifications:", err);
      }
    }

    // 2. Removed employees notification
    if (removedParticipants.length > 0) {
      try {
        const removedMessage = `You have been removed from the meeting: "${title}". Organized by ${organizerName}.`;
        await createNotifications({
          userIds: removedParticipants,
          message: removedMessage,
          targetPath: "/dashboard",
          type: "meeting_reminder",
          taskId: reminder._id,
        });
      } catch (err) {
        console.error("Failed to send removed notifications:", err);
      }
    }

    // 3. Re-notifying remaining employees about core updates
    const fieldsChanged = dateTimeChanged || titleChanged || linkChanged;
    if (fieldsChanged && retainedParticipants.length > 0) {
      try {
        const updateMessage = `Meeting "${title}" scheduled for ${formattedDateString} at ${formattedTimeString} has been updated by ${organizerName}${linkSuffix}`;
        await createNotifications({
          userIds: retainedParticipants,
          message: updateMessage,
          targetPath: "/dashboard",
          type: "meeting_reminder",
          taskId: reminder._id,
        });
      } catch (err) {
        console.error("Failed to send update notifications:", err);
      }
    }

    const responsePayload = {
      success: true,
      message: "Meeting reminder updated successfully",
      reminder,
    };
    if (warning) {
      responsePayload.warning = warning;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("Update Meeting Reminder Error:", error);
    res.status(500).json({ success: false, message: "Failed to update meeting reminder", error: error.message });
  }
};

exports.deleteMeetingReminder = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const reminder = await MeetingReminder.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: "Meeting reminder not found or access denied." });
    }

    reminder.status = "cancelled";
    reminder.cancelledAt = new Date();
    await reminder.save();

    // Broadcast cancellation to all participants
    if (reminder.participants && reminder.participants.length > 0) {
      try {
        const organizerName = req.user.name || "Super User";
        const mTime = reminder.meetingDateTime || reminder.meetingAt;
        const formattedDateString = mTime ? new Date(mTime).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "";
        const formattedTimeString = mTime ? new Date(mTime).toLocaleTimeString("en-IN", { timeStyle: "short", timeZone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" }) : "";
        const cancelMessage = `Meeting "${reminder.title}" scheduled for ${formattedDateString} at ${formattedTimeString} has been cancelled by ${organizerName}.`;
        
        await createNotifications({
          userIds: reminder.participants.map(String),
          message: cancelMessage,
          targetPath: "/dashboard",
          type: "meeting_reminder",
          taskId: reminder._id,
        });
      } catch (err) {
        console.error("Failed to send cancel notifications:", err);
      }
    }

    res.json({ success: true, message: "Meeting reminder cancelled successfully" });
  } catch (error) {
    console.error("Cancel Meeting Reminder Error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel meeting reminder", error: error.message });
  }
};
