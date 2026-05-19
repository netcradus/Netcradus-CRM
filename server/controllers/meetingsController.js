const AuditLog = require("../models/AuditLog");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const MeetingTimeline = require("../models/MeetingTimeline");

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const isSuperUser = (user) => normalizeRole(user?.role) === "super_user";

const ensureSuperUser = (req, res) => {
  if (isSuperUser(req.user)) {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only super users can access meetings.",
  });
  return false;
};

const populateMeetingLead = (query) =>
  query
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .populate("notes.addedBy", "name email")
    .populate("callLog.calledBy", "name email");

const buildMeetingFilters = () => ({
  status: "meeting_aligned",
  convertedToDealAt: null,
});

const getTimelineMap = async (leadIds) => {
  const timelines = await MeetingTimeline.find({ leadId: { $in: leadIds } })
    .populate("events.performedBy", "name email")
    .lean();

  return new Map(timelines.map((timeline) => [String(timeline.leadId), timeline]));
};

const addTimelineEvent = async (leadId, event) => {
  await MeetingTimeline.findOneAndUpdate(
    { leadId },
    {
      $setOnInsert: { leadId, createdAt: new Date() },
      $set: { updatedAt: new Date() },
      $push: { events: event },
    },
    { upsert: true, new: true }
  );
};

const writeAuditLog = async (action, req, lead, details = {}) => {
  await AuditLog.create({
    action,
    performedBy: req.user._id,
    entityType: "Lead",
    entityId: lead._id,
    details,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

exports.getMeetings = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const query = buildMeetingFilters();

    const [leads, total] = await Promise.all([
      populateMeetingLead(
        Lead.find(query)
          .sort({ meetingScheduledAt: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ),
      Lead.countDocuments(query),
    ]);

    const timelineMap = await getTimelineMap(leads.map((lead) => lead._id));
    const data = leads.map((lead) => ({
      ...lead,
      timeline: timelineMap.get(String(lead._id)) || { leadId: lead._id, events: [] },
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Meetings Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch meetings", error: error.message });
  }
};

exports.getMeetingDetail = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const lead = await populateMeetingLead(Lead.findById(req.params.leadId));
    if (!lead || lead.status !== "meeting_aligned") {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const timeline = await MeetingTimeline.findOne({ leadId: lead._id })
      .populate("events.performedBy", "name email")
      .lean();

    res.json({
      success: true,
      data: {
        lead,
        timeline: timeline || { leadId: lead._id, events: [] },
      },
    });
  } catch (error) {
    console.error("Get Meeting Detail Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch meeting detail", error: error.message });
  }
};

exports.updateMeetingOutcome = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead || lead.status !== "meeting_aligned") {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const outcome = String(req.body.outcome || "").trim().toLowerCase();
    const note = String(req.body.note || "").trim();

    if (!["converted", "dropped", "rescheduled"].includes(outcome)) {
      return res.status(400).json({ success: false, message: "Invalid meeting outcome." });
    }

    if (outcome === "dropped" && !note) {
      return res.status(400).json({ success: false, message: "A note is required when dropping a meeting." });
    }

    if (outcome === "rescheduled") {
      const rescheduledAt = new Date(req.body.rescheduledAt);
      if (Number.isNaN(rescheduledAt.getTime())) {
        return res.status(400).json({ success: false, message: "A valid rescheduled date is required." });
      }

      lead.meetingScheduledAt = rescheduledAt;
      lead.meetingOutcome = "rescheduled";
      lead.rescheduledAt = rescheduledAt;

      await addTimelineEvent(lead._id, {
        eventType: "meeting_rescheduled",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { rescheduledAt },
      });

      await addTimelineEvent(lead._id, {
        eventType: "outcome_set",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { outcome: "rescheduled" },
      });

      await writeAuditLog("MEETING_RESCHEDULED", req, lead, { rescheduledAt, note });
    }

    if (outcome === "dropped") {
      lead.status = "not_interested";
      lead.meetingOutcome = "dropped";
      lead.meetingScheduledAt = null;
      lead.meetingLocation = null;
      lead.meetingType = null;
      lead.rescheduledAt = null;

      await addTimelineEvent(lead._id, {
        eventType: "dropped",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { outcome: "dropped" },
      });

      await addTimelineEvent(lead._id, {
        eventType: "outcome_set",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { outcome: "dropped" },
      });

      await writeAuditLog("MEETING_DROPPED", req, lead, { note });
    }

    if (outcome === "converted") {
      const dealData = req.body.dealData || {};
      if (!dealData.name || !dealData.value) {
        return res.status(400).json({ success: false, message: "Deal name and value are required to convert a meeting." });
      }

      const deal = await Deal.create({
        name: dealData.name,
        value: dealData.value,
        status: dealData.status || "New",
        assignedTo: dealData.assignedTo || lead.assignedTo?.toString() || lead.createdBy?.toString() || "Unassigned",
        expectedCloseDate: dealData.expectedCloseDate || null,
        sourceLead: lead._id,
      });

      lead.convertedToDealAt = new Date();
      lead.convertedToDealId = deal._id;
      lead.meetingOutcome = "converted";

      await addTimelineEvent(lead._id, {
        eventType: "converted_to_deal",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { dealId: deal._id },
      });

      await addTimelineEvent(lead._id, {
        eventType: "outcome_set",
        performedBy: req.user._id,
        performedAt: new Date(),
        note,
        metadata: { outcome: "converted", dealId: deal._id },
      });

      await writeAuditLog("MEETING_CONVERTED_TO_DEAL", req, lead, { dealId: deal._id, note });
    }

    await lead.save();
    await lead.populate([
      { path: "createdBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "convertedToDealId", select: "name status value assignedTo expectedCloseDate" },
    ]);

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("Update Meeting Outcome Error:", error);
    res.status(500).json({ success: false, message: "Failed to update meeting outcome", error: error.message });
  }
};

exports.addMeetingNote = async (req, res) => {
  if (!ensureSuperUser(req, res)) {
    return;
  }

  try {
    const note = String(req.body.note || "").trim();
    if (!note) {
      return res.status(400).json({ success: false, message: "A note is required." });
    }

    const lead = await Lead.findById(req.params.leadId);
    if (!lead || lead.status !== "meeting_aligned") {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    await addTimelineEvent(lead._id, {
      eventType: "note_added",
      performedBy: req.user._id,
      performedAt: new Date(),
      note,
      metadata: null,
    });

    await writeAuditLog("MEETING_NOTE_ADDED", req, lead, { note });

    const timeline = await MeetingTimeline.findOne({ leadId: lead._id })
      .populate("events.performedBy", "name email")
      .lean();

    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error("Add Meeting Note Error:", error);
    res.status(500).json({ success: false, message: "Failed to add meeting note", error: error.message });
  }
};
