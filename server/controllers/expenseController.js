const Expense = require("../models/Expense");

exports.getExpenseDashboardSummary = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });

    const categoryMap = {};
    const monthlyMap = {};
    let totalSpend = 0;
    let totalEntries = 0;

    expenses.forEach((expense) => {
      const quantity = Number(expense.quantity) || 1;
      const amount = Number(expense.amount) || 0;
      const lineTotal = amount * quantity;
      const category = expense.category || "Misc";
      const expenseDate = expense.date ? new Date(expense.date) : new Date();
      const monthKey = Number.isNaN(expenseDate.getTime())
        ? "Unknown"
        : expenseDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      totalSpend += lineTotal;
      totalEntries += 1;

      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          totalAmount: 0,
          totalQuantity: 0,
          entryCount: 0,
        };
      }

      categoryMap[category].totalAmount += lineTotal;
      categoryMap[category].totalQuantity += quantity;
      categoryMap[category].entryCount += 1;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          totalAmount: 0,
          totalQuantity: 0,
          entryCount: 0,
        };
      }

      monthlyMap[monthKey].totalAmount += lineTotal;
      monthlyMap[monthKey].totalQuantity += quantity;
      monthlyMap[monthKey].entryCount += 1;
    });

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const monthlyTrend = Object.values(monthlyMap).sort(
      (a, b) => new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`)
    );

    return res.json({
      totalSpend,
      totalEntries,
      categoryBreakdown,
      monthlyTrend,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load expense dashboard summary",
      error: error.message,
    });
  }
};

// GET ALL
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("createdBy", "name email role")
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to load expenses", error: error.message });
  }
};

// CREATE
exports.createExpense = async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      createdBy: req.user?._id,
    });

    const saved = await expense.save();
    const populatedExpense = await saved.populate("createdBy", "name email role");

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(400).json({ message: "Failed to create expense", error: error.message });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email role");

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update expense", error: error.message });
  }
};
// DELETE
exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete expense", error: error.message });
  }
};
