const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/deviceManagementController");
const rbac = require("../middleware/rbac");

// Restrict all CRUD actions to super_user
router.use(rbac(["super_user"]));

router.get("/", ctrl.getDevices);
router.post("/", ctrl.createDevice);
router.put("/:id", ctrl.updateDevice);
router.delete("/:id", ctrl.deleteDevice);

module.exports = router;
