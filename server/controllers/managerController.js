const User = require("../models/User");
const OrgHierarchy = require("../models/OrgHierarchy");
const { getSubordinatesForUser } = require("../utils/hierarchyUtils");

/**
 * GET /api/manager/team
 * Returns all direct and indirect subordinates of the authenticated manager.
 * Guarded by rbac(["super_user", "manager"]).
 */
const getMyTeam = async (req, res) => {
  try {
    const managerId = req.user._id;

    // Get all subordinate user IDs via hierarchy traversal
    const subordinateIds = await getSubordinatesForUser(managerId);

    if (!subordinateIds.length) {
      return res.status(200).json({ success: true, team: [], total: 0 });
    }

    const team = await User.find({
      _id: { $in: subordinateIds },
      isDisabled: false,
    })
      .select("_id name email role designation department reportsTo createdAt")
      .populate("reportsTo", "name email role designation")
      .lean();

    return res.status(200).json({ success: true, team, total: team.length });
  } catch (err) {
    console.error("managerController.getMyTeam error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/manager/team/:userId
 * Returns read-only profile of a specific subordinate.
 * Only accessible if the requested user is an actual subordinate of the manager.
 * Guarded by rbac(["super_user", "manager"]).
 */
const getTeamMember = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { userId } = req.params;

    // Verify the requested user is actually a subordinate
    const subordinateIds = await getSubordinatesForUser(managerId);
    const isSubordinate = subordinateIds.some((id) => String(id) === String(userId));

    // Super users bypass the subordinate check
    if (!isSubordinate && req.user.role !== "super_user") {
      return res.status(403).json({
        success: false,
        message: "You can only view profiles of your direct or indirect team members.",
      });
    }

    const member = await User.findById(userId)
      .select("_id name email role designation department reportsTo createdAt isDisabled")
      .populate("reportsTo", "name email role designation")
      .lean();

    if (!member) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, member });
  } catch (err) {
    console.error("managerController.getTeamMember error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getMyTeam, getTeamMember };
