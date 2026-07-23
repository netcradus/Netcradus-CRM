const SalesOrder = require("../models/SalesOrder");

// Get all sales orders
exports.getSalesOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single
exports.getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create
exports.createSalesOrder = async (req, res) => {
  try {
    const { orderId, customer, amount, status, orderedOn } = req.body;

    if (!orderId || !customer || !amount) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const order = new SalesOrder({
      orderId,
      customer,
      amount,
      status,
      orderedOn,
    });

    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateSalesOrder = async (req, res) => {
  try {
    const updated = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteSalesOrder = async (req, res) => {
  try {
    const deleted = await SalesOrder.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};