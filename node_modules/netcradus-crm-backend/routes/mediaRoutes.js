const express = require("express");
const rbac = require("../middleware/rbac");
const mediaController = require("../controllers/mediaController");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

const router = express.Router();

router.use(rbac(DIGITAL_MEDIA_ROLES));

router.get("/", mediaController.getMediaAssets);
router.post("/", mediaController.createMediaAsset);
router.delete("/:id", mediaController.deleteMediaAsset);
router.patch("/:id/link-campaign", mediaController.linkCampaignToMedia);

module.exports = router;
