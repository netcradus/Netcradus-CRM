const mongoose = require("mongoose");
const OrgHierarchy = require("../models/OrgHierarchy");
const User = require("../models/User");
const Contact = require("../models/Contact");
const { getAssignableUserIds } = require("../utils/hierarchyUtils");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parsePriorityLevel = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

const parsePosition = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const wouldCreateCycle = async (nodeId, parentId) => {
  if (!parentId) return false;

  let currentParentId = String(parentId);
  while (currentParentId) {
    if (currentParentId === String(nodeId)) {
      return true;
    }

    const parentNode = await OrgHierarchy.findById(currentParentId).select("parentId").lean();
    if (!parentNode || !parentNode.parentId) {
      return false;
    }

    currentParentId = String(parentNode.parentId);
  }

  return false;
};

const getParentUserId = async (parentNodeId) => {
  if (!parentNodeId) return null;
  const parentNode = await OrgHierarchy.findById(parentNodeId).select("userId").lean();
  return parentNode?.userId || null;
};

const syncUserReportingLine = async (userId, parentNodeId) => {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, {
    $set: {
      reportsTo: await getParentUserId(parentNodeId),
    },
  });
};

const getHierarchy = async (req, res) => {
  try {
    const [hierarchy, contacts] = await Promise.all([
      OrgHierarchy.find()
      .populate("userId", "name email designation role department")
      .populate({
        path: "parentId",
        populate: {
          path: "userId",
          select: "name email designation role department",
        },
      })
        .sort({ priorityLevel: 1, createdAt: 1, _id: 1 })
        .lean(),
      Contact.find({ linkedUser: { $ne: null } }).select("linkedUser designation contactNumber department").lean(),
    ]);

    const contactByUserId = new Map(contacts.map((contact) => [String(contact.linkedUser), contact]));
    const enrichedHierarchy = hierarchy.map((entry) => {
      const user = entry.userId || {};
      const contact = contactByUserId.get(String(user._id)) || {};
      return {
        ...entry,
        userId: {
          ...user,
          designation: contact.designation || user.designation || "",
          department: contact.department || "General",
          phone: contact.contactNumber || "",
          profilePhoto: "",
        },
      };
    });

    return res.json(enrichedHierarchy);
  } catch (error) {
    console.error("Get Org Hierarchy Error:", error);
    return res.status(500).json({ message: "Failed to load organization hierarchy" });
  }
};

const getNestedUserHierarchy = async (req, res) => {
  try {
    const [hierarchy, contacts] = await Promise.all([
      OrgHierarchy.find()
        .populate("userId", "name email role department designation")
        .sort({ priorityLevel: 1, createdAt: 1, _id: 1 })
        .lean(),
      Contact.find({ linkedUser: { $ne: null } })
        .select("linkedUser designation contactNumber department")
        .lean(),
    ]);

    const contactByUserId = new Map(
      contacts.map((contact) => [String(contact.linkedUser), contact])
    );
    const nodeMap = new Map();

    hierarchy.forEach((entry) => {
      const user = entry.userId || {};
      const contact = contactByUserId.get(String(user._id)) || {};
      nodeMap.set(String(entry._id), {
        id: String(entry._id),
        userId: user._id,
        name: user.name || user.email || "Unknown User",
        email: user.email || "",
        phone: contact.contactNumber || "",
        role: user.role || "",
        designation: contact.designation || user.role || "",
        department: contact.department || user.department || "General",
        priorityLevel: entry.priorityLevel,
        profilePhoto: "",
        directReportsCount: 0,
        children: [],
      });
    });

    const roots = [];
    hierarchy.forEach((entry) => {
      const node = nodeMap.get(String(entry._id));
      const parentId = entry.parentId ? String(entry.parentId) : null;
      if (parentId && nodeMap.has(parentId)) {
        const parent = nodeMap.get(parentId);
        parent.children.push(node);
        parent.directReportsCount = parent.children.length;
      } else {
        roots.push(node);
      }
    });

    return res.json({ success: true, data: roots });
  } catch (error) {
    console.error("Get Nested Org Hierarchy Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load organization hierarchy" });
  }
};

const createHierarchyNode = async (req, res) => {
  try {
    const { userId, priorityLevel = 1, parentId = null, positionX = 0, positionY = 0 } = req.body || {};

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Valid userId is required" });
    }

    const existingNode = await OrgHierarchy.findOne({ userId });
    if (existingNode) {
      return res.status(400).json({ message: "This user already exists in the hierarchy" });
    }

    const user = await User.findById(userId).select("name email designation role department");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parsedPriorityLevel = parsePriorityLevel(priorityLevel);
    if (parsedPriorityLevel === null) {
      return res.status(400).json({ message: "priorityLevel must be an integer greater than or equal to 0" });
    }

    const resolvedPriorityLevel = user.role === "super_user" ? 0 : parsedPriorityLevel;
    let normalizedParentId = null;
    if (parentId && resolvedPriorityLevel !== 0) {
      if (!isValidObjectId(parentId)) {
        return res.status(400).json({ message: "Valid parentId is required" });
      }
      const parentNode = await OrgHierarchy.findById(parentId).select("_id");
      if (!parentNode) {
        return res.status(404).json({ message: "Parent hierarchy node not found" });
      }
      normalizedParentId = parentNode._id;
    }

    const node = await OrgHierarchy.create({
      userId,
      priorityLevel: resolvedPriorityLevel,
      parentId: resolvedPriorityLevel === 0 ? null : normalizedParentId,
      positionX: parsePosition(positionX),
      positionY: parsePosition(positionY),
    });

    await syncUserReportingLine(userId, node.parentId);

    const populatedNode = await OrgHierarchy.findById(node._id).populate("userId", "name email designation role department");
    return res.status(201).json(populatedNode);
  } catch (error) {
    console.error("Create Org Hierarchy Node Error:", error);
    return res.status(500).json({ message: "Failed to add user to hierarchy" });
  }
};

const updateHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { priorityLevel, parentId, positionX, positionY } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid hierarchy node id" });
    }

    const node = await OrgHierarchy.findById(id);
    if (!node) {
      return res.status(404).json({ message: "Hierarchy node not found" });
    }

    if (priorityLevel !== undefined) {
      const parsedPriorityLevel = parsePriorityLevel(priorityLevel);
      if (parsedPriorityLevel === null) {
        return res.status(400).json({ message: "priorityLevel must be an integer greater than or equal to 1" });
      }
      node.priorityLevel = parsedPriorityLevel;
    }

    if (positionX !== undefined) {
      node.positionX = parsePosition(positionX, node.positionX);
    }

    if (positionY !== undefined) {
      node.positionY = parsePosition(positionY, node.positionY);
    }

    if (parentId !== undefined) {
      if (String(node.priorityLevel) === "0" && parentId) {
        return res.status(400).json({ message: "Top-level Super Admin node cannot be assigned to a parent" });
      }

      if (parentId === null || parentId === "") {
        node.parentId = null;
      } else {
        if (!isValidObjectId(parentId)) {
          return res.status(400).json({ message: "Valid parentId is required" });
        }

        if (String(parentId) === String(node._id)) {
          return res.status(400).json({ message: "A node cannot be assigned to itself" });
        }

        const parentNode = await OrgHierarchy.findById(parentId).select("_id");
        if (!parentNode) {
          return res.status(404).json({ message: "Parent hierarchy node not found" });
        }

        if (await wouldCreateCycle(node._id, parentNode._id)) {
          return res.status(400).json({ message: "This reassignment would create a cycle in the hierarchy" });
        }

        node.parentId = parentNode._id;
      }
    }

    if (node.priorityLevel === 0) {
      node.parentId = null;
    }

    await node.save();
    await syncUserReportingLine(node.userId, node.parentId);

    const populatedNode = await OrgHierarchy.findById(node._id).populate("userId", "name email designation role department");
    return res.json(populatedNode);
  } catch (error) {
    console.error("Update Org Hierarchy Node Error:", error);
    return res.status(500).json({ message: "Failed to update hierarchy node" });
  }
};

const deleteHierarchyNode = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid hierarchy node id" });
    }

    const node = await OrgHierarchy.findById(id).populate("userId", "name");
    if (!node) {
      return res.status(404).json({ message: "Hierarchy node not found" });
    }

    await OrgHierarchy.updateMany({ parentId: node._id }, { $set: { parentId: null } });
    const removedUserId = node.userId?._id || node.userId;
    await User.updateMany({ reportsTo: removedUserId }, { $set: { reportsTo: null } });
    await syncUserReportingLine(removedUserId, null);
    await OrgHierarchy.deleteOne({ _id: node._id });

    return res.json({
      message: "Hierarchy node removed successfully",
    });
  } catch (error) {
    console.error("Delete Org Hierarchy Node Error:", error);
    return res.status(500).json({ message: "Failed to remove hierarchy node" });
  }
};

const bulkUpdateHierarchy = async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.nodes) ? req.body.nodes : null;
    if (!updates) {
      return res.status(400).json({ message: "Request body must include a nodes array" });
    }

    for (const update of updates) {
      if (!isValidObjectId(update.id)) {
        return res.status(400).json({ message: "Each hierarchy node update must include a valid id" });
      }

      const parsedPriorityLevel = parsePriorityLevel(update.priorityLevel);
      if (parsedPriorityLevel === null) {
        return res.status(400).json({ message: "Each priorityLevel must be an integer greater than or equal to 0" });
      }

      if (update.parentId && !isValidObjectId(update.parentId)) {
        return res.status(400).json({ message: "Each parentId must be null or a valid hierarchy node id" });
      }

      if (String(update.id) === String(update.parentId)) {
        return res.status(400).json({ message: "A hierarchy node cannot be assigned to itself" });
      }

      if (parsedPriorityLevel === 0 && update.parentId) {
        return res.status(400).json({ message: "Top-level Super Admin node cannot be assigned to a parent" });
      }
    }

    await Promise.all(updates.map(async (update) => {
      const updatedNode = await OrgHierarchy.findByIdAndUpdate(update.id, {
        $set: {
          positionX: parsePosition(update.positionX),
          positionY: parsePosition(update.positionY),
          parentId: update.parentId || null,
          priorityLevel: parsePriorityLevel(update.priorityLevel),
        },
      }, { new: true });
      await syncUserReportingLine(updatedNode?.userId, updatedNode?.parentId);
    }));

    return res.json({ message: "Hierarchy layout saved successfully" });
  } catch (error) {
    console.error("Bulk Update Org Hierarchy Error:", error);
    return res.status(500).json({ message: "Failed to save hierarchy layout" });
  }
};

const getAssignableUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    const assignableIds = await getAssignableUserIds(currentUserId);

    let users = [];

    if (assignableIds === 'ALL') {
      // Super Admin — return all users except themselves
      users = await User.find({
        _id: { $ne: currentUserId },
        isDisabled: false
      }).select('_id name email designation role profilePhoto');

    } else if (assignableIds === null) {
      // Not in hierarchy — role-based fallback
      const allowedRoles = ['superadmin', 'super_admin', 'admin',
                            'administrator', 'hr'];
      if (allowedRoles.includes(currentUserRole?.toLowerCase())) {
        users = await User.find({
          _id: { $ne: currentUserId },
          isDisabled: false
        }).select('_id name email designation role profilePhoto');
      } else {
        // Cannot assign — return empty array
        users = [];
      }

    } else {
      // Return only users whose _id is in assignableIds
      users = await User.find({
        _id: { $in: assignableIds },
        isDisabled: false
      }).select('_id name email designation role profilePhoto');
    }

    return res.status(200).json({
      success: true,
      canAssign: users.length > 0 || assignableIds === 'ALL',
      isInHierarchy: assignableIds !== null,
      users
    });

  } catch (err) {
    console.error('assignable-users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching assignable users'
    });
  }
};

module.exports = {
  getHierarchy,
  getNestedUserHierarchy,
  createHierarchyNode,
  updateHierarchyNode,
  deleteHierarchyNode,
  bulkUpdateHierarchy,
  getAssignableUsers,
};
