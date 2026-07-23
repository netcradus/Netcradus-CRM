// const express = require("express");

// const leadsController = require("../controllers/leadsController");
// const upload = require("../middleware/upload");

// const router = express.Router();

// router.get("/", leadsController.getLeads);
// router.get("/export", leadsController.exportLeads);
// router.post("/import", upload.single("file"), leadsController.importLeads);
// router.get("/:id", leadsController.getLead);
// router.post("/", leadsController.createLead);
// router.patch("/:id/sales-update", leadsController.salesUpdateLead);
// router.put("/:id", leadsController.updateLead);
// router.delete("/bulk", leadsController.bulkDeleteLeads);
// router.delete("/all", leadsController.deleteAllLeads);
// router.delete("/:id", leadsController.deleteLead);

// module.exports = router;


const express = require("express");

const leadsController = require("../controllers/leadsController");
const upload = require("../middleware/upload");

const router = express.Router();

// ── Stats (must be before /:id) ──────────────────────────────
router.get("/stats/overview", leadsController.getLeadStats);

// ── Collection routes ────────────────────────────────────────
router.get("/", leadsController.getLeads);
router.get("/export", leadsController.exportLeads);
router.post("/import", upload.single("file"), leadsController.importLeads);
router.post("/", leadsController.createLead);
router.delete("/bulk", leadsController.bulkDeleteLeads);
router.delete("/all", leadsController.deleteAllLeads);

// ── Single lead routes (/:id must come last) ─────────────────
router.post("/:id/convert-to-deal", leadsController.convertLeadToDeal);
router.patch("/:id/sales-update", leadsController.salesUpdateLead);
router.get("/:id", leadsController.getLead);
router.put("/:id", leadsController.updateLead);
router.delete("/:id", leadsController.deleteLead);

module.exports = router;