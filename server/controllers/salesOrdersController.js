const SalesOrder = require("../models/SalesOrder");

// Get all sales orders
exports.getSalesOrders = async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find().sort({ createdAt: -1 });
    res.json(salesOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get a sales order by ID
exports.getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Create a new sales order
exports.createSalesOrder = async (req, res) => {
  try {
    const { orderId, customer, amount, status, orderedOn } = req.body;
    const newOrder = new SalesOrder({ orderId, customer, amount, status, orderedOn });
    const savedOrder = await newOrder.save();
    res.json(savedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update a sales order
exports.updateSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a sales order
exports.deleteSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    res.json({ message: "Sales order deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
