const PurchaseOrder = require("../models/PurchaseOrder");

// Get all purchase orders
exports.getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate("products.productId");
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const po = new PurchaseOrder(req.body);
    const savedPO = await po.save();
    res.status(201).json(savedPO);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate("products.productId");
    if (!po) return res.status(404).json({ message: "Purchase Order not found" });
    res.json(po);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update purchase order
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPO) return res.status(404).json({ message: "Purchase Order not found" });
    res.json(updatedPO);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete purchase order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const deletedPO = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!deletedPO) return res.status(404).json({ message: "Purchase Order not found" });
    res.json({ message: "Purchase Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
