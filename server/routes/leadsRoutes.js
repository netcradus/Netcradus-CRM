const express = require("express");

const leadsController = require("../controllers/leadsController");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", leadsController.getLeads);
router.get("/export", leadsController.exportLeads);
router.post("/import", upload.single("file"), leadsController.importLeads);
router.get("/:id", leadsController.getLead);
router.post("/", leadsController.createLead);
router.patch("/:id/sales-update", leadsController.salesUpdateLead);
router.put("/:id", leadsController.updateLead);
router.delete("/bulk", leadsController.bulkDeleteLeads);
router.delete("/all", leadsController.deleteAllLeads);
router.delete("/:id", leadsController.deleteLead);

module.exports = router;
