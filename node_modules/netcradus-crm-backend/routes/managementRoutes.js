const express = require("express");
const managementController = require("../controllers/managementController");

const router = express.Router();

router.use(managementController.ensureAccess);

router.get("/sidebar-summary", managementController.getSidebarSummary);

router.get("/business/clients", managementController.getClients);
router.post("/business/clients", managementController.createClient);
router.put("/business/clients/:id", managementController.updateClient);
router.delete("/business/clients/:id", managementController.deleteClient);

router.get("/business/tenders", managementController.getTenders);
router.post("/business/tenders", managementController.createTender);
router.put("/business/tenders/:id", managementController.updateTender);
router.delete("/business/tenders/:id", managementController.deleteTender);

router.get("/business/overview", managementController.getBusinessOverview);
router.post("/business/overview", managementController.createBusinessOverview);
router.put("/business/overview/:id", managementController.updateBusinessOverview);
router.delete("/business/overview/:id", managementController.deleteBusinessOverview);

router.get("/day-to-day/purchases", managementController.getPurchases);
router.post("/day-to-day/purchases", managementController.createPurchase);
router.put("/day-to-day/purchases/:id", managementController.updatePurchase);
router.delete("/day-to-day/purchases/:id", managementController.deletePurchase);

router.get("/day-to-day/purchase-items", managementController.getPurchaseItems);
router.post("/day-to-day/purchase-items", managementController.createPurchaseItem);
router.put("/day-to-day/purchase-items/:id", managementController.updatePurchaseItem);
router.delete("/day-to-day/purchase-items/:id", managementController.deletePurchaseItem);

router.get("/day-to-day/invoices", managementController.getInvoices);
router.post("/day-to-day/invoices", managementController.createInvoice);
router.put("/day-to-day/invoices/:id", managementController.updateInvoice);
router.delete("/day-to-day/invoices/:id", managementController.deleteInvoice);

module.exports = router;
