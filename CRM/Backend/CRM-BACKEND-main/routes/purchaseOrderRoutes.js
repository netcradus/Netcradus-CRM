const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrderController");

// Routes
router.get("/", purchaseOrderController.getPurchaseOrders);           // Get all POs
router.post("/", purchaseOrderController.createPurchaseOrder);        // Create new PO
router.get("/:id", purchaseOrderController.getPurchaseOrderById);     // Get PO by ID
router.put("/:id", purchaseOrderController.updatePurchaseOrder);      // Update PO by ID
router.delete("/:id", purchaseOrderController.deletePurchaseOrder);   // Delete PO by ID

module.exports = router;
