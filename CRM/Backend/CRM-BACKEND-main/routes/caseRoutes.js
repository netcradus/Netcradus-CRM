const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");

// Routes
router.get("/", caseController.getCases);        // Get all cases
router.get("/:id", caseController.getCase);      // Get single case
router.post("/", caseController.createCase);     // Create new case
router.put("/:id", caseController.updateCase);   // Update case
router.delete("/:id", caseController.deleteCase);// Delete case

module.exports = router;
