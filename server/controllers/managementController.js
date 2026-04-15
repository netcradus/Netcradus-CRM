const AuditLog = require("../models/AuditLog");
const ManagementClient = require("../models/ManagementClient");
const ManagementTender = require("../models/ManagementTender");
const ManagementBusinessReport = require("../models/ManagementBusinessReport");
const ManagementPurchase = require("../models/ManagementPurchase");
const ManagementPurchaseItem = require("../models/ManagementPurchaseItem");
const ManagementInvoice = require("../models/ManagementInvoice");

const ALLOWED_ROLES = ["super_user", "management"];

const SECTION_MAP = {
  clients: {
    Model: ManagementClient,
    name: "clients",
    fields: ["companyName", "contactPerson", "email", "phone", "status", "segment", "notes"],
    summary: async () => {
      const [total, active, recent] = await Promise.all([
        ManagementClient.countDocuments(),
        ManagementClient.countDocuments({ status: "Active" }),
        ManagementClient.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);
      return [
        { label: "Total Clients", value: total },
        { label: "Active Clients", value: active },
        { label: "Added This Month", value: recent },
      ];
    },
  },
  tenders: {
    Model: ManagementTender,
    name: "tenders",
    fields: ["tenderName", "clientName", "bidValue", "status", "submissionDate", "notes"],
    summary: async () => {
      const [open, won, totalValue] = await Promise.all([
        ManagementTender.countDocuments({ status: { $in: ["Open", "Submitted", "In Review"] } }),
        ManagementTender.countDocuments({ status: "Won" }),
        ManagementTender.aggregate([{ $group: { _id: null, total: { $sum: "$bidValue" } } }]),
      ]);
      return [
        { label: "Active Tenders", value: open },
        { label: "Won Tenders", value: won },
        { label: "Bid Value", value: totalValue[0]?.total || 0, currency: true },
      ];
    },
  },
  overview: {
    Model: ManagementBusinessReport,
    name: "overview",
    fields: ["reportTitle", "category", "metricValue", "status", "summary"],
    summary: async () => {
      const [healthy, watch, critical] = await Promise.all([
        ManagementBusinessReport.countDocuments({ status: "Healthy" }),
        ManagementBusinessReport.countDocuments({ status: "Watch" }),
        ManagementBusinessReport.countDocuments({ status: "Critical" }),
      ]);
      return [
        { label: "Healthy Metrics", value: healthy },
        { label: "Watchlist", value: watch },
        { label: "Critical Metrics", value: critical },
      ];
    },
  },
  purchases: {
    Model: ManagementPurchase,
    name: "purchases",
    fields: ["itemName", "vendorName", "amount", "purchaseDate", "status", "notes"],
    summary: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [count, totalAmount, processing] = await Promise.all([
        ManagementPurchase.countDocuments({ purchaseDate: { $gte: monthStart } }),
        ManagementPurchase.aggregate([
          { $match: { purchaseDate: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        ManagementPurchase.countDocuments({ status: "Processing" }),
      ]);
      return [
        { label: "This Month", value: count },
        { label: "Monthly Spend", value: totalAmount[0]?.total || 0, currency: true },
        { label: "Processing", value: processing },
      ];
    },
  },
  "purchase-items": {
    Model: ManagementPurchaseItem,
    name: "purchase-items",
    fields: ["itemName", "vendorName", "expectedDeliveryDate", "priority", "status", "notes"],
    summary: async () => {
      const [pending, ordered, urgent] = await Promise.all([
        ManagementPurchaseItem.countDocuments({ status: "Pending" }),
        ManagementPurchaseItem.countDocuments({ status: "Ordered" }),
        ManagementPurchaseItem.countDocuments({ priority: "Urgent", status: { $ne: "Received" } }),
      ]);
      return [
        { label: "Pending Items", value: pending },
        { label: "Ordered", value: ordered },
        { label: "Urgent", value: urgent },
      ];
    },
  },
  invoices: {
    Model: ManagementInvoice,
    name: "invoices",
    fields: ["invoiceNumber", "clientName", "amount", "dueDate", "status", "notes"],
    summary: async () => {
      const [pending, paid, overdue] = await Promise.all([
        ManagementInvoice.countDocuments({ status: "Pending" }),
        ManagementInvoice.countDocuments({ status: "Paid" }),
        ManagementInvoice.countDocuments({ status: "Overdue" }),
      ]);
      return [
        { label: "Pending", value: pending },
        { label: "Paid", value: paid },
        { label: "Overdue", value: overdue },
      ];
    },
  },
};

const ensureAccess = async (req, res, next) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  if (ALLOWED_ROLES.includes(role)) return next();

  await AuditLog.create({
    action: "MANAGEMENT_ACCESS_DENIED",
    performedBy: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { path: req.originalUrl, role },
  });
  return res.status(403).json({ message: "Permission denied." });
};

const sanitizePayload = (body, fields) =>
  fields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});

const buildCrudHandlers = (sectionKey) => {
  const config = SECTION_MAP[sectionKey];
  if (!config) throw new Error(`Unknown management section: ${sectionKey}`);

  return {
    list: async (req, res) => {
      const search = String(req.query.q || "").trim();
      const query = search
        ? {
            $or: Object.keys(sanitizePayload({ ...config.fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}) }, config.fields))
              .filter((field) => !["amount", "bidValue", "metricValue", "purchaseDate", "submissionDate", "dueDate", "expectedDeliveryDate"].includes(field))
              .map((field) => ({ [field]: { $regex: search, $options: "i" } })),
          }
        : {};

      const rows = await config.Model.find(query).sort({ createdAt: -1 });
      const cards = await config.summary();
      return res.json({ cards, rows });
    },
    create: async (req, res) => {
      const payload = sanitizePayload(req.body, config.fields);
      const doc = await config.Model.create({
        ...payload,
        createdBy: req.user._id,
      });
      return res.status(201).json(doc);
    },
    update: async (req, res) => {
      const payload = sanitizePayload(req.body, config.fields);
      const doc = await config.Model.findByIdAndUpdate(
        req.params.id,
        { ...payload, updatedBy: req.user._id },
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ message: "Record not found." });
      return res.json(doc);
    },
    remove: async (req, res) => {
      const doc = await config.Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Record not found." });
      return res.json({ message: "Record deleted successfully." });
    },
  };
};

const clients = buildCrudHandlers("clients");
const tenders = buildCrudHandlers("tenders");
const overview = buildCrudHandlers("overview");
const purchases = buildCrudHandlers("purchases");
const purchaseItems = buildCrudHandlers("purchase-items");
const invoices = buildCrudHandlers("invoices");

const getSidebarSummary = async (req, res) => {
  const [monthPurchaseCount, pendingItems, overdueInvoices] = await Promise.all([
    SECTION_MAP.purchases.summary(),
    SECTION_MAP["purchase-items"].summary(),
    SECTION_MAP.invoices.summary(),
  ]);

  return res.json({
    purchasesThisPeriod: monthPurchaseCount[0]?.value || 0,
    pendingPurchaseItems: pendingItems[0]?.value || 0,
    outstandingInvoices: invoicesSummaryValue(overdueInvoices),
  });
};

const invoicesSummaryValue = (cards) => {
  const overdue = cards.find((item) => item.label === "Overdue")?.value || 0;
  const pending = cards.find((item) => item.label === "Pending")?.value || 0;
  return overdue + pending;
};

module.exports = {
  ensureAccess,
  getSidebarSummary,
  getClients: clients.list,
  createClient: clients.create,
  updateClient: clients.update,
  deleteClient: clients.remove,
  getTenders: tenders.list,
  createTender: tenders.create,
  updateTender: tenders.update,
  deleteTender: tenders.remove,
  getBusinessOverview: overview.list,
  createBusinessOverview: overview.create,
  updateBusinessOverview: overview.update,
  deleteBusinessOverview: overview.remove,
  getPurchases: purchases.list,
  createPurchase: purchases.create,
  updatePurchase: purchases.update,
  deletePurchase: purchases.remove,
  getPurchaseItems: purchaseItems.list,
  createPurchaseItem: purchaseItems.create,
  updatePurchaseItem: purchaseItems.update,
  deletePurchaseItem: purchaseItems.remove,
  getInvoices: invoices.list,
  createInvoice: invoices.create,
  updateInvoice: invoices.update,
  deleteInvoice: invoices.remove,
};
