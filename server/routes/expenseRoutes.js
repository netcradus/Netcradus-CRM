const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController");
const rbac = require("../middleware/rbac");

router.get(
  "/dashboard-summary",
  rbac(["super_user", "admin", "hr", "coo"]),
  controller.getExpenseDashboardSummary
);

router.use(rbac(["super_user", "admin", "coo"]));

router.get("/", controller.getExpenses);
router.post("/", controller.createExpense);
router.put("/:id", controller.updateExpense);
router.delete("/:id", controller.deleteExpense);

module.exports = router;
