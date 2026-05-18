const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

const catchAsync = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error("projectController error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Internal server error.", code: "SERVER_ERROR" });
    }
  });

const errorResponse = (res, status, message, code) =>
  res.status(status).json({ success: false, message, code });

const PROJECT_FIELDS = [
  "name",
  "tagline",
  "description",
  "showcaseDescription",
  "status",
  "startDate",
  "endDate",
  "industry",
  "techStack",
  "thumbnail",
  "screenshots",
  "isVisibleInShowcase",
  "isFeatured",
  "clientName",
  "clientCompany",
  "clientCountry",
  "clientWebsite",
  "liveUrl",
  "stagingUrl",
  "githubUrl",
  "deploymentPlatform",
  "deploymentId",
  "deploymentPassword",
  "serverNotes",
  "environment",
  "createdBy",
  "collaborators",
];

const SHOWCASE_FIELDS = [
  "name",
  "tagline",
  "showcaseDescription",
  "status",
  "industry",
  "techStack",
  "thumbnail",
  "screenshots",
  "liveUrl",
  "clientName",
  "clientCompany",
  "clientCountry",
  "isFeatured",
  "startDate",
  "endDate",
  "deploymentPlatform",
];

const URL_FIELDS = ["liveUrl", "stagingUrl", "clientWebsite", "githubUrl"];
const STATUSES = ["completed", "ongoing", "maintenance"];
const ENVIRONMENTS = ["production", "staging", "both"];

const trimString = (value) => (typeof value === "string" ? value.trim() : value);

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch (err) {
    return false;
  }
};

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  return tags
    .map((tag) => trimString(tag))
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key) || tag.length > 30 || seen.size >= 20) return false;
      seen.add(key);
      return true;
    });
};

const normalizeStrings = (items = [], max = 10) =>
  Array.isArray(items) ? items.map(trimString).filter(Boolean).slice(0, max) : [];

const normalizeUserIds = (items = [], max = 25) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items
    .map((item) => {
      if (typeof item === "string") return trimString(item);
      if (item && typeof item === "object") return trimString(item._id || item.id || item.userId || item.value);
      return null;
    })
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .filter((value) => {
      if (seen.has(value) || seen.size >= max) return false;
      seen.add(value);
      return true;
    });
};

const buildProjectPayload = (body, allowedFields = PROJECT_FIELDS) => {
  const payload = {};

  allowedFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) return;
    const value = body[field];

    if (field === "techStack") {
      payload.techStack = normalizeTags(value);
    } else if (field === "collaborators") {
      payload.collaborators = normalizeUserIds(value);
    } else if (field === "screenshots") {
      payload.screenshots = normalizeStrings(value, 10);
    } else if (field === "createdBy") {
      payload.createdBy = mongoose.Types.ObjectId.isValid(value) ? value : undefined;
    } else if (field === "thumbnail") {
      payload.thumbnail = trimString(value) || null;
    } else if (["startDate", "endDate"].includes(field)) {
      payload[field] = value ? new Date(value) : null;
    } else if (typeof value === "string") {
      payload[field] = trimString(value);
    } else {
      payload[field] = value;
    }
  });

  return payload;
};

const validateProjectPayload = (payload, isCreate = false) => {
  if (isCreate && !payload.name) return ["Project name is required.", "PROJECT_NAME_REQUIRED"];
  if (payload.name !== undefined && !payload.name) return ["Project name is required.", "PROJECT_NAME_REQUIRED"];
  if (payload.name && payload.name.length > 100) return ["Project name cannot exceed 100 characters.", "PROJECT_NAME_TOO_LONG"];
  if (payload.tagline && payload.tagline.length > 200) return ["Tagline cannot exceed 200 characters.", "TAGLINE_TOO_LONG"];
  if (payload.description && payload.description.length > 2000) return ["Description cannot exceed 2000 characters.", "DESCRIPTION_TOO_LONG"];
  if (payload.showcaseDescription && payload.showcaseDescription.length > 500) return ["Showcase description cannot exceed 500 characters.", "SHOWCASE_DESCRIPTION_TOO_LONG"];
  if (payload.status && !STATUSES.includes(payload.status)) return ["Invalid project status.", "INVALID_STATUS"];
  if (payload.environment && !ENVIRONMENTS.includes(payload.environment)) return ["Invalid deployment environment.", "INVALID_ENVIRONMENT"];

  const invalidUrlField = URL_FIELDS.find((field) => payload[field] !== undefined && !isValidUrl(payload[field]));
  if (invalidUrlField) return [`${invalidUrlField} must be a valid URL.`, "INVALID_URL"];

  return null;
};

const findProject = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Project.findOne({ _id: id, isDeleted: false });
};

const findProjectWithUsers = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Project.findOne({ _id: id, isDeleted: false })
    .populate("createdBy", "name email role")
    .populate("collaborators", "name email role");
};

const isSuperUser = (user) => String(user?.role || "").trim().toLowerCase() === "super_user";

const isProjectOwner = (project, userId) => String(project?.createdBy?._id || project?.createdBy || "") === String(userId || "");

const ensureProjectAccess = (project, req, res) => {
  if (!project) {
    errorResponse(res, 404, "Project not found.", "PROJECT_NOT_FOUND");
    return false;
  }

  if (isSuperUser(req.user) || isProjectOwner(project, req.user.id)) {
    return true;
  }

  errorResponse(res, 403, "You are not allowed to access this project.", "PROJECT_ACCESS_DENIED");
  return false;
};

const canEditCreatedBy = (req) => isSuperUser(req.user);

const verifyActionPassword = async (req, res) => {
  const password = trimString(req.body?.password);
  if (!password) {
    errorResponse(res, 401, "Password confirmation is required.", "PASSWORD_REQUIRED");
    return false;
  }

  const verified = await bcrypt.compare(password, req.user.password);
  if (!verified) {
    errorResponse(res, 401, "Incorrect password.", "INVALID_PASSWORD");
    return false;
  }

  return true;
};

exports.createProject = catchAsync(async (req, res) => {
  const allowedFields = canEditCreatedBy(req)
    ? PROJECT_FIELDS.filter((field) => field !== "sensitiveFields")
    : PROJECT_FIELDS.filter((field) => field !== "sensitiveFields" && field !== "createdBy");
  const payload = buildProjectPayload(req.body, allowedFields);
  const validationError = validateProjectPayload(payload, true);
  if (validationError) return errorResponse(res, 400, validationError[0], validationError[1]);

  const project = await Project.create({
    ...payload,
    createdBy: payload.createdBy || req.user.id,
  });

  res.status(201).json({ success: true, project });
});

exports.updateProject = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const allowedFields = canEditCreatedBy(req)
    ? PROJECT_FIELDS
    : PROJECT_FIELDS.filter((field) => field !== "createdBy");
  const payload = buildProjectPayload(req.body, allowedFields);
  const validationError = validateProjectPayload(payload);
  if (validationError) return errorResponse(res, 400, validationError[0], validationError[1]);

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  Object.assign(project, payload, { updatedBy: req.user.id, updatedAt: Date.now() });
  await project.save();

  res.json({ success: true, project });
});

exports.deleteProject = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  project.isDeleted = true;
  project.deletedAt = Date.now();
  project.updatedBy = req.user.id;
  await project.save();

  res.json({ success: true });
});

exports.getProjects = catchAsync(async (req, res) => {
  const { status, industry, search, sortBy = "", page = 1, limit = 20 } = req.query;
  const query = { isDeleted: false };

  if (!isSuperUser(req.user)) {
    query.createdBy = req.user.id;
  }

  if (status && STATUSES.includes(status)) query.status = status;
  if (industry) query.industry = new RegExp(trimString(industry), "i");
  if (search) {
    const pattern = new RegExp(trimString(search), "i");
    query.$or = [{ name: pattern }, { clientName: pattern }, { clientCompany: pattern }];
  }

  const sortMap = {
    createdAt: { createdAt: -1 },
    name: { name: 1 },
    status: { status: 1, createdAt: -1 },
  };
  const sort = sortMap[sortBy] || { isFeatured: -1, createdAt: -1 };
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [projects, total] = await Promise.all([
    Project.find(query).sort(sort).skip(skip).limit(safeLimit).lean(),
    Project.countDocuments(query),
  ]);

  res.json({
    success: true,
    projects,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
  });
});

exports.getProject = catchAsync(async (req, res) => {
  const project = await findProjectWithUsers(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  res.json({ success: true, project });
});

exports.updateSensitiveFields = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const { sensitiveFields } = req.body;
  if (!Array.isArray(sensitiveFields)) {
    return errorResponse(res, 400, "sensitiveFields must be an array.", "INVALID_SENSITIVE_FIELDS");
  }

  const validFields = new Set(Object.keys(Project.schema.paths).filter((key) => !key.includes(".")));
  const normalized = [...new Set(sensitiveFields.map(trimString).filter(Boolean))];
  const invalidField = normalized.find((field) => !validFields.has(field));
  if (invalidField) return errorResponse(res, 400, `${invalidField} is not a project field.`, "INVALID_FIELD_KEY");

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  project.sensitiveFields = normalized;
  project.updatedBy = req.user.id;
  await project.save();

  const refreshedProject = await findProjectWithUsers(project._id);
  res.json({ success: true, project: refreshedProject });
});

exports.verifyPassword = catchAsync(async (req, res) => {
  const password = trimString(req.body.password);
  if (!password) return errorResponse(res, 400, "Password is required.", "PASSWORD_REQUIRED");

  const verified = await bcrypt.compare(password, req.user.password);
  if (!verified) return errorResponse(res, 401, "Incorrect password.", "INVALID_PASSWORD");

  await AuditLog.create({
    action: "sensitive_fields_revealed",
    performedBy: req.user.id,
    timestamp: Date.now(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({ success: true, verified: true });
});

exports.toggleShowcase = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  project.isVisibleInShowcase = !project.isVisibleInShowcase;
  project.updatedBy = req.user.id;
  await project.save();

  res.json({ success: true, isVisibleInShowcase: project.isVisibleInShowcase });
});

exports.toggleFeatured = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  project.isFeatured = !project.isFeatured;
  project.updatedBy = req.user.id;
  await project.save();

  res.json({ success: true, isFeatured: project.isFeatured });
});

exports.attachDocument = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const { driveFileId, fileName, fileSizeMB } = req.body;
  const docKey = trimString(driveFileId);
  if (!docKey) return errorResponse(res, 400, "driveFileId is required.", "DOCUMENT_ID_REQUIRED");

  const documentQuery = {
    ownerId: req.user.id,
    isDeleted: false,
    $or: [{ driveFileId: docKey }],
  };
  if (mongoose.Types.ObjectId.isValid(docKey)) documentQuery.$or.push({ _id: docKey });

  const [project, document] = await Promise.all([findProject(req.params.id), Document.findOne(documentQuery)]);
  if (!ensureProjectAccess(project, req, res)) return;
  if (!document) return errorResponse(res, 404, "Document not found in your Drive.", "DOCUMENT_NOT_FOUND");

  const storedId = String(document._id);
  const existing = project.documents.some((doc) => doc.driveFileId === storedId);
  if (!existing) {
    project.documents.push({
      driveFileId: storedId,
      fileName: trimString(fileName) || document.originalName || document.safeName || "Untitled file",
      fileSizeMB: Number(fileSizeMB ?? document.fileSizeMB ?? 0),
      uploadedAt: Date.now(),
    });
    project.updatedBy = req.user.id;
    await project.save();
  }

  res.json({ success: true, documents: project.documents });
});

exports.removeDocument = catchAsync(async (req, res) => {
  if (!(await verifyActionPassword(req, res))) return;

  const project = await findProject(req.params.id);
  if (!ensureProjectAccess(project, req, res)) return;

  project.documents = project.documents.filter((doc) => doc.driveFileId !== req.params.driveFileId);
  project.updatedBy = req.user.id;
  await project.save();

  res.json({ success: true, documents: project.documents });
});

exports.getProjectUsers = catchAsync(async (req, res) => {
  const users = await User.find({ isDisabled: { $ne: true } })
    .select("_id name email role")
    .sort({ name: 1, email: 1 })
    .lean();

  res.json({ success: true, users });
});

exports.getShowcaseProjects = catchAsync(async (req, res) => {
  const projects = await Project.find({ isVisibleInShowcase: true, isDeleted: false })
    .select(SHOWCASE_FIELDS.join(" "))
    .sort({ isFeatured: -1, endDate: -1 })
    .lean();

  const safeProjects = projects.map((project) =>
    SHOWCASE_FIELDS.reduce((acc, field) => {
      acc[field] = project[field];
      return acc;
    }, { _id: project._id })
  );

  res.json({ success: true, projects: safeProjects });
});
