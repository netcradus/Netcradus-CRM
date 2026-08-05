const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/policyController");

// Note: authentication middleware is mounted globally in server/index.js before this router
// All requests are guaranteed to have req.user attached.

router.get("/", ctrl.getPolicies);
router.get("/my/pending", ctrl.getPendingPolicies);
router.get("/:id", ctrl.getPolicy);

router.post("/", ctrl.createPolicy);
router.patch("/:id", ctrl.updatePolicy);
router.delete("/:id", ctrl.deletePolicy);

router.post("/:id/publish", ctrl.publishPolicy);
router.post("/:id/archive", ctrl.archivePolicy);
router.post("/:id/acknowledge", ctrl.acknowledgePolicy);
router.get("/:id/acknowledgements", ctrl.getAcknowledgements);

module.exports = router;
