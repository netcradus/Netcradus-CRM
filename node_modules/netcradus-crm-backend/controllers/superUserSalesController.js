// server/controllers/superUserSalesController.js

const Deal = require("../models/Deal");
const User = require("../models/User");

const ensureSuperUser = (req, res) => {
  if (req.user?.role !== "super_user") {
    res.status(403).json({
      success: false,
      message: "Only super users can access this resource",
    });
    return false;
  }
  return true;
};

/**
 * GET /api/super-user/sales/overview
 */
exports.getOverview = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const [
      totalDeals,
      wonDeals,
      lostDeals,
      pendingDeals,
      revenueResult,
    ] = await Promise.all([
      Deal.countDocuments(),
      Deal.countDocuments({ status: "Won" }),
      Deal.countDocuments({ status: "Lost" }),
      Deal.countDocuments({
        status: { $nin: ["Won", "Lost"] },
      }),
      Deal.aggregate([
        { $match: { status: "Won" } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$value" },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalDeals,
        wonDeals,
        lostDeals,
        pendingDeals,
        revenue: revenueResult?.[0]?.revenue || 0,
      },
    });
  } catch (error) {
    console.error("Overview Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/super-user/sales/performance
 */
exports.getPerformance = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const salesUsers = await User.find({
      role: "sales",
    }).select("_id name email");

    const performance = await Promise.all(
      salesUsers.map(async (user) => {
        const [
          totalDeals,
          wonDeals,
          lostDeals,
          revenueResult,
        ] = await Promise.all([
          Deal.countDocuments({
            assignedTo: user._id,
          }),
          Deal.countDocuments({
            assignedTo: user._id,
            status: "Won",
          }),
          Deal.countDocuments({
            assignedTo: user._id,
            status: "Lost",
          }),
          Deal.aggregate([
            {
              $match: {
                assignedTo: user._id,
                status: "Won",
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$value" },
              },
            },
          ]),
        ]);

        const pendingDeals =
          totalDeals - wonDeals - lostDeals;

        const conversionRate =
          totalDeals > 0
            ? Number(
                (
                  (wonDeals / totalDeals) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalDeals,
          wonDeals,
          lostDeals,
          pendingDeals,
          conversionRate,
          revenue:
            revenueResult?.[0]?.revenue || 0,
        };
      })
    );

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Performance Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/super-user/sales/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const salesUsers = await User.find({
      role: "sales",
    }).select("_id name");

    const leaderboard = await Promise.all(
      salesUsers.map(async (user) => {
        const [wonDeals, revenueResult] =
          await Promise.all([
            Deal.countDocuments({
              assignedTo: user._id,
              status: "Won",
            }),
            Deal.aggregate([
              {
                $match: {
                  assignedTo: user._id,
                  status: "Won",
                },
              },
              {
                $group: {
                  _id: null,
                  revenue: {
                    $sum: "$value",
                  },
                },
              },
            ]),
          ]);

        return {
          userId: user._id,
          name: user.name,
          wonDeals,
          revenue:
            revenueResult?.[0]?.revenue || 0,
        };
      })
    );

    leaderboard.sort((a, b) => {
      if (b.wonDeals !== a.wonDeals) {
        return b.wonDeals - a.wonDeals;
      }
      return b.revenue - a.revenue;
    });

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.reassignDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const { assignedTo } = req.body;

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    const salesUser = await User.findById(assignedTo);

    if (!salesUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const previousOwner = deal.assignedTo;

    deal.assignedTo = assignedTo;

    deal.activities.push({
      type: "deal_reassigned",
      message: "Deal reassigned by Super User",
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({
      success: true,
      previousOwner,
      currentOwner: assignedTo,
      data: deal,
    });
  } catch (error) {
    console.error("Reassign Deal Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.reassignDeal


exports.getUnassignedDeals = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const deals = await Deal.find({
      assignedTo: null,
      status: { $nin: ["Won", "Lost"] },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    console.error("Unassigned Deals Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.reopenDeal = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (!["Won", "Lost"].includes(deal.status)) {
      return res.status(400).json({
        success: false,
        message: "Only closed deals can be reopened",
      });
    }

    deal.status = "Pending";
    deal.dealClosedAt = null;
    deal.dealWonBy = null;

    deal.activities.push({
      type: "deal_reopened",
      message: "Deal reopened by Super User",
      performedBy: req.user._id,
    });

    await deal.save();

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("Reopen Deal Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getActivityFeed = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const deals = await Deal.find()
      .populate("activities.performedBy", "name email")
      .select("name activities");

    const activities = [];

    deals.forEach((deal) => {
      deal.activities.forEach((activity) => {
        activities.push({
          dealId: deal._id,
          dealName: deal.name,
          ...activity.toObject(),
        });
      });
    });

    activities.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Activity Feed Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getFollowUps = async (req, res) => {
  if (!ensureSuperUser(req, res)) return;

  try {
    const deals = await Deal.find({
      "reminders.completed": false,
    }).populate("assignedTo", "name email");

    const followUps = [];

    deals.forEach((deal) => {
      deal.reminders.forEach((reminder) => {
        if (!reminder.completed) {
          followUps.push({
            dealId: deal._id,
            dealName: deal.name,
            assignedTo: deal.assignedTo,
            reminder,
          });
        }
      });
    });

    res.json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    console.error("Follow Up Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

