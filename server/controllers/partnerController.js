const mongoose = require("mongoose");
const Vendor = require("../models/vendorModel");
const Project = require("../models/Project");
const ProjectTimeline = require("../models/ProjectTimeline");
const TaskNotification = require("../models/TaskNotification");
const User = require("../models/User");
const storageService = require("../services/storageService");
const { notifyPartnerFileUploaded } = require("../services/partnerNotificationService");

const PARTNER_PROJECT_STATUSES = ["new", "under_review", "approved", "in_progress", "testing", "completed", "on_hold", "cancelled"];
const SERVICE_TYPES = ["Penetration Testing", "SOC Monitoring", "Web Development", "Cloud Security", "SIEM Deployment", "Compliance", "Incident Response"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const catchAsync = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((error) => {
    console.error("[PartnerController]", error);
    res.status(500).json({ success: false, message: "Partner request failed." });
  });

const isAdminRole = (role) => ["super_user", "admin"].includes(String(role || "").trim().toLowerCase());
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const parseDate = (value) => (value ? new Date(value) : null);

const ensurePartnerScope = (req, partnerId) => {
  if (isAdminRole(req.user.role)) return String(partnerId || "");
  return String(req.user._id || req.user.id || "");
};

const getPartnerProjectQuery = (req) => {
  const query = { isDeleted: false };
  if (isAdminRole(req.user.role)) {
    // Admins see every partner-owned project unless a specific partnerId filter is supplied.
    query.partnerId = isValidId(req.query.partnerId) ? req.query.partnerId : { $exists: true, $ne: null };
  } else {
    query.partnerId = req.user._id || req.user.id;
  }
  return query;
};

const getPartnerVendorQuery = (req) => {
  if (!isAdminRole(req.user.role)) {
    return { partnerId: req.user._id || req.user.id };
  }

  // Admins see every partner-owned vendor unless a specific partnerId filter is supplied.
  return isValidId(req.query.partnerId) ? { partnerId: req.query.partnerId } : { partnerId: { $exists: true, $ne: null } };
};

const notifySuperUsersOfPartnerVendor = async (vendor, req) => {
  const superUsers = await User.find({ role: "super_user", isDisabled: { $ne: true } }).select("_id").lean();
  if (!superUsers.length) return;

  // Super Admin gets a bell notification when partners create vendors; partners use the topbar bell only.
  await TaskNotification.insertMany(
    superUsers.map((user) => ({
      userId: user._id,
      message: `New partner vendor created: ${vendor.name}`,
      targetPath: `/admin/partners/${vendor.partnerId}`,
      type: "partner_project",
    }))
  );
};

const buildVendorPayload = (body, partnerId) => ({
  name: String(body.name || body.companyName || "").trim(),
  email: String(body.email || "").trim().toLowerCase(),
  category: body.category || "Partner",
  status: body.status || "Active",
  partnerId,
  contactPerson: String(body.contactPerson || "").trim(),
  phone: String(body.phone || "").trim(),
  country: String(body.country || "").trim(),
  industry: String(body.industry || "").trim(),
  address: String(body.address || "").trim(),
  notes: String(body.notes || "").trim(),
});

const buildProjectPayload = (body, partnerId) => ({
  name: String(body.name || "").trim(),
  clientName: String(body.clientName || "").trim(),
  clientCompany: String(body.clientCompany || "").trim(),
  vendorId: isValidId(body.vendorId) ? body.vendorId : null,
  serviceType: String(body.serviceType || "").trim(),
  description: String(body.description || "").trim(),
  status: PARTNER_PROJECT_STATUSES.includes(body.status) ? body.status : "new",
  priority: PRIORITIES.includes(body.priority) ? body.priority : "Medium",
  expectedBudget: Number(body.expectedBudget || 0),
  startDate: parseDate(body.startDate),
  deadline: parseDate(body.deadline),
  endDate: parseDate(body.deadline),
  partnerNotes: String(body.partnerNotes || body.notes || "").trim(),
  partnerId,
  createdBy: partnerId,
  isVisibleInShowcase: false,
});

const populatePartnerProject = (query) =>
  query
    .populate("vendorId", "name contactPerson email phone country status")
    .populate("partnerId", "name email role")
    .populate("assignedEngineer", "name email role")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");

exports.getDashboard = catchAsync(async (req, res) => {
  const partnerId = ensurePartnerScope(req, req.params.partnerId);
  const projectQuery = { isDeleted: false, partnerId };

  const projectIds = await Project.find(projectQuery).distinct("_id");
  const [totalVendors, projects, openTickets, latestNotifications, timeline] = await Promise.all([
    Vendor.countDocuments({ partnerId }),
    Project.find(projectQuery).select("status expectedBudget").lean(),
    require("../models/Ticket").countDocuments({ raisedBy: partnerId, status: { $ne: "closed" } }).catch(() => 0),
    TaskNotification.find({ userId: partnerId }).sort({ createdAt: -1 }).limit(5).lean(),
    ProjectTimeline.find({ projectId: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const statusCount = (statuses) => projects.filter((project) => statuses.includes(project.status)).length;

  res.json({
    success: true,
    data: {
      totalVendors,
      activeProjects: statusCount(["approved", "in_progress", "testing", "ongoing"]),
      pendingProjects: statusCount(["new", "under_review", "on_hold"]),
      completedProjects: statusCount(["completed"]),
      revenueGenerated: 0,
      openTickets,
      latestNotifications,
      recentProjectUpdates: timeline,
    },
  });
});

exports.getVendors = catchAsync(async (req, res) => {
  const vendors = await Vendor.find(getPartnerVendorQuery(req)).populate("partnerId", "name email role").sort({ createdAt: -1 }).lean();
  res.json({ success: true, vendors });
});

exports.createVendor = catchAsync(async (req, res) => {
  const partnerId = ensurePartnerScope(req, req.body.partnerId);
  const payload = buildVendorPayload(req.body, partnerId);
  if (!payload.name || !payload.email || !payload.contactPerson || !payload.phone || !payload.country) {
    return res.status(400).json({ success: false, message: "Vendor name, contact person, email, phone and country are required." });
  }

  const vendor = await Vendor.create(payload);
  await notifySuperUsersOfPartnerVendor(vendor, req);
  res.status(201).json({ success: true, vendor });
});

exports.updateVendor = catchAsync(async (req, res) => {
  const query = { _id: req.params.id };
  if (!isAdminRole(req.user.role)) query.partnerId = req.user._id || req.user.id;

  const vendor = await Vendor.findOneAndUpdate(query, { $set: buildVendorPayload(req.body, req.body.partnerId || req.user._id || req.user.id) }, { new: true });
  if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });
  res.json({ success: true, vendor });
});

exports.deactivateVendor = catchAsync(async (req, res) => {
  const query = { _id: req.params.id };
  if (!isAdminRole(req.user.role)) query.partnerId = req.user._id || req.user.id;

  // The vendor action is a two-way status toggle so inactive vendors can be reactivated.
  const nextStatus = ["Active", "Inactive"].includes(req.body.status) ? req.body.status : "Inactive";
  const vendor = await Vendor.findOneAndUpdate(query, { $set: { status: nextStatus } }, { new: true });
  if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });
  res.json({ success: true, vendor });
});

exports.getProjects = catchAsync(async (req, res) => {
  const projects = await populatePartnerProject(Project.find(getPartnerProjectQuery(req))).sort({ updatedAt: -1, createdAt: -1 }).lean();
  res.json({ success: true, projects });
});

exports.createProject = catchAsync(async (req, res) => {
  const partnerId = ensurePartnerScope(req, req.body.partnerId);
  const payload = buildProjectPayload(req.body, partnerId);
  if (!payload.name || !payload.vendorId || !payload.deadline || !SERVICE_TYPES.includes(payload.serviceType)) {
    return res.status(400).json({ success: false, message: "Project name, vendor, service type and deadline are required." });
  }

  const vendor = await Vendor.findOne({ _id: payload.vendorId, partnerId });
  if (!vendor) return res.status(400).json({ success: false, message: "Select a vendor linked to this partner." });

  payload.clientName = payload.clientName || vendor.contactPerson || vendor.name;
  payload.clientCompany = payload.clientCompany || vendor.name;

  const project = await Project.create(payload);
  await ProjectTimeline.create({ projectId: project._id, eventText: "Project Created", createdBy: req.user._id || req.user.id });
  res.status(201).json({ success: true, project });
});

exports.getProject = catchAsync(async (req, res) => {
  const query = { _id: req.params.id, isDeleted: false };
  if (!isAdminRole(req.user.role)) query.partnerId = req.user._id || req.user.id;

  const [project, timeline] = await Promise.all([
    populatePartnerProject(Project.findOne(query)).lean(),
    ProjectTimeline.find({ projectId: req.params.id }).populate("createdBy", "name email role").sort({ createdAt: -1 }).lean(),
  ]);

  if (!project) return res.status(404).json({ success: false, message: "Project not found." });
  res.json({ success: true, project, timeline });
});

exports.updateProjectNotes = catchAsync(async (req, res) => {
  const query = { _id: req.params.id, isDeleted: false };
  if (!isAdminRole(req.user.role)) query.partnerId = req.user._id || req.user.id;

  const project = await Project.findOneAndUpdate(
    query,
    { $set: { partnerNotes: String(req.body.partnerNotes || req.body.notes || "").trim(), updatedBy: req.user._id || req.user.id, updatedAt: Date.now() } },
    { new: true }
  );
  if (!project) return res.status(404).json({ success: false, message: "Project not found." });
  res.json({ success: true, project });
});

exports.uploadProjectFile = catchAsync(async (req, res) => {
  const query = { _id: req.params.id, isDeleted: false };
  if (!isAdminRole(req.user.role)) query.partnerId = req.user._id || req.user.id;

  const project = await Project.findOne(query);
  if (!project) return res.status(404).json({ success: false, message: "Project not found." });
  if (!req.file) return res.status(400).json({ success: false, message: "File is required." });

  // Partner uploads use the existing Drive-backed storage service and attach the saved document to the project.
  const storage = await storageService.getUserStorage(req.user._id || req.user.id);
  const targetFolder = storage.subFolders?.[0];
  if (!targetFolder) return res.status(400).json({ success: false, message: "No upload folder is available for this account." });

  const document = await storageService.uploadToFolder(
    req.user._id || req.user.id,
    targetFolder.driveFolderId,
    req.file,
    "partner_project",
    project._id
  );

  project.documents.push({
    driveFileId: String(document._id),
    fileName: document.originalName || document.safeName || req.file.originalname,
    fileSizeMB: document.fileSizeMB || 0,
    uploadedAt: Date.now(),
  });
  project.updatedBy = req.user._id || req.user.id;
  await project.save();

  await ProjectTimeline.create({ projectId: project._id, eventText: "Partner File Uploaded", createdBy: req.user._id || req.user.id });
  if (isAdminRole(req.user.role)) {
    await notifyPartnerFileUploaded(project, document.originalName || req.file.originalname);
  }

  res.status(201).json({ success: true, documents: project.documents });
});

exports.addTimelineEvent = catchAsync(async (req, res) => {
  if (!isAdminRole(req.user.role)) return res.status(403).json({ success: false, message: "Only admins can write partner timeline events." });
  const eventText = String(req.body.eventText || "").trim();
  if (!eventText) return res.status(400).json({ success: false, message: "Timeline event is required." });

  const event = await ProjectTimeline.create({ projectId: req.params.id, eventText, createdBy: req.user._id || req.user.id });
  res.status(201).json({ success: true, event });
});

exports.getPartners = catchAsync(async (req, res) => {
  const partners = await User.find({ role: "partner" }).select("_id name email isDisabled createdAt").sort({ createdAt: -1 }).lean();
  const partnerIds = partners.map((partner) => partner._id);
  const [vendorCounts, activeProjectCounts] = await Promise.all([
    Vendor.aggregate([{ $match: { partnerId: { $in: partnerIds } } }, { $group: { _id: "$partnerId", total: { $sum: 1 } } }]),
    Project.aggregate([{ $match: { partnerId: { $in: partnerIds }, isDeleted: false, status: { $in: ["approved", "in_progress", "testing", "ongoing"] } } }, { $group: { _id: "$partnerId", total: { $sum: 1 } } }]),
  ]);

  const vendorMap = new Map(vendorCounts.map((item) => [String(item._id), item.total]));
  const projectMap = new Map(activeProjectCounts.map((item) => [String(item._id), item.total]));

  res.json({
    success: true,
    partners: partners.map((partner) => ({
      ...partner,
      totalVendors: vendorMap.get(String(partner._id)) || 0,
      activeProjects: projectMap.get(String(partner._id)) || 0,
    })),
  });
});

exports.getPartnerDetail = catchAsync(async (req, res) => {
  const partner = await User.findOne({ _id: req.params.id, role: "partner" }).select("_id name email isDisabled createdAt").lean();
  if (!partner) return res.status(404).json({ success: false, message: "Partner not found." });

  const [vendors, projects] = await Promise.all([
    Vendor.find({ partnerId: partner._id }).sort({ createdAt: -1 }).lean(),
    populatePartnerProject(Project.find({ partnerId: partner._id, isDeleted: false })).sort({ createdAt: -1 }).lean(),
  ]);

  res.json({
    success: true,
    partner,
    vendors,
    projects,
    revenueSummary: { revenueGenerated: 0, commission: 0 },
    activityLog: [],
  });
});
