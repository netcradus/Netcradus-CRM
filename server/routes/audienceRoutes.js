const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const audienceController = require("../controllers/audienceController");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

const router = express.Router();

router.use(authMiddleware, rbac(DIGITAL_MEDIA_ROLES));

router.get("/segments", audienceController.getSegments);
router.post("/segments", audienceController.createSegment);
router.delete("/segments/:id", audienceController.deleteSegment);

module.exports = router;
