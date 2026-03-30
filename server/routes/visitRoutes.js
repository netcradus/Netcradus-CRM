const express = require("express");
const router = express.Router();
const {
  getVisits,
  addVisit,
  updateVisit,
  deleteVisit,
  getVisitById,
} = require ("../controllers/visitController.js");



router.get("/", getVisits);
router.post("/", addVisit);
router.put("/:id", updateVisit);
router.delete("/:id", deleteVisit);
router.get("/:id", getVisitById);

module.exports = router;