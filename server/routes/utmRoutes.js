const express = require("express");
const rbac = require("../middleware/rbac");
const audienceController = require("../controllers/audienceController");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

const router = express.Router();

router.use(rbac(DIGITAL_MEDIA_ROLES));

router.get("/", audienceController.getUtmLinks);
router.post("/", audienceController.createUtmLink);
router.delete("/:id", audienceController.deleteUtmLink);

module.exports = router;
