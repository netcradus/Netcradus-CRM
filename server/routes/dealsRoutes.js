const express = require("express");

const dealsController = require("../controllers/dealsController");

const router = express.Router();

router.get("/", dealsController.getDeals);
router.get("/:id", dealsController.getDeal);
router.post("/", dealsController.createDeal);
router.put("/:id", dealsController.updateDeal);
router.delete("/:id", dealsController.deleteDeal);

module.exports = router;
