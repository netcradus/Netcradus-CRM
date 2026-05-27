const { Parser } = require("json2csv");

const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const User = require("../models/User");
const MeetingTimeline = require("../models/MeetingTimeline");

const LEAD_STATUSES = ["not_interested", "call_back", "meeting_aligned"];
const CALL_OUTCOMES = ["no_answer", "call_back", "not_interested", "meeting_aligned", "other"];
const MEETING_TYPES = ["in_person", "video_call", "phone_call"];
const SALES_UPDATE_FIELDS = new Set([
  "status",
  "note",
  "callLog",
  "meetingScheduledAt",
  "meetingLocation",
  "meetingType",
]);
const IMPORTABLE_LEAD_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "status",
  "note",
  "meetingScheduledAt",
  "meetingLocation",
  "meetingType",
]);
const IMPORT_FIELD_BY_HEADER = {
  name: "name",
  fullname: "name",
  leadname: "name",
  email: "email",
  emailaddress: "email",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  company: "company",
  companyname: "company",
  status: "status",
  note: "note",
  notes: "note",
  meetingscheduledat: "meetingScheduledAt",
  meetingdate: "meetingScheduledAt",
  meetingdatetime: "meetingScheduledAt",
  meetinglocation: "meetingLocation",
  location: "meetingLocation",
  meetingtype: "meetingType",
};

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const isSuperUser = (user) => normalizeRole(user?.role) === "super_user";
const isSalesUser = (user) => normalizeRole(user?.role) === "sales";
const normalizeImportHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeImportFieldName = (value) => (IMPORTABLE_LEAD_FIELDS.has(value) ? value : "");

const ensureLeadAccess = (req, res) => {
  if (isSuperUser(req.user) || isSalesUser(req.user)) {
    return true;
  }

  res.status(403).json({
    success: false,
    message: "Only super users and sales users can access leads.",
  });
  return false;
};

const extractLegacyNoteText = (entry) => {
  const normalizedEntry = typeof entry?.toObject === "function" ? entry.toObject() : entry;

  if (!normalizedEntry) {
    return "";
  }

  if (typeof normalizedEntry === "string") {
    return normalizedEntry.trim();
  }

  if (typeof normalizedEntry.text === "string" && normalizedEntry.text.trim()) {
    return normalizedEntry.text.trim();
  }

  const numericKeys = Object.keys(normalizedEntry)
    .filter((key) => /^\d+$/.test(key))
    .sort((left, right) => Number(left) - Number(right));

  if (!numericKeys.length) {
    return "";
  }

  return numericKeys.map((key) => normalizedEntry[key]).join("").trim();
};

const ensureArrayNotes = (lead) => {
  const sourceNotes = Array.isArray(lead.notes)
    ? lead.notes
    : typeof lead.notes === "string" && lead.notes.trim()
      ? [lead.notes]
      : [];

  const normalizedNotes = sourceNotes
    .map((entry) => {
      const text = extractLegacyNoteText(entry);
      if (!text) {
        return null;
      }

      const normalizedEntry = typeof entry?.toObject === "function" ? entry.toObject() : entry;

      return {
        text,
        addedBy: normalizedEntry?.addedBy || lead.createdBy,
        addedAt: normalizedEntry?.addedAt || lead.updatedAt || lead.createdAt || new Date(),
      };
    })
    .filter(Boolean);

  lead.set("notes", normalizedNotes);
  return lead.notes;
};

const appendNote = (lead, text, userId) => {
  const trimmedText = String(text || "").trim();
  if (!trimmedText) {
    return;
  }

  ensureArrayNotes(lead);
  lead.notes.push({
    text: trimmedText,
    addedBy: userId,
    addedAt: new Date(),
  });
};

const normalizeLeadStatus = (status) => {
  if (!status) {
    return null;
  }

  const normalized = String(status).trim().toLowerCase();
  return LEAD_STATUSES.includes(normalized) ? normalized : null;
};

const normalizeCallLogEntry = (entry, userId) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const outcome = String(entry.outcome || "").trim().toLowerCase();
  if (!CALL_OUTCOMES.includes(outcome)) {
    return null;
  }

  return {
    calledAt: entry.calledAt ? new Date(entry.calledAt) : new Date(),
    calledBy: userId,
    outcome,
    note: String(entry.note || "").trim(),
  };
};

const getMeetingPayload = (body) => ({
  meetingScheduledAt: body.meetingScheduledAt ? new Date(body.meetingScheduledAt) : null,
  meetingLocation: body.meetingLocation ? String(body.meetingLocation).trim() : "",
  meetingType: body.meetingType ? String(body.meetingType).trim().toLowerCase() : "",
});

const validateMeetingPayload = ({ meetingScheduledAt, meetingLocation, meetingType }) => {
  if (!meetingScheduledAt || Number.isNaN(meetingScheduledAt.getTime())) {
    return "Meeting date and time is required.";
  }

  if (!meetingLocation) {
    return "Meeting location is required.";
  }

  if (!MEETING_TYPES.includes(meetingType)) {
    return "Meeting type is required.";
  }

  return null;
};

const upsertMeetingTimelineEvent = async (leadId, event) => {
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

const populateLeadQuery = (query) =>
  query
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .populate("notes.addedBy", "name email")
    .populate("callLog.calledBy", "name email");

const buildLeadQuery = (req) => {
  const query = {
    status: { $ne: "meeting_aligned" },
  };
  const { status, search, startDate, endDate } = req.query;

  if (status) {
    const statusArray = String(status)
      .split(",")
      .map((value) => normalizeLeadStatus(value))
      .filter(Boolean)
      .filter((value) => value !== "meeting_aligned");

    if (statusArray.length > 0) {
      query.status = { $in: statusArray };
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      const nextDay = new Date(`${endDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.createdAt.$lt = nextDay;
    }
  }

  return query;
};

const applyMeetingAlignment = async (lead, reqBody, userId, timelineEventType = "meeting_scheduled") => {
  const meetingPayload = getMeetingPayload(reqBody);
  const validationMessage = validateMeetingPayload(meetingPayload);

  if (validationMessage) {
    return { error: validationMessage };
  }

  lead.status = "meeting_aligned";
  lead.meetingScheduledAt = meetingPayload.meetingScheduledAt;
  lead.meetingLocation = meetingPayload.meetingLocation;
  lead.meetingType = meetingPayload.meetingType;
  lead.meetingOutcome = "pending";
  lead.rescheduledAt = null;

  await upsertMeetingTimelineEvent(lead._id, {
    eventType: timelineEventType,
    performedBy: userId,
    performedAt: new Date(),
    metadata: {
      scheduledAt: meetingPayload.meetingScheduledAt,
      location: meetingPayload.meetingLocation,
      meetingType: meetingPayload.meetingType,
    },
  });

  return { error: null };
};

const getLeads = async (req, res) => {
  if (!ensureLeadAccess(req, res)) {
    return;
  }

  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const allowedSortFields = ["createdAt", "updatedAt", "name", "company", "status", "meetingScheduledAt"];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const query = buildLeadQuery(req);

    const [leads, totalLeads] = await Promise.all([
      populateLeadQuery(
        Lead.find(query)
          .sort({ [sortBy]: order })
          .skip(skip)
          .limit(limit)
          .lean()
      ),
      Lead.countDocuments(query),
    ]);

    const normalizedLeads = leads.map((lead) => {
      const nextLead = { ...lead };
      if (!Array.isArray(nextLead.notes)) {
        nextLead.notes = nextLead.notes
          ? [{ text: String(nextLead.notes), addedBy: nextLead.createdBy, addedAt: nextLead.updatedAt || nextLead.createdAt }]
          : [];
      }
      nextLead.callLog = Array.isArray(nextLead.callLog) ? nextLead.callLog : [];
      return nextLead;
    });

    res.json({
      success: true,
      data: normalizedLeads,
      pagination: {
        totalLeads,
        totalPages: Math.ceil(totalLeads / limit) || 1,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Fetch Leads Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching leads", error: error.message });
  }
};

const getLead = async (req, res) => {
  if (!ensureLeadAccess(req, res)) {
    return;
  }

  try {
    const lead = await populateLeadQuery(Lead.findById(req.params.id));
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    ensureArrayNotes(lead);
    lead.callLog = Array.isArray(lead.callLog) ? lead.callLog : [];
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("Fetch Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching lead", error: error.message });
  }
};

const createLead = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can create leads." });
  }

  try {
    const status = normalizeLeadStatus(req.body.status) || "call_back";
    const lead = new Lead({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      status,
      assignedTo: req.body.assignedTo && String(req.body.assignedTo).trim() ? req.body.assignedTo : null,
      createdBy: req.user._id,
      notes: [],
      callLog: [],
    });

    appendNote(lead, req.body.note || req.body.notes, req.user._id);

    if (status === "meeting_aligned") {
      const alignmentResult = await applyMeetingAlignment(lead, req.body, req.user._id);
      if (alignmentResult.error) {
        return res.status(400).json({ success: false, message: alignmentResult.error });
      }
    }

    await lead.save();
    await lead.populate([
      { path: "createdBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "notes.addedBy", select: "name email" },
      { path: "callLog.calledBy", select: "name email" },
    ]);

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error("Create Lead Error:", error);
    res.status(400).json({ success: false, message: "Failed to create lead", error: error.message });
  }
};

const updateLead = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can fully edit leads." });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    ensureArrayNotes(lead);

    const fields = ["name", "email", "phone", "company", "meetingNotes"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    if (req.body.assignedTo !== undefined) {
      lead.assignedTo = req.body.assignedTo && String(req.body.assignedTo).trim() ? req.body.assignedTo : null;
    }

    if (req.body.status !== undefined) {
      const status = normalizeLeadStatus(req.body.status);
      if (!status) {
        return res.status(400).json({ success: false, message: "Invalid lead status." });
      }

      if (status === "meeting_aligned") {
        const alignmentResult = await applyMeetingAlignment(lead, req.body, req.user._id);
        if (alignmentResult.error) {
          return res.status(400).json({ success: false, message: alignmentResult.error });
        }
      } else {
        lead.status = status;
        if (status !== "meeting_aligned") {
          lead.meetingOutcome = null;
        }
      }
    }

    appendNote(lead, req.body.note || req.body.notes, req.user._id);

    await lead.save();
    await lead.populate([
      { path: "createdBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "notes.addedBy", select: "name email" },
      { path: "callLog.calledBy", select: "name email" },
    ]);

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(400).json({ success: false, message: "Failed to update lead", error: error.message });
  }
};

const salesUpdateLead = async (req, res) => {
  if (!ensureLeadAccess(req, res)) {
    return;
  }

  const currentRole = normalizeRole(req.user.role);
  if (!["sales", "super_user"].includes(currentRole)) {
    return res.status(403).json({ success: false, message: "Only sales users and super users can use this endpoint." });
  }

  const invalidFields = Object.keys(req.body).filter((field) => !SALES_UPDATE_FIELDS.has(field));
  if (invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Sales updates cannot modify these fields: ${invalidFields.join(", ")}`,
    });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    ensureArrayNotes(lead);

    const requestedStatus = normalizeLeadStatus(req.body.status);
    if (req.body.status !== undefined && !requestedStatus) {
      return res.status(400).json({ success: false, message: "Invalid lead status." });
    }

    const callLogEntry = normalizeCallLogEntry(req.body.callLog, req.user._id);
    if (req.body.callLog && !callLogEntry) {
      return res.status(400).json({ success: false, message: "Invalid call log payload." });
    }

    const effectiveStatus = requestedStatus || (callLogEntry?.outcome === "meeting_aligned"
      ? "meeting_aligned"
      : callLogEntry?.outcome === "call_back"
        ? "call_back"
        : callLogEntry?.outcome === "not_interested"
          ? "not_interested"
          : null);

    if (callLogEntry) {
      lead.callLog.push(callLogEntry);
    }

    appendNote(lead, req.body.note, req.user._id);

    if (effectiveStatus === "meeting_aligned") {
      const alignmentResult = await applyMeetingAlignment(
        lead,
        req.body,
        req.user._id,
        lead.status === "meeting_aligned" ? "meeting_rescheduled" : "meeting_scheduled"
      );

      if (alignmentResult.error) {
        return res.status(400).json({ success: false, message: alignmentResult.error });
      }
    } else if (effectiveStatus) {
      lead.status = effectiveStatus;
      if (effectiveStatus !== "meeting_aligned") {
        lead.meetingOutcome = null;
      }
    }

    await lead.save();
    await lead.populate([
      { path: "createdBy", select: "name email role" },
      { path: "assignedTo", select: "name email role" },
      { path: "notes.addedBy", select: "name email" },
      { path: "callLog.calledBy", select: "name email" },
    ]);

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("Sales Update Lead Error:", error);
    res.status(400).json({ success: false, message: "Failed to update lead", error: error.message });
  }
};

const deleteLead = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can delete leads." });
  }

  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    await MeetingTimeline.deleteOne({ leadId: deletedLead._id });

    res.json({ success: true, message: "Lead deleted successfully.", data: deletedLead });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete lead", error: error.message });
  }
};

const bulkDeleteLeads = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can bulk delete leads." });
  }

  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: "No lead IDs provided." });
    }

    const result = await Lead.deleteMany({ _id: { $in: ids } });
    await MeetingTimeline.deleteMany({ leadId: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} lead(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk Delete Leads Error:", error);
    res.status(500).json({ success: false, message: "Failed to bulk delete leads", error: error.message });
  }
};

const deleteAllLeads = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can delete leads." });
  }

  try {
    const query = buildLeadQuery(req);
    const hasFilters = ["status", "search", "startDate", "endDate"].some((key) => Boolean(req.query[key]));
    const confirmed = req.query.confirmDeleteAll === "true";

    if (!hasFilters && !confirmed) {
      return res.status(400).json({
        success: false,
        message: "To delete all visible leads without filters, pass ?confirmDeleteAll=true.",
        requiresConfirmation: true,
      });
    }

    const leadIds = await Lead.find(query).distinct("_id");
    const result = await Lead.deleteMany(query);
    await MeetingTimeline.deleteMany({ leadId: { $in: leadIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} lead(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete All Leads Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete leads", error: error.message });
  }
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const importLeads = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can import leads." });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload a CSV file." });
  }

  try {
    const rawContent = req.file.buffer.toString("utf8").trim();
    if (!rawContent) {
      return res.status(400).json({ success: false, message: "Uploaded file is empty." });
    }

    const [headerLine, ...rows] = rawContent.split(/\r?\n/).filter(Boolean);
    const rawHeaders = parseCsvLine(headerLine);
    const headers = rawHeaders.map((value) => normalizeImportHeader(value));
    const headerLookup = rawHeaders.reduce((lookup, header, index) => {
      lookup[header] = headers[index];
      return lookup;
    }, {});
    let fieldMapping = {};

    if (req.body.fieldMapping) {
      try {
        fieldMapping = JSON.parse(req.body.fieldMapping);
      } catch (parseError) {
        return res.status(400).json({ success: false, message: "Invalid field mapping format." });
      }
    }

    const normalizedMapping = Object.entries(fieldMapping).reduce((mapping, [sourceHeader, leadField]) => {
      const normalizedSource = headerLookup[sourceHeader] || normalizeImportHeader(sourceHeader);
      const normalizedField = normalizeImportFieldName(leadField);
      if (normalizedSource && headers.includes(normalizedSource) && normalizedField) {
        mapping[normalizedSource] = normalizedField;
      }
      return mapping;
    }, {});
    const createdLeads = [];

    for (const row of rows) {
      const values = parseCsvLine(row);
      const rawRecord = headers.reduce((accumulator, header, index) => {
        accumulator[header] = values[index] || "";
        return accumulator;
      }, {});
      const record = headers.reduce((accumulator, header) => {
        const leadField = normalizedMapping[header] || IMPORT_FIELD_BY_HEADER[header];
        if (leadField) {
          accumulator[leadField] = rawRecord[header];
        }
        accumulator[header] = rawRecord[header];
        return accumulator;
      }, {});

      const lead = new Lead({
        name: record.name,
        email: record.email,
        phone: record.phone,
        company: record.company,
        status: normalizeLeadStatus(record.status) || "call_back",
        createdBy: req.user._id,
      });

      appendNote(lead, record.note || record.notes, req.user._id);

      if (lead.status === "meeting_aligned") {
        const alignmentResult = await applyMeetingAlignment(
          lead,
          {
            meetingScheduledAt: record.meetingScheduledAt || record.meetingscheduledat || record.meetingdate || record.meetingdatetime,
            meetingLocation: record.meetingLocation || record.meetinglocation || record.location,
            meetingType: record.meetingType || record.meetingtype,
          },
          req.user._id
        );

        if (alignmentResult.error) {
          lead.status = "call_back";
        }
      }

      createdLeads.push(lead);
    }

    if (!createdLeads.length) {
      return res.status(400).json({ success: false, message: "No lead rows were found in the uploaded file." });
    }

    const savedLeads = await Lead.insertMany(createdLeads);
    res.status(201).json({
      success: true,
      message: `${savedLeads.length} lead(s) imported successfully.`,
      importedCount: savedLeads.length,
    });
  } catch (error) {
    console.error("Import Leads Error:", error);
    res.status(500).json({ success: false, message: "Failed to import leads", error: error.message });
  }
};

const exportLeads = async (req, res) => {
  if (!isSuperUser(req.user)) {
    return res.status(403).json({ success: false, message: "Only super users can export leads." });
  }

  try {
    const query = buildLeadQuery(req);
    const leads = await Lead.find(query)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const exportRows = leads.map((lead) => ({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status || "",
      assignedTo: lead.assignedTo?.name || "",
      createdBy: lead.createdBy?.name || "",
      latestNote: Array.isArray(lead.notes) && lead.notes.length ? lead.notes[lead.notes.length - 1].text : "",
      lastCallDate: Array.isArray(lead.callLog) && lead.callLog.length ? lead.callLog[lead.callLog.length - 1].calledAt : "",
      meetingScheduledAt: lead.meetingScheduledAt || "",
      meetingLocation: lead.meetingLocation || "",
      meetingType: lead.meetingType || "",
    }));

    const parser = new Parser({ fields: Object.keys(exportRows[0] || { name: "", email: "", phone: "", company: "", status: "" }) });
    const csv = parser.parse(exportRows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="leads_export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Leads Error:", error);
    res.status(500).json({ success: false, message: "Failed to export leads", error: error.message });
  }
};

module.exports = {
  LEAD_STATUSES,
  MEETING_TYPES,
  getLeads,
  getLead,
  createLead,
  updateLead,
  salesUpdateLead,
  deleteLead,
  bulkDeleteLeads,
  deleteAllLeads,
  importLeads,
  exportLeads,
};
