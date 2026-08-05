const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const contractController = require("../controllers/clientContractController");
const invoiceController = require("../controllers/invoiceController");
const documentController = require("../controllers/documentController");
const contactController = require("../controllers/clientContactController");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

router.use(authMiddleware);

// All allowed roles for viewing clients
const VIEW_ROLES = ["super_user", "coo", "admin", "manager", "sales", "finance"];
const CREATE_ROLES = ["super_user", "coo", "admin", "sales"];
const ARCHIVE_ROLES = ["super_user", "coo", "admin"];
const DELETE_ROLES = ["super_user"];

// Client endpoints
router.get("/", rbac(VIEW_ROLES), clientController.getClients);
router.get("/stats", rbac(VIEW_ROLES), clientController.getClientStats);
router.get("/:id", rbac(VIEW_ROLES), clientController.getClientById);
router.post("/", rbac(CREATE_ROLES), clientController.createClient);
router.put("/:id", rbac(VIEW_ROLES), clientController.updateClient);
router.patch("/:id/archive", rbac(ARCHIVE_ROLES), clientController.archiveClient);
router.delete("/:id", rbac(DELETE_ROLES), clientController.deleteClient);

// Embedded notes helper endpoint
router.post("/:id/notes", rbac(VIEW_ROLES), clientController.addClientNote);

// Support portal access management
const SUPPORT_MANAGE_ROLES = ["super_user", "coo", "admin"];
router.post("/:id/support-access", rbac(SUPPORT_MANAGE_ROLES), clientController.enableSupportAccess);
router.patch("/:id/support-access/:userId/reset-password", rbac(SUPPORT_MANAGE_ROLES), clientController.resetSupportPassword);
router.patch("/:id/support-access/:userId/suspend", rbac(SUPPORT_MANAGE_ROLES), clientController.suspendSupportAccess);
router.patch("/:id/support-access/:userId/activate", rbac(SUPPORT_MANAGE_ROLES), clientController.reEnableSupportAccess);

// Contracts routes
router.get("/:clientId/contracts", rbac(VIEW_ROLES), contractController.getClientContracts);
router.post("/:clientId/contracts", rbac(CREATE_ROLES), contractController.createContract);
router.get("/:clientId/contracts/:contractId", rbac(VIEW_ROLES), contractController.getContractById);
router.put("/:clientId/contracts/:contractId", rbac(VIEW_ROLES), contractController.updateContract);
router.patch("/:clientId/contracts/:contractId/archive", rbac(ARCHIVE_ROLES), contractController.archiveContract);
router.delete("/:clientId/contracts/:contractId", rbac(DELETE_ROLES), contractController.deleteContract);

// Invoices routes
const FINANCE_ROLES = ["super_user", "coo", "admin", "finance"];
router.get("/:clientId/invoices", rbac(VIEW_ROLES), invoiceController.getClientInvoices);
router.post("/:clientId/invoices", rbac(FINANCE_ROLES), invoiceController.createClientInvoice);
router.get("/:clientId/invoices/:invoiceId", rbac(VIEW_ROLES), invoiceController.getClientInvoiceById);
router.put("/:clientId/invoices/:invoiceId", rbac(FINANCE_ROLES), invoiceController.updateClientInvoice);
router.patch("/:clientId/invoices/:invoiceId/status", rbac(FINANCE_ROLES), invoiceController.patchClientInvoiceStatus);
router.post("/:clientId/invoices/:invoiceId/payment", rbac(FINANCE_ROLES), invoiceController.recordClientPayment);
router.get("/:clientId/invoices/:invoiceId/pdf", rbac(VIEW_ROLES), invoiceController.downloadInvoicePdf);
router.delete("/:clientId/invoices/:invoiceId", rbac(DELETE_ROLES), invoiceController.deleteClientInvoice);

// Documents routes
router.get("/:clientId/documents", rbac(VIEW_ROLES), documentController.getClientDocuments);
router.post("/:clientId/documents", rbac(VIEW_ROLES), upload.single("file"), documentController.uploadClientDocument);
router.put("/:clientId/documents/:documentId", rbac(VIEW_ROLES), documentController.updateClientDocument);
router.patch("/:clientId/documents/:documentId/archive", rbac(ARCHIVE_ROLES), documentController.archiveClientDocument);
router.delete("/:clientId/documents/:documentId", rbac(DELETE_ROLES), documentController.deleteFile);

// Contacts routes
router.get("/:clientId/contacts", rbac(VIEW_ROLES), contactController.getClientContacts);
router.post("/:clientId/contacts", rbac(CREATE_ROLES), contactController.createClientContact);
router.get("/:clientId/contacts/:contactId", rbac(VIEW_ROLES), contactController.getClientContactById);
router.put("/:clientId/contacts/:contactId", rbac(VIEW_ROLES), contactController.updateClientContact);
router.patch("/:clientId/contacts/:contactId/primary", rbac(CREATE_ROLES), contactController.makeContactPrimary);
router.patch("/:clientId/contacts/:contactId/status", rbac(CREATE_ROLES), contactController.patchContactStatus);
router.delete("/:clientId/contacts/:contactId", rbac(DELETE_ROLES), contactController.deleteClientContact);
router.post("/:clientId/contacts/:contactId/support-access", rbac(SUPPORT_MANAGE_ROLES), contactController.enableContactSupportAccess);
router.patch("/:clientId/contacts/:contactId/support-access/suspend", rbac(SUPPORT_MANAGE_ROLES), contactController.suspendContactSupportAccess);

// Projects routes (nested query route)
router.get("/:clientId/projects", rbac(VIEW_ROLES), clientController.getClientProjects);

module.exports = router;
