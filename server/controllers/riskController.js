const Risk = require("../models/Risk");
const User = require("../models/User");
const mongoose = require("mongoose");

const PRIVILEGED_ROLES = new Set(["super_user", "coo", "admin", "hr", "manager"]);
const FULL_ACCESS_ROLES = new Set(["super_user", "coo", "admin", "hr"]);

// Helper to check if a user is an employee who should only see their assigned risks
const isEmployeeOnly = (user) => {
  const role = String(user?.role || "").trim().toLowerCase();
  return !PRIVILEGED_ROLES.has(role);
};

// GET /api/risks (Get paginated list of risks with search and filters)
exports.getRisks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const query = {};

    // Search query construction: searches against Risk ID, Risk Title, Owner Name, and Department
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      
      // Find user ids matching owner name
      const matchingUsers = await User.find({ name: searchRegex }).select("_id").lean();
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { risk: searchRegex },
        { riskId: searchRegex },
        { department: searchRegex },
        { owner: { $in: userIds } }
      ];
    }

    // Status filtering supporting group tags
    if (req.query.status) {
      if (req.query.status === "Open/Active") {
        query.status = { $in: ["Identified", "Under Analysis", "On Hold"] };
      } else if (req.query.status === "Closed/Resolved") {
        query.status = { $in: ["Closed", "Mitigated"] };
      } else {
        query.status = req.query.status;
      }
    }

    // Priority filter mapping (high, critical, etc.)
    if (req.query.priority) {
      const priorityVal = String(req.query.priority).toLowerCase();
      if (priorityVal === "critical") {
        query.riskScore = { $gte: 15 };
      } else if (priorityVal === "high") {
        query.riskScore = { $gte: 10, $lt: 15 };
      } else if (priorityVal === "medium") {
        query.riskScore = { $gte: 5, $lt: 10 };
      } else if (priorityVal === "low") {
        query.riskScore = { $lt: 5 };
      }
    }

    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }

    const scopeQuery = {};
    if (isEmployeeOnly(req.user)) {
      scopeQuery.owner = req.user.id || req.user._id;
    }

    const [risks, totalRisks, totalCount, openCount, highCount, criticalCount, closedCount] = await Promise.all([
      Risk.find(query)
        .populate("owner", "name email department role")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Risk.countDocuments(query),
      Risk.countDocuments(scopeQuery),
      Risk.countDocuments({ ...scopeQuery, status: { $in: ["Identified", "Under Analysis", "On Hold"] } }),
      Risk.countDocuments({ ...scopeQuery, riskScore: { $gte: 10, $lt: 15 } }),
      Risk.countDocuments({ ...scopeQuery, riskScore: { $gte: 15 } }),
      Risk.countDocuments({ ...scopeQuery, status: "Closed" }),
    ]);

    // Re-attach virtuals for lean queries since lean doesn't evaluate them by default
    const formattedRisks = risks.map((risk) => {
      const score = (risk.likelihood || 0) * (risk.impact || 0);
      let priority = "Low";
      if (score >= 15) priority = "Critical";
      else if (score >= 10) priority = "High";
      else if (score >= 5) priority = "Medium";

      return {
        ...risk,
        riskScore: score,
        priority,
      };
    });

    const totalPages = Math.ceil(totalRisks / limit);

    return res.json({
      success: true,
      data: formattedRisks,
      pagination: {
        currentPage: page,
        totalPages,
        totalTasks: totalRisks, // Frontend uses totalTasks for pagination count reference
        limit,
      },
      stats: {
        total: totalCount,
        open: openCount,
        high: highCount,
        critical: criticalCount,
        closed: closedCount,
      },
    });
  } catch (err) {
    console.error("Get Risks Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch risks", error: err.message });
  }
};

// GET /api/risks/:id (Get single risk)
exports.getRiskById = async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id)
      .populate("owner", "name email department role")
      .populate("createdBy", "name email");

    if (!risk) {
      return res.status(404).json({ success: false, message: "Risk not found" });
    }

    // Role check: Employee can only view their own assigned risks
    if (isEmployeeOnly(req.user) && String(risk.owner._id || risk.owner) !== String(req.user.id || req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view this risk" });
    }

    return res.json({ success: true, data: risk });
  } catch (err) {
    console.error("Get Risk By ID Error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// POST /api/risks (Create risk)
exports.createRisk = async (req, res) => {
  try {
    const { risk, category, department, likelihood, impact, owner, treatment, status } = req.body;

    // Direct validation checks
    if (!risk || !category || !likelihood || !impact || !owner || !treatment) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    // Role check: Only privileged roles can create risks
    const userRole = String(req.user.role || "").trim().toLowerCase();
    if (!PRIVILEGED_ROLES.has(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions to create a risk" });
    }

    // Resolve the risk owner user to copy their department if none provided
    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
      return res.status(404).json({ success: false, message: "Assigned owner user not found" });
    }

    const resolvedDepartment = department || ownerUser.department || "General";

    const newRisk = new Risk({
      risk,
      category,
      department: resolvedDepartment,
      likelihood: Number(likelihood),
      impact: Number(impact),
      owner,
      treatment,
      status: status || "Identified",
      createdBy: req.user.id || req.user._id,
    });

    const savedRisk = await newRisk.save();
    return res.status(201).json({ success: true, data: savedRisk });
  } catch (err) {
    console.error("Create Risk Error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/risks/:id (Update risk)
exports.updateRisk = async (req, res) => {
  try {
    // Role check: Only privileged roles can update risks
    const userRole = String(req.user.role || "").trim().toLowerCase();
    if (!PRIVILEGED_ROLES.has(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions to edit risks" });
    }

    const riskItem = await Risk.findById(req.params.id);
    if (!riskItem) {
      return res.status(404).json({ success: false, message: "Risk not found" });
    }

    // Apply updates using save() to trigger pre-save hook auto-calculations
    const fields = ["risk", "category", "department", "likelihood", "impact", "owner", "treatment", "status"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        riskItem[field] = req.body[field];
      }
    });

    riskItem.updatedBy = req.user.id || req.user._id;

    const updatedRisk = await riskItem.save();
    return res.json({ success: true, data: updatedRisk });
  } catch (err) {
    console.error("Update Risk Error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/risks/:id (Delete risk)
exports.deleteRisk = async (req, res) => {
  try {
    // Role check: Only administrative roles can delete risks
    const userRole = String(req.user.role || "").trim().toLowerCase();
    if (!FULL_ACCESS_ROLES.has(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions to delete risks" });
    }

    const deletedRisk = await Risk.findByIdAndDelete(req.params.id);
    if (!deletedRisk) {
      return res.status(404).json({ success: false, message: "Risk not found" });
    }

    return res.json({ success: true, message: "Risk deleted successfully" });
  } catch (err) {
    console.error("Delete Risk Error:", err);
    return res.status(500).json({ success: false, message: "Server error during delete operations", error: err.message });
  }
};
