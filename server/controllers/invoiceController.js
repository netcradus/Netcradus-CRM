const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");

const normalizeExpenseTitle = (value = "") => String(value || "").trim().toLowerCase();
const sendSuccess = (res, statusCode, data, message) =>
  res.status(statusCode).json({ success: true, message, data });

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    sendSuccess(res, 200, invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const { customer, amount, dueDate, status } = req.body;
    const invoice = new Invoice({ customer, amount, dueDate, status, sourceType: "manual" });
    const savedInvoice = await invoice.save();
    sendSuccess(res, 201, savedInvoice, "Invoice created successfully");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.generateInvoiceFromExpense = async (req, res) => {
  try {
    const { expenseKey, dueDate, status } = req.body;

    if (!expenseKey || !dueDate) {
      return res.status(400).json({ message: "expenseKey and dueDate are required" });
    }

    const normalizedExpenseKey = normalizeExpenseTitle(expenseKey);
    const expenses = await Expense.find().lean();
    const matchingExpenses = expenses.filter(
      (expense) => normalizeExpenseTitle(expense.title) === normalizedExpenseKey
    );

    if (!matchingExpenses.length) {
      return res.status(404).json({ message: "Matching expense group not found" });
    }

    const firstExpense = matchingExpenses[0];
    const quantity = matchingExpenses.reduce(
      (sum, expense) => sum + (Number(expense.quantity) || 1),
      0
    );
    const amount = matchingExpenses.reduce(
      (sum, expense) => sum + ((Number(expense.amount) || 0) * (Number(expense.quantity) || 1)),
      0
    );

    const invoice = new Invoice({
      customer: `Expense Invoice - ${firstExpense.title}`,
      amount,
      dueDate,
      status: status || "Unpaid",
      sourceType: "expense",
      sourceKey: normalizedExpenseKey,
      sourceTitle: firstExpense.title,
      quantity,
    });

    const savedInvoice = await invoice.save();
    sendSuccess(res, 201, savedInvoice, "Invoice generated successfully");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    sendSuccess(res, 200, invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedInvoice) return res.status(404).json({ message: "Invoice not found" });
    sendSuccess(res, 200, updatedInvoice, "Invoice updated successfully");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) return res.status(404).json({ message: "Invoice not found" });
    sendSuccess(res, 200, { _id: deletedInvoice._id }, "Invoice deleted successfully");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
