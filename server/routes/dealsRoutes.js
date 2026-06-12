// const express = require("express");

// const dealsController = require("../controllers/dealsController");

// const router = express.Router();

// router.get("/", dealsController.getDeals);
// router.get("/:id", dealsController.getDeal);
// router.post("/", dealsController.createDeal);
// router.put("/:id", dealsController.updateDeal);
// router.delete("/:id", dealsController.deleteDeal);

// module.exports = router;



const express = require("express");

const dealsController = require("../controllers/dealsController");

const router = express.Router();
router.post("/:id/comments", dealsController.addComment);

router.post("/:id/meetings", dealsController.addMeeting);

router.post("/:id/reminders", dealsController.addReminder);

router.patch("/:id/won", dealsController.markDealWon);
router.patch("/:id/lost", dealsController.markDealLost);
router.get("/", dealsController.getDeals);
router.get("/:id", dealsController.getDeal);
router.post("/", dealsController.createDeal);
router.put("/:id", dealsController.updateDeal);
router.delete("/:id", dealsController.deleteDeal);

module.exports = router;
