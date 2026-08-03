const express = require("express");
const router = express.Router();
const riskController = require("../controllers/riskController");
const rbac = require("../middleware/rbac");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure authentication for all routes
router.use(authMiddleware);

// Strictly isolate partner roles from any compliance / risk data exposure
router.use((req, res, next) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  if (role === "partner") {
    return res.status(403).json({ success: false, message: "This section is not available for Partner accounts." });
  }
  next();
});

// Endpoint mappings
router.get("/", riskController.getRisks);
router.get("/:id", riskController.getRiskById);
router.post("/", rbac(["super_user", "coo", "admin", "hr", "manager"]), riskController.createRisk);
router.put("/:id", rbac(["super_user", "coo", "admin", "hr", "manager"]), riskController.updateRisk);
router.delete("/:id", rbac(["super_user", "coo", "admin", "hr"]), riskController.deleteRisk);

module.exports = router;
