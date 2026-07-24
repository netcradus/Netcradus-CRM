const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/employeeAssetController");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure JWT authentication is active on all assets routes
router.use(authMiddleware);

router.get("/", ctrl.getAssets);
router.post("/", ctrl.assignAsset);
router.post("/bulk", ctrl.assignAssetsBulk);
router.put("/:id", ctrl.updateAsset);
router.patch("/:id/return", ctrl.returnAsset);
router.delete("/:id", ctrl.archiveAsset);

module.exports = router;
