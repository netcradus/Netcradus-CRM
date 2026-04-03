const Expense = require("../models/Expense");

// GET ALL
exports.getExpenses = async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json(expenses);
};

// CREATE
exports.createExpense = async (req, res) => {
  const expense = new Expense(req.body);
  const saved = await expense.save();
  res.json(saved);
};


exports.updateExpense = async (req, res) => {
  const updated = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};
// DELETE
exports.deleteExpense = async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};