const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

router.get(
  "/dashboard-summary",
  authMiddleware,
  rbac(["super_user", "admin", "hr"]),
  controller.getExpenseDashboardSummary
);

router.use(authMiddleware, rbac(["super_user", "admin"]));

router.get("/", controller.getExpenses);
router.post("/", controller.createExpense);
router.put("/:id", controller.updateExpense);
router.delete("/:id", controller.deleteExpense);

module.exports = router;
