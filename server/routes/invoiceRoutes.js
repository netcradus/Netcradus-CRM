const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

router.use(authMiddleware, rbac(["super_user", "admin"]));

// Routes
router.get("/", invoiceController.getInvoices);           // Get all invoices
router.post("/", invoiceController.createInvoice);        // Create new invoice
router.post("/generate-from-expense", invoiceController.generateInvoiceFromExpense);
router.get("/:id", invoiceController.getInvoiceById);     // Get invoice by ID
router.put("/:id", invoiceController.updateInvoice);      // Update invoice by ID
router.delete("/:id", invoiceController.deleteInvoice);   // Delete invoice by ID

module.exports = router;
