const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const mediaController = require("../controllers/mediaController");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

const router = express.Router();

router.use(authMiddleware, rbac(DIGITAL_MEDIA_ROLES));

router.get("/", mediaController.getMediaAssets);
router.post("/", mediaController.createMediaAsset);
router.delete("/:id", mediaController.deleteMediaAsset);
router.patch("/:id/link-campaign", mediaController.linkCampaignToMedia);

module.exports = router;
