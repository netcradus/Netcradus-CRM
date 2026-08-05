const Policy = require("../models/Policy");
const PolicyAcknowledgement = require("../models/PolicyAcknowledgement");
const User = require("../models/User");
const { createNotifications } = require("../services/taskNotificationService");

const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// Helper: Get applicable users query for a policy
const getApplicableUsersQuery = (policy) => {
  const baseQuery = { isDisabled: false, role: { $ne: "partner" } };
  if (policy.applicableToAll) {
    return baseQuery;
  }
  const orClauses = [];
  if (policy.applicableDepartments && policy.applicableDepartments.length > 0) {
    orClauses.push({ department: { $in: policy.applicableDepartments } });
  }
  if (policy.applicableRoles && policy.applicableRoles.length > 0) {
    orClauses.push({ role: { $in: policy.applicableRoles } });
  }
  if (orClauses.length > 0) {
    baseQuery.$or = orClauses;
  } else {
    // If no specific filters, it is applicable to no one
    return null;
  }
  return baseQuery;
};

// Helper: Check if a user is applicable to a policy
const isUserApplicable = (user, policy) => {
  if (user.role === "super_user") return true;
  if (user.role === "partner") return false;
  if (policy.applicableToAll) return true;

  const matchesDept = policy.applicableDepartments?.includes(user.department);
  const matchesRole = policy.applicableRoles?.includes(user.role);
  return !!(matchesDept || matchesRole);
};

// Helper: HR authorization category list
const HR_CATEGORIES = ["hr", "leave", "attendance", "work_from_home", "code_of_conduct"];

// ─── GET /api/policies (List) ───────────────────────────────────────────────
exports.getPolicies = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, category, search } = req.query;
  const userRole = req.user.role;
  const userDept = req.user.department;

  const query = {};

  // 1. Role-aware visibility boundaries
  if (userRole === "super_user" || userRole === "admin") {
    // Full visual capability
    if (status) query.status = status;
    if (category) query.category = category;
  } else if (userRole === "hr") {
    // HR manages HR categories, but can view others
    if (status) query.status = status;
    if (category) {
      query.category = category;
    }
  } else {
    // Employees and Managers see only published policies applicable to them
    query.status = "published";
    if (category) query.category = category;

    const applicableFilters = [
      { applicableToAll: true }
    ];
    if (userDept) {
      applicableFilters.push({ applicableDepartments: userDept });
    }
    applicableFilters.push({ applicableRoles: userRole });
    query.$or = applicableFilters;
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { policyCode: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Policy.countDocuments(query);
  const policies = await Policy.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: policies,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ─── GET /api/policies/my/pending ──────────────────────────────────────────
exports.getPendingPolicies = catchAsync(async (req, res) => {
  const userRole = req.user.role;
  const userDept = req.user.department;

  if (userRole === "partner") {
    return res.json({ success: true, data: [] });
  }

  // 1. Fetch all published policies applicable to this user
  const applicableQuery = {
    status: "published",
    $or: [
      { applicableToAll: true }
    ]
  };
  if (userDept) {
    applicableQuery.$or.push({ applicableDepartments: userDept });
  }
  applicableQuery.$or.push({ applicableRoles: userRole });

  const policies = await Policy.find(applicableQuery).lean();

  // 2. Fetch all acknowledgements by this employee
  const acknowledgements = await PolicyAcknowledgement.find({
    employee: req.user.id
  }).lean();

  // 3. Filter policies where current version is not acknowledged yet
  const pending = policies.filter(policy => {
    const isSigned = acknowledgements.some(ack => 
      String(ack.policy) === String(policy._id) && ack.policyVersion === policy.version
    );
    return !isSigned;
  });

  res.json({
    success: true,
    data: pending
  });
});

// ─── GET /api/policies/:id (Details) ─────────────────────────────────────────
exports.getPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const policy = await Policy.findById(id)
    .populate("createdBy", "name email designation")
    .populate("updatedBy", "name email")
    .populate("previousVersion", "title version")
    .lean();

  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  // 1. Verify visibility permissions (IDOR Check)
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    if (policy.status !== "published") {
      return res.status(403).json({ success: false, message: "You are not authorized to view this draft policy." });
    }
    if (!isUserApplicable(req.user, policy)) {
      return res.status(403).json({ success: false, message: "This policy is not applicable to your role/department." });
    }
  }

  // 2. Check if user already acknowledged this version
  let userAcknowledgement = null;
  if (userRole !== "super_user") {
    userAcknowledgement = await PolicyAcknowledgement.findOne({
      policy: id,
      employee: req.user.id,
      policyVersion: policy.version
    }).lean();
  }

  // 3. Fetch version history list
  const history = await Policy.find({
    policyCode: policy.policyCode
  })
    .select("title version status effectiveDate createdAt isLatestVersion")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      ...policy,
      userAcknowledgement,
      versionHistory: history
    }
  });
});

// ─── POST /api/policies (Create Draft) ────────────────────────────────────────
exports.createPolicy = catchAsync(async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to create policies." });
  }

  const { category, policyCode } = req.body;

  // HR Category validation
  if (userRole === "hr" && !HR_CATEGORIES.includes(category)) {
    return res.status(403).json({ success: false, message: "HR can only create HR, Leave, Attendance, Work-From-Home, and Code of Conduct policies." });
  }

  // Check unique policy code + version
  const version = req.body.version || "1.0";
  const duplicate = await Policy.findOne({ policyCode, version });
  if (duplicate) {
    return res.status(409).json({ success: false, message: `A policy with code ${policyCode} and version ${version} already exists.` });
  }

  const policy = await Policy.create({
    ...req.body,
    status: "draft", // always default to draft
    createdBy: req.user.id,
    updatedBy: req.user.id,
    isLatestVersion: true
  });

  res.status(201).json({
    success: true,
    message: "Policy draft created successfully.",
    data: policy
  });
});

// ─── PATCH /api/policies/:id (Update / Version fork) ─────────────────────────
exports.updatePolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to edit policies." });
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  // HR Category validation
  if (userRole === "hr" && !HR_CATEGORIES.includes(policy.category)) {
    return res.status(403).json({ success: false, message: "HR can only manage HR-related policies." });
  }

  // Case A: Policy is in DRAFT. Update directly.
  if (policy.status === "draft") {
    // If the version is changed, verify uniqueness
    const newVersion = req.body.version || policy.version;
    const newCode = req.body.policyCode || policy.policyCode;
    if (newVersion !== policy.version || newCode !== policy.policyCode) {
      const duplicate = await Policy.findOne({
        _id: { $ne: id },
        policyCode: newCode,
        version: newVersion
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: `A policy with code ${newCode} and version ${newVersion} already exists.` });
      }
    }

    const updated = await Policy.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Policy draft updated successfully.",
      data: updated
    });
  }

  // Case B: Policy is already PUBLISHED. Create a new linked version fork instead of overwriting history.
  const newVersion = req.body.version || "2.0";
  if (newVersion === policy.version) {
    return res.status(400).json({ success: false, message: "Please specify a new version number (e.g. 2.0 or 1.1) to save changes to a published policy." });
  }

  // Check unique code + version for new document
  const duplicate = await Policy.findOne({
    policyCode: policy.policyCode,
    version: newVersion
  });
  if (duplicate) {
    return res.status(409).json({ success: false, message: `Version ${newVersion} of policy code ${policy.policyCode} already exists.` });
  }

  // Create new draft policy document linked to this one
  const newPolicyData = {
    ...policy.toObject(),
    ...req.body,
    _id: undefined,
    status: "draft",
    version: newVersion,
    parentPolicy: policy.parentPolicy || policy._id,
    previousVersion: policy._id,
    isLatestVersion: true,
    createdBy: req.user.id,
    updatedBy: req.user.id,
    publishedAt: undefined,
    archivedAt: undefined,
    createdAt: undefined,
    updatedAt: undefined
  };

  const newPolicy = await Policy.create(newPolicyData);

  // Mark the previous policy as no longer the latest version
  await Policy.findByIdAndUpdate(policy._id, { isLatestVersion: false });

  res.status(201).json({
    success: true,
    message: `Created new draft version ${newVersion} successfully. Previous version preserved.`,
    data: newPolicy
  });
});

// ─── POST /api/policies/:id/publish ──────────────────────────────────────────
exports.publishPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to publish policies." });
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  if (policy.status === "archived") {
    return res.status(400).json({ success: false, message: "Cannot publish an archived policy." });
  }

  // HR Category validation
  if (userRole === "hr" && !HR_CATEGORIES.includes(policy.category)) {
    return res.status(403).json({ success: false, message: "HR can only publish HR-related policies." });
  }

  // Update status to published
  const published = await Policy.findByIdAndUpdate(
    id,
    {
      status: "published",
      publishedAt: new Date(),
      updatedBy: req.user.id
    },
    { new: true }
  );

  // Trigger Notifications to all applicable users (only active employees, excluding partners)
  const applicableQuery = getApplicableUsersQuery(published);
  if (applicableQuery) {
    const applicableUsers = await User.find(applicableQuery).select("_id").lean();
    const userIds = applicableUsers.map(u => String(u._id));
    if (userIds.length > 0) {
      const isUpdatedVersion = !!published.previousVersion;
      const messageText = isUpdatedVersion
        ? `Policy '${published.title}' has been updated to version ${published.version}. Please review it again.`
        : `A new policy '${published.title}' has been published. Please review and acknowledge it.`;

      await createNotifications({
        taskId: null,
        userIds,
        message: messageText,
        targetPath: `/policies/${published._id}`,
        type: "general"
      });
    }
  }

  res.json({
    success: true,
    message: "Policy published successfully. Applicable employees have been notified.",
    data: published
  });
});

// ─── POST /api/policies/:id/archive ──────────────────────────────────────────
exports.archivePolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to archive policies." });
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  // HR Category validation
  if (userRole === "hr" && !HR_CATEGORIES.includes(policy.category)) {
    return res.status(403).json({ success: false, message: "HR can only archive HR-related policies." });
  }

  const archived = await Policy.findByIdAndUpdate(
    id,
    {
      status: "archived",
      archivedAt: new Date(),
      updatedBy: req.user.id
    },
    { new: true }
  );

  res.json({
    success: true,
    message: "Policy archived successfully.",
    data: archived
  });
});

// ─── POST /api/policies/:id/acknowledge (Employee signature) ──────────────────
exports.acknowledgePolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  if (policy.status !== "published") {
    return res.status(400).json({ success: false, message: "Signatures can only be collected for published policies." });
  }

  // Verify applicability (Employees cannot acknowledge policies they are not assigned to)
  if (!isUserApplicable(req.user, policy)) {
    return res.status(403).json({ success: false, message: "This policy does not apply to your department or role." });
  }

  // Enforce unique check per version
  const alreadyAcknowledged = await PolicyAcknowledgement.findOne({
    policy: id,
    employee: req.user.id,
    policyVersion: policy.version
  });

  if (alreadyAcknowledged) {
    return res.status(400).json({ success: false, message: "You have already acknowledged this version of the policy." });
  }

  const acknowledgement = await PolicyAcknowledgement.create({
    policy: id,
    employee: req.user.id,
    policyVersion: policy.version,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "acknowledged"
  });

  res.status(201).json({
    success: true,
    message: "Policy acknowledgement submitted successfully.",
    data: acknowledgement
  });
});

// ─── GET /api/policies/:id/acknowledgements (Compliance report) ───────────────
exports.getAcknowledgements = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  // HR / Admin / Super User only
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to access reports." });
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  // HR category check
  if (userRole === "hr" && !HR_CATEGORIES.includes(policy.category)) {
    return res.status(403).json({ success: false, message: "HR can only view reports for HR-related policies." });
  }

  // 1. Fetch applicable employees
  const applicableQuery = getApplicableUsersQuery(policy);
  if (!applicableQuery) {
    return res.json({
      success: true,
      summary: { total: 0, acknowledged: 0, pending: 0, rate: 0 },
      data: []
    });
  }

  const applicableEmployees = await User.find(applicableQuery)
    .select("name email department designation userId isDisabled")
    .sort({ name: 1 })
    .lean();

  // 2. Fetch signatures for this version
  const acknowledgements = await PolicyAcknowledgement.find({
    policy: id,
    policyVersion: policy.version
  }).lean();

  // 3. Match signatures with applicable employees
  const detailedList = applicableEmployees.map(emp => {
    const signature = acknowledgements.find(ack => String(ack.employee) === String(emp._id));
    return {
      employeeId: emp._id,
      name: emp.name,
      email: emp.email,
      department: emp.department || "General",
      designation: emp.designation || "N/A",
      userId: emp.userId || "N/A",
      status: signature ? "acknowledged" : "pending",
      acknowledgedAt: signature ? signature.acknowledgedAt : null,
      ipAddress: signature ? signature.ipAddress : null,
      userAgent: signature ? signature.userAgent : null
    };
  });

  const total = detailedList.length;
  const acknowledged = detailedList.filter(item => item.status === "acknowledged").length;
  const pending = total - acknowledged;
  const completionRate = total > 0 ? Math.round((acknowledged * 100) / total) : 0;

  // Department-wise counts
  const departmentBreakdown = {};
  detailedList.forEach(item => {
    const dept = item.department;
    if (!departmentBreakdown[dept]) {
      departmentBreakdown[dept] = { total: 0, acknowledged: 0, pending: 0 };
    }
    departmentBreakdown[dept].total++;
    if (item.status === "acknowledged") {
      departmentBreakdown[dept].acknowledged++;
    } else {
      departmentBreakdown[dept].pending++;
    }
  });

  res.json({
    success: true,
    summary: {
      total,
      acknowledged,
      pending,
      completionRate
    },
    departmentBreakdown,
    data: detailedList
  });
});

// ─── DELETE /api/policies/:id ────────────────────────────────────────────────
exports.deletePolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  if (userRole !== "super_user" && userRole !== "admin" && userRole !== "hr") {
    return res.status(403).json({ success: false, message: "Unauthorized to delete policies." });
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found." });
  }

  // HR Category validation
  if (userRole === "hr" && !HR_CATEGORIES.includes(policy.category)) {
    return res.status(403).json({ success: false, message: "HR can only manage HR-related policies." });
  }

  // Only drafts can be permanently deleted. Published/archived must be preserved.
  if (policy.status !== "draft") {
    return res.status(400).json({ success: false, message: "Only draft policies can be deleted. Published or archived policies must be archived instead." });
  }

  await Policy.findByIdAndDelete(id);

  // If this was a new version draft, restore the older version as latest
  if (policy.previousVersion) {
    await Policy.findByIdAndUpdate(policy.previousVersion, { isLatestVersion: true });
  }

  res.json({
    success: true,
    message: "Policy draft deleted successfully."
  });
});
