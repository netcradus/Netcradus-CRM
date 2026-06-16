const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/superUserSalesController");

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get("/overview", controller.getOverview);

router.get("/performance", controller.getPerformance);

router.get("/leaderboard", controller.getLeaderboard);

/*
|--------------------------------------------------------------------------
| Deal Management
|--------------------------------------------------------------------------
*/

router.get(
  "/unassigned",
  controller.getUnassignedDeals
);

router.patch(
  "/deals/:id/reassign",
  controller.reassignDeal
);

router.patch(
  "/deals/:id/reopen",
  controller.reopenDeal
);

/*
|--------------------------------------------------------------------------
| Monitoring
|--------------------------------------------------------------------------
*/

router.get(
  "/activity",
  controller.getActivityFeed
);

router.get(
  "/followups",
  controller.getFollowUps
);

module.exports = router;