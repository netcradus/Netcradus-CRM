const mongoose = require("mongoose");
const Client = require("../models/Client");
const AuditLog = require("../models/AuditLog");
const Project = require("../models/Project");

// Helper for error responses
const errorResponse = (res, status, message, code) =>
  res.status(status).json({ success: false, message, code });

// Scoping query by user role
const scopeClientQuery = (req, baseQuery = {}) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const userId = req.user?._id || req.user?.id;

  if (role === "sales") {
    if (baseQuery.$and) {
      baseQuery.$and.push({
        $or: [{ assignedSalesPerson: userId }, { createdBy: userId }],
      });
    } else {
      baseQuery.$and = [
        { $or: [{ assignedSalesPerson: userId }, { createdBy: userId }] },
      ];
    }
  } else if (role === "manager") {
    if (baseQuery.$and) {
      baseQuery.$and.push({
        $or: [{ assignedAccountManager: userId }, { createdBy: userId }],
      });
    } else {
      baseQuery.$and = [
        { $or: [{ assignedAccountManager: userId }, { createdBy: userId }] },
      ];
    }
  }
  return baseQuery;
};

// Check if current user has update access to the client
const hasClientWriteAccess = (req, client) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const userId = String(req.user?._id || req.user?.id);

  if (["super_user", "coo", "admin", "finance"].includes(role)) {
    return true;
  }

  if (role === "sales") {
    return (
      String(client.assignedSalesPerson || "") === userId ||
      String(client.createdBy || "") === userId
    );
  }

  if (role === "manager") {
    return (
      String(client.assignedAccountManager || "") === userId ||
      String(client.createdBy || "") === userId
    );
  }

  return false;
};

// 1. GET /api/clients - List clients with filters & pagination
exports.getClients = async (req, res) => {
  try {
    const {
      search,
      status,
      industry,
      assignedManager,
      clientType,
      priority,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let mongoQuery = {};

    // 1. Apply Search
    if (search) {
      const searchRegex = { $regex: String(search).trim(), $options: "i" };
      const searchOr = [
        { clientId: searchRegex },
        { clientName: searchRegex },
        { primaryEmail: searchRegex },
        { primaryPhone: searchRegex },
        { contactPersonName: searchRegex },
      ];
      mongoQuery.$or = searchOr;
    }

    // 2. Apply Filters
    const andClauses = [];

    if (status) {
      andClauses.push({ status });
    } else {
      // Exclude archived clients by default
      andClauses.push({ status: { $ne: "Archived" } });
    }

    if (industry) andClauses.push({ industry });
    if (clientType) andClauses.push({ clientType });
    if (priority) andClauses.push({ priority });

    if (assignedManager) {
      andClauses.push({
        $or: [
          { assignedAccountManager: assignedManager },
          { assignedSalesPerson: assignedManager },
        ],
      });
    }

    if (dateFrom || dateTo) {
      const dateRange = {};
      if (dateFrom) dateRange.$gte = new Date(dateFrom);
      if (dateTo) dateRange.$lte = new Date(dateTo);
      andClauses.push({ createdAt: dateRange });
    }

    if (andClauses.length > 0) {
      if (mongoQuery.$or) {
        mongoQuery.$and = [{ $or: mongoQuery.$or }, ...andClauses];
        delete mongoQuery.$or;
      } else {
        mongoQuery.$and = andClauses;
      }
    }

    // 3. Apply Scoping
    mongoQuery = scopeClientQuery(req, mongoQuery);

    // 4. Sorting & Pagination
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      Client.find(mongoQuery)
        .populate("assignedAccountManager", "_id name email role")
        .populate("assignedSalesPerson", "_id name email role")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Client.countDocuments(mongoQuery),
    ]);

    // For each client, let's fetch active projects count
    const clientIds = clients.map((c) => c._id);
    const projectsCount = await Project.aggregate([
      {
        $match: {
          clientId: { $in: clientIds },
          isDeleted: false,
          status: { $in: ["ongoing", "in_progress", "testing", "approved"] },
        },
      },
      { $group: { _id: "$clientId", count: { $sum: 1 } } },
    ]);

    const projectCountMap = projectsCount.reduce((acc, curr) => {
      acc[String(curr._id)] = curr.count;
      return acc;
    }, {});

    const enrichedClients = clients.map((c) => ({
      ...c,
      activeProjectsCount: projectCountMap[String(c._id)] || 0,
    }));

    res.json({
      success: true,
      data: enrichedClients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Clients Error:", error);
    res.status(500).json({ success: false, message: "Error fetching clients." });
  }
};

// 2. GET /api/clients/stats - Get aggregated analytics for dashboard cards
exports.getClientStats = async (req, res) => {
  try {
    let baseQuery = { status: { $ne: "Archived" } };
    baseQuery = scopeClientQuery(req, baseQuery);

    const [
      total,
      active,
      prospect,
      onHold,
      inactive,
      contractSummary,
      pendingPaymentsSummary,
    ] = await Promise.all([
      Client.countDocuments(baseQuery),
      Client.countDocuments({ ...baseQuery, status: "Active" }),
      Client.countDocuments({ ...baseQuery, status: "Prospect" }),
      Client.countDocuments({ ...baseQuery, status: "On Hold" }),
      Client.countDocuments({ ...baseQuery, status: "Inactive" }),
      Client.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$currency", totalVal: { $sum: "$contractValue" } } },
      ]),
      Client.aggregate([
        {
          $match: {
            ...baseQuery,
            paymentStatus: { $in: ["Pending", "Partial", "Overdue"] },
          },
        },
        { $group: { _id: "$currency", pendingVal: { $sum: "$contractValue" } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalClients: total,
        activeClients: active,
        prospects: prospect,
        onHold: onHold,
        inactiveClients: inactive,
        totalContractValue: contractSummary,
        pendingPayments: pendingPaymentsSummary,
      },
    });
  } catch (error) {
    console.error("Get Client Stats Error:", error);
    res.status(500).json({ success: false, message: "Error fetching stats." });
  }
};

// 3. GET /api/clients/:id - Get client details by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate("assignedAccountManager", "_id name email role")
      .populate("assignedSalesPerson", "_id name email role")
      .populate("notes.createdBy", "_id name email role")
      .populate("createdBy", "_id name email role")
      .populate("updatedBy", "_id name email role")
      .populate("archivedBy", "_id name email role")
      .populate("supportUsers.user", "_id name email role isDisabled")
      .populate("supportUsers.grantedBy", "_id name email role");

    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    // Role scoping verification
    const role = String(req.user?.role || "").trim().toLowerCase();
    const userId = String(req.user?._id || req.user?.id);
    if (["sales", "manager"].includes(role)) {
      const allowed =
        String(client.assignedAccountManager?._id || client.assignedAccountManager || "") === userId ||
        String(client.assignedSalesPerson?._id || client.assignedSalesPerson || "") === userId ||
        String(client.createdBy?._id || client.createdBy || "") === userId;

      if (!allowed) {
        return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
      }
    }

    // Load linked projects
    const projects = await Project.find({ clientId: client._id, isDeleted: false })
      .populate("assignedEngineer", "_id name email role")
      .lean();

    // Load Audit logs targeting this Client
    const auditLogs = await AuditLog.find({ entityId: client._id })
      .populate("performedBy", "name email role")
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Load support tickets
    const Ticket = require("../models/Ticket");
    const tickets = await Ticket.find({ clientId: client._id })
      .populate("raisedBy", "_id name email role")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      client,
      projects,
      auditLogs,
      tickets,
    });
  } catch (error) {
    console.error("Get Client By ID Error:", error);
    res.status(500).json({ success: false, message: "Error fetching client details." });
  }
};

// 4. POST /api/clients - Create a new client
exports.createClient = async (req, res) => {
  try {
    const { clientName, primaryEmail, gstNumber, panNumber, contractStartDate, contractEndDate, contractValue } = req.body;

    if (!clientName) {
      return errorResponse(res, 400, "Client name is required.", "NAME_REQUIRED");
    }
    if (!primaryEmail) {
      return errorResponse(res, 400, "Primary email is required.", "EMAIL_REQUIRED");
    }

    // Normalize checks
    const normalizedEmail = primaryEmail.trim().toLowerCase();
    const normalizedName = clientName.trim();

    // Check duplicate email
    const emailDup = await Client.findOne({ primaryEmail: normalizedEmail });
    if (emailDup) {
      return errorResponse(res, 400, "A client with this primary email already exists.", "DUPLICATE_EMAIL");
    }

    // Check duplicate name
    const nameDup = await Client.findOne({
      clientName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });
    if (nameDup) {
      return errorResponse(res, 400, "A client with this name already exists.", "DUPLICATE_NAME");
    }

    // Check duplicate GST
    if (gstNumber && gstNumber.trim()) {
      const normalizedGst = gstNumber.trim().toUpperCase();
      const gstDup = await Client.findOne({ gstNumber: normalizedGst });
      if (gstDup) {
        return errorResponse(res, 400, "A client with this GST number already exists.", "DUPLICATE_GST");
      }
    }

    // Date validation
    if (contractStartDate && contractEndDate && new Date(contractEndDate) < new Date(contractStartDate)) {
      return errorResponse(res, 400, "Contract end date must not be before start date.", "INVALID_CONTRACT_DATES");
    }

    // Value validation
    if (contractValue !== undefined && Number(contractValue) < 0) {
      return errorResponse(res, 400, "Contract value cannot be negative.", "INVALID_CONTRACT_VALUE");
    }

    const { notes, ...clientData } = req.body;

    const client = new Client({
      ...clientData,
      createdBy: req.user._id,
    });

    if (notes && String(notes).trim()) {
      client.notes = [
        {
          message: String(notes).trim(),
          createdBy: req.user._id,
        },
      ];
    }

    await client.save();

    // Log audit action
    await AuditLog.create({
      action: "CLIENT_CREATED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, clientName: client.clientName },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error("Create Client Error:", error);
    res.status(500).json({ success: false, message: "Error creating client." });
  }
};

// 5. PUT /api/clients/:id - Update an existing client
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    // Enforce write access rules
    if (!hasClientWriteAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const role = String(req.user?.role || "").trim().toLowerCase();
    let updates = { ...req.body };

    // Finance restricts to billing fields only
    if (role === "finance") {
      // Filter out non-billing payload fields
      const billingFields = [
        "contractStartDate",
        "contractEndDate",
        "contractValue",
        "billingType",
        "paymentTerms",
        "currency",
        "paymentStatus",
        "gstNumber",
        "panNumber",
        "registrationNumber",
      ];
      const sanitizedUpdates = {};
      billingFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          sanitizedUpdates[field] = req.body[field];
        }
      });
      updates = sanitizedUpdates;
    }

    const { clientName, primaryEmail, gstNumber, contractStartDate, contractEndDate, contractValue } = updates;

    // Email duplicate verification
    if (primaryEmail) {
      const normalizedEmail = primaryEmail.trim().toLowerCase();
      const emailDup = await Client.findOne({
        primaryEmail: normalizedEmail,
        _id: { $ne: client._id },
      });
      if (emailDup) {
        return errorResponse(res, 400, "A client with this primary email already exists.", "DUPLICATE_EMAIL");
      }
    }

    // Name duplicate verification
    if (clientName) {
      const normalizedName = clientName.trim();
      const nameDup = await Client.findOne({
        clientName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
        _id: { $ne: client._id },
      });
      if (nameDup) {
        return errorResponse(res, 400, "A client with this name already exists.", "DUPLICATE_NAME");
      }
    }

    // GST duplicate verification
    if (gstNumber && gstNumber.trim()) {
      const normalizedGst = gstNumber.trim().toUpperCase();
      const gstDup = await Client.findOne({
        gstNumber: normalizedGst,
        _id: { $ne: client._id },
      });
      if (gstDup) {
        return errorResponse(res, 400, "A client with this GST number already exists.", "DUPLICATE_GST");
      }
    }

    // Date range validation
    const effStartDate = contractStartDate !== undefined ? contractStartDate : client.contractStartDate;
    const effEndDate = contractEndDate !== undefined ? contractEndDate : client.contractEndDate;
    if (effStartDate && effEndDate && new Date(effEndDate) < new Date(effStartDate)) {
      return errorResponse(res, 400, "Contract end date must not be before start date.", "INVALID_CONTRACT_DATES");
    }

    // Value check
    if (contractValue !== undefined && Number(contractValue) < 0) {
      return errorResponse(res, 400, "Contract value cannot be negative.", "INVALID_CONTRACT_VALUE");
    }

    const beforeStatus = client.status;
    const beforeManager = String(client.assignedAccountManager || "");

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // Exclude notes and attachments from direct schema update
      if (key !== "notes" && key !== "attachments") {
        client[key] = updates[key];
      }
    });

    client.updatedBy = req.user._id;
    await client.save();

    // Log audits based on change types
    const auditLogs = [];
    auditLogs.push(
      AuditLog.create({
        action: "CLIENT_UPDATED",
        performedBy: req.user._id,
        entityType: "Client",
        entityId: client._id,
        details: { clientId: client.clientId },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })
    );

    if (client.status !== beforeStatus) {
      auditLogs.push(
        AuditLog.create({
          action: "CLIENT_STATUS_CHANGED",
          performedBy: req.user._id,
          entityType: "Client",
          entityId: client._id,
          details: { clientId: client.clientId, from: beforeStatus, to: client.status },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        })
      );
    }

    if (String(client.assignedAccountManager || "") !== beforeManager) {
      auditLogs.push(
        AuditLog.create({
          action: "CLIENT_MANAGER_ASSIGNED",
          performedBy: req.user._id,
          entityType: "Client",
          entityId: client._id,
          details: { clientId: client.clientId, managerId: client.assignedAccountManager },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        })
      );
    }

    await Promise.all(auditLogs);

    res.json({ success: true, client });
  } catch (error) {
    console.error("Update Client Error:", error);
    res.status(500).json({ success: false, message: "Error updating client." });
  }
};

// 6. PATCH /api/clients/:id/archive - Archive a client
exports.archiveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    client.status = "Archived";
    client.archivedAt = new Date();
    client.archivedBy = req.user._id;
    client.updatedBy = req.user._id;

    await client.save();

    await AuditLog.create({
      action: "CLIENT_ARCHIVED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, client });
  } catch (error) {
    console.error("Archive Client Error:", error);
    res.status(500).json({ success: false, message: "Error archiving client." });
  }
};

// 7. DELETE /api/clients/:id - Hard delete a client
exports.deleteClient = async (req, res) => {
  try {
    // Only Super User can delete
    if (req.user.role !== "super_user") {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    // Check if there are linked projects
    const linkedProjects = await Project.countDocuments({ clientId: client._id, isDeleted: false });
    if (linkedProjects > 0) {
      return errorResponse(
        res,
        400,
        "Cannot delete client with active project relations.",
        "LINKED_RECORDS_EXIST"
      );
    }

    await Client.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: "CLIENT_DELETED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, clientName: client.clientName },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Client deleted successfully." });
  } catch (error) {
    console.error("Delete Client Error:", error);
    res.status(500).json({ success: false, message: "Error deleting client." });
  }
};

// 8. POST /api/clients/:id/notes - Add notes to a client record
exports.addClientNote = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return errorResponse(res, 400, "Note text is required.", "NOTE_REQUIRED");
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    // Scoped permissions verification
    if (!hasClientWriteAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const newNote = {
      message: message.trim(),
      createdBy: req.user._id,
    };

    client.notes.push(newNote);
    await client.save();

    await AuditLog.create({
      action: "CLIENT_NOTE_ADDED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Populate createdBy of notes for response
    await client.populate("notes.createdBy", "_id name email role");

    res.status(201).json({ success: true, notes: client.notes });
  } catch (error) {
    console.error("Add Note Error:", error);
    res.status(500).json({ success: false, message: "Error adding note." });
  }
};

// Enable Support Access
exports.enableSupportAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, temporaryPassword } = req.body;

    const role = String(req.user?.role || "").trim().toLowerCase();
    if (!["super_user", "admin", "coo"].includes(role)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can enable support access.", "FORBIDDEN");
    }

    const client = await Client.findById(id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }
    if (client.status === "Archived") {
      return errorResponse(res, 400, "Cannot enable support access for an archived client.", "CLIENT_ARCHIVED");
    }

    if (!email || !String(email).trim()) {
      return errorResponse(res, 400, "Support email is required.", "EMAIL_REQUIRED");
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const User = require("../models/User");
    const emailDup = await User.findOne({ email: normalizedEmail });
    if (emailDup) {
      return errorResponse(res, 400, "A user account with this email already exists.", "DUPLICATE_EMAIL");
    }

    if (!temporaryPassword || temporaryPassword.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters long.", "WEAK_PASSWORD");
    }

    const count = await User.countDocuments({ role: "support", clientId: { $ne: null } });
    const number = String(count + 1).padStart(3, "0");
    const firstName = String(name || normalizedEmail.split("@")[0]).trim().split(".")[0];
    const uniqueId = `support_${firstName.toLowerCase()}_${number}`;

    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const supportUser = new User({
      userId: uniqueId,
      name: name || firstName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "support",
      clientId: client._id,
      skipOnboarding: true,
    });
    await supportUser.save();

    client.supportAccessEnabled = true;
    client.supportPortalStatus = "Active";
    client.supportUser = supportUser._id;
    client.supportAccessGrantedAt = new Date();
    client.supportAccessGrantedBy = req.user._id;

    client.supportUsers.push({
      user: supportUser._id,
      isPrimary: true,
      status: "Active",
      grantedAt: new Date(),
      grantedBy: req.user._id,
    });
    await client.save();

    await AuditLog.create({
      action: "SUPPORT_ACCESS_ENABLED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, supportUserId: supportUser._id, email: normalizedEmail },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Support access enabled successfully.",
      supportUser: {
        id: supportUser._id,
        name: supportUser.name,
        email: supportUser.email,
        status: "Active"
      }
    });
  } catch (error) {
    console.error("Enable Support Access Error:", error);
    res.status(500).json({ success: false, message: "Error enabling support access." });
  }
};

// Reset Support Password
exports.resetSupportPassword = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { temporaryPassword, confirmPassword } = req.body;

    const role = String(req.user?.role || "").trim().toLowerCase();
    if (!["super_user", "admin", "coo"].includes(role)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can reset passwords.", "FORBIDDEN");
    }

    if (!temporaryPassword || temporaryPassword.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters long.", "WEAK_PASSWORD");
    }
    if (temporaryPassword !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match.", "PASSWORD_MISMATCH");
    }

    const User = require("../models/User");
    const supportUser = await User.findOne({ _id: userId, clientId: id });
    if (!supportUser) {
      return errorResponse(res, 404, "Support user not found.", "NOT_FOUND");
    }

    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    supportUser.password = hashedPassword;
    supportUser.forcePasswordChange = true;
    await supportUser.save();

    const client = await Client.findById(id);
    await AuditLog.create({
      action: "SUPPORT_PASSWORD_RESET",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: id,
      details: { clientId: client?.clientId, supportUserId: supportUser._id },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset Support Password Error:", error);
    res.status(500).json({ success: false, message: "Error resetting support password." });
  }
};

// Suspend Support Access
exports.suspendSupportAccess = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const role = String(req.user?.role || "").trim().toLowerCase();
    if (!["super_user", "admin", "coo"].includes(role)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can suspend support access.", "FORBIDDEN");
    }

    const client = await Client.findById(id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    const User = require("../models/User");
    const supportUser = await User.findOne({ _id: userId, clientId: id });
    if (!supportUser) {
      return errorResponse(res, 404, "Support user not found.", "NOT_FOUND");
    }

    supportUser.isDisabled = true;
    supportUser.disabledAt = new Date();
    supportUser.disabledBy = req.user._id;
    supportUser.disabledReason = "Suspended from Support Portal by administrator";
    await supportUser.save();

    client.supportPortalStatus = "Suspended";
    const userRef = client.supportUsers.find(u => u.user.toString() === userId.toString());
    if (userRef) {
      userRef.status = "Suspended";
    }
    await client.save();

    await AuditLog.create({
      action: "SUPPORT_ACCESS_SUSPENDED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, supportUserId: supportUser._id },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Support access suspended successfully." });
  } catch (error) {
    console.error("Suspend Support Access Error:", error);
    res.status(500).json({ success: false, message: "Error suspending support access." });
  }
};

// Re-enable Support Access
exports.reEnableSupportAccess = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const role = String(req.user?.role || "").trim().toLowerCase();
    if (!["super_user", "admin", "coo"].includes(role)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can re-enable support access.", "FORBIDDEN");
    }

    const client = await Client.findById(id);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "NOT_FOUND");
    }

    const User = require("../models/User");
    const supportUser = await User.findOne({ _id: userId, clientId: id });
    if (!supportUser) {
      return errorResponse(res, 404, "Support user not found.", "NOT_FOUND");
    }

    supportUser.isDisabled = false;
    supportUser.disabledAt = null;
    supportUser.disabledBy = null;
    supportUser.disabledReason = "";
    await supportUser.save();

    client.supportPortalStatus = "Active";
    const userRef = client.supportUsers.find(u => u.user.toString() === userId.toString());
    if (userRef) {
      userRef.status = "Active";
    }
    await client.save();

    await AuditLog.create({
      action: "SUPPORT_ACCESS_REENABLED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, supportUserId: supportUser._id },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Support access re-enabled successfully." });
  } catch (error) {
    console.error("Re-enable Support Access Error:", error);
    res.status(500).json({ success: false, message: "Error re-enabling support access." });
  }
};

// Helper for scoping client access in projects list
const checkClientAccess = (req, client) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const userId = String(req.user?._id || req.user?.id);

  if (["super_user", "coo", "admin", "finance"].includes(role)) {
    return true;
  }

  if (role === "sales") {
    return (
      String(client.assignedSalesPerson?._id || client.assignedSalesPerson || "") === userId ||
      String(client.createdBy?._id || client.createdBy || "") === userId
    );
  }

  if (role === "manager") {
    return (
      String(client.assignedAccountManager?._id || client.assignedAccountManager || "") === userId ||
      String(client.createdBy?._id || client.createdBy || "") === userId
    );
  }

  return false;
};

// GET /api/clients/:clientId/projects - Linked Projects with fallback query
exports.getClientProjects = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { search, status, managerId, page = 1, limit = 20 } = req.query;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const query = {
      isDeleted: false,
      $or: [
        { clientId: client._id },
        { clientName: client.clientName },
        { clientCompany: client.clientName }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (managerId && mongoose.Types.ObjectId.isValid(managerId)) {
      query.assignedEngineer = managerId;
    }

    if (search) {
      const pattern = new RegExp(search.trim(), "i");
      query.name = pattern;
    }

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate("assignedEngineer", "_id name email role")
        .populate("createdBy", "_id name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Project.countDocuments(query),
    ]);

    res.json({
      success: true,
      projects,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit) || 1,
    });
  } catch (error) {
    console.error("Get Client Projects Error:", error);
    res.status(500).json({ success: false, message: "Error fetching client projects." });
  }
};
