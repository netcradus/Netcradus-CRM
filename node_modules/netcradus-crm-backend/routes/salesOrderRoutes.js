const express = require("express");
const router = express.Router();
const salesOrdersController = require("../controllers/salesOrdersController");

// Routes
router.get("/", salesOrdersController.getSalesOrders);          // Get all sales orders
router.post("/", salesOrdersController.createSalesOrder);       // Create a new sales order
router.get("/:id", salesOrdersController.getSalesOrderById);    // Get a sales order by ID
router.put("/:id", salesOrdersController.updateSalesOrder);     // Update a sales order by ID
router.delete("/:id", salesOrdersController.deleteSalesOrder);  // Delete a sales order by ID

module.exports = router;
