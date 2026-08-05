const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");
const Project = require("../models/Project");
const Client = require("../models/Client");
const AuditLog = require("../models/AuditLog");
const PDFDocument = require("pdfkit");
const { notifyPartnerInvoiceGenerated } = require("../services/partnerNotificationService");

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
    const { customer, amount, dueDate, status, projectId } = req.body;
    const project = projectId ? await Project.findById(projectId) : null;
    // Partner-linked invoices notify the partner while ordinary invoices keep their existing flow.
    const invoice = new Invoice({ customer, amount, dueDate, status, sourceType: "manual", projectId: project?._id || null, partnerId: project?.partnerId || null });
    const savedInvoice = await invoice.save();
    if (project?.partnerId) {
      await notifyPartnerInvoiceGenerated(project);
    }
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

/**
 * Helper to calculate subtotal, tax, discount, total, and balance amounts on the backend.
 */
const calculateInvoiceAmounts = (lineItems, taxType, taxValue, discountType, discountValue, paidAmount) => {
  let subtotal = 0;
  if (!lineItems || !lineItems.length) {
    throw new Error("At least one line item is required.");
  }

  for (const item of lineItems) {
    const qty = Number(item.quantity);
    const rate = Number(item.rate);

    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be greater than 0.");
    }
    if (isNaN(rate) || rate < 0) {
      throw new Error("Rate cannot be negative.");
    }

    item.amount = qty * rate;
    subtotal += item.amount;
  }

  // Tax computation
  let taxAmt = 0;
  const tVal = Number(taxValue) || 0;
  if (tVal < 0) {
    throw new Error("Tax cannot be negative.");
  }
  if (taxType === "Percentage") {
    taxAmt = (subtotal * tVal) / 100;
  } else {
    taxAmt = tVal;
  }

  // Discount computation
  let discAmt = 0;
  const dVal = Number(discountValue) || 0;
  if (dVal < 0) {
    throw new Error("Discount cannot be negative.");
  }
  if (discountType === "Percentage") {
    discAmt = (subtotal * dVal) / 100;
  } else {
    discAmt = dVal;
  }

  const total = subtotal + taxAmt - discAmt;
  if (total < 0) {
    throw new Error("Discount must not make total negative.");
  }

  const paid = Number(paidAmount) || 0;
  if (paid < 0) {
    throw new Error("Paid amount cannot be negative.");
  }
  if (paid > total + 0.01) {
    throw new Error("Paid amount cannot exceed total.");
  }

  const balance = Math.max(0, total - paid);

  return {
    subtotal,
    taxAmount: taxAmt,
    discountAmount: discAmt,
    total,
    paidAmount: paid,
    balanceAmount: balance,
    lineItems
  };
};

/**
 * Helper to dynamically determine the payment status based on dates and transaction balances.
 */
const determinePaymentStatus = (invoice, explicitStatus = null) => {
  if (explicitStatus === "Cancelled" || invoice.paymentStatus === "Cancelled") {
    return "Cancelled";
  }
  if (explicitStatus === "Draft" || (invoice.paymentStatus === "Draft" && !explicitStatus)) {
    return "Draft";
  }

  const now = new Date();
  const due = new Date(invoice.dueDate);
  const paid = invoice.paidAmount || 0;
  const total = invoice.total || 0;
  const balance = invoice.balanceAmount || 0;

  if (paid >= total - 0.01) {
    return "Paid";
  }
  if (paid > 0) {
    return "Partial";
  }
  if (due < now && balance > 0) {
    return "Overdue";
  }
  return explicitStatus || "Sent";
};

const getCurrencySymbol = (currency) => {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "GBP": return "£";
    default: return "₹";
  }
};

/**
 * Generates a professional PDF document buffer using PDFKit.
 */
const renderInvoicePdfBuffer = (invoice, client) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PAGE_W = doc.page.width;
    const MARGIN = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // Palette
    const BRAND_DARK = "#1a1a2e";
    const BRAND_MID = "#16213e";
    const BRAND_ACCENT = "#e94560";
    const TEXT_DARK = "#333333";
    const TEXT_MUTED = "#666666";
    const ROW_ALT = "#f9f9f9";

    // 1. HEADER BAND
    doc.rect(0, 0, PAGE_W, 100).fill(BRAND_DARK);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("NETCRADUS CRM", MARGIN, 35);
    doc.fontSize(10).font("Helvetica").text("Enterprise Customer Relationship Management", MARGIN, 60);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("INVOICE", PAGE_W - MARGIN - 150, 35, { width: 150, align: "right" });
    doc.fontSize(10).font("Helvetica").text(invoice.invoiceNumber || "Draft ID", PAGE_W - MARGIN - 150, 58, { width: 150, align: "right" });

    // 2. METADATA / BILLING DETAILS
    let y = 120;
    doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(10).text("BILLED TO:", MARGIN, y);
    doc.text("INVOICE DETAILS:", MARGIN + 280, y);

    y += 15;
    doc.font("Helvetica").fillColor(TEXT_DARK).text(client.clientName, MARGIN, y);
    doc.text(`Invoice No: ${invoice.invoiceNumber || "Draft"}`, MARGIN + 280, y);

    y += 14;
    doc.text(client.primaryEmail || "", MARGIN, y);
    doc.text(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-IN") : "—"}`, MARGIN + 280, y);

    y += 14;
    doc.text(client.primaryPhone || "", MARGIN, y);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`, MARGIN + 280, y);

    y += 14;
    doc.text(client.billingAddress || "", MARGIN, y, { width: 250 });
    doc.text(`Payment Status: ${invoice.paymentStatus || invoice.status}`, MARGIN + 280, y);

    // 3. TABLE OF LINE ITEMS
    y = 230;
    doc.rect(MARGIN, y, CONTENT_W, 20).fill(BRAND_MID);
    
    // Headers
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("Description", MARGIN + 10, y + 6, { width: 260 });
    doc.text("Qty", MARGIN + 280, y + 6, { width: 50, align: "center" });
    doc.text("Rate", MARGIN + 340, y + 6, { width: 70, align: "right" });
    doc.text("Amount", MARGIN + 420, y + 6, { width: 90, align: "right" });

    y += 20;
    doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(9);

    const symbol = getCurrencySymbol(invoice.currency);

    invoice.lineItems.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.rect(MARGIN, y, CONTENT_W, 20).fill(ROW_ALT);
      }
      doc.fillColor(TEXT_DARK);
      doc.text(item.description || "Line Item", MARGIN + 10, y + 6, { width: 260, lineBreak: false });
      doc.text(String(item.quantity), MARGIN + 280, y + 6, { width: 50, align: "center" });
      doc.text(`${symbol}${item.rate.toFixed(2)}`, MARGIN + 340, y + 6, { width: 70, align: "right" });
      doc.text(`${symbol}${item.amount.toFixed(2)}`, MARGIN + 420, y + 6, { width: 90, align: "right" });
      y += 20;
    });

    // 4. TOTALS SECTION
    y += 10;
    const totalsX = PAGE_W - MARGIN - 220;
    const totalsW = 220;

    const drawTotalLine = (label, val, isBold = false) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isBold ? BRAND_ACCENT : TEXT_DARK);
      doc.text(label, totalsX, y, { width: 120, align: "left" });
      doc.text(`${symbol}${val.toFixed(2)}`, totalsX + 120, y, { width: 100, align: "right" });
      y += 15;
    };

    drawTotalLine("Subtotal:", invoice.subtotal);
    drawTotalLine(`Tax (${invoice.taxType === "Percentage" ? invoice.taxValue + "%" : "Fixed"}):`, invoice.taxAmount);
    drawTotalLine(`Discount (${invoice.discountType === "Percentage" ? invoice.discountValue + "%" : "Fixed"}):`, invoice.discountAmount);
    
    // Draw boundary line
    doc.moveTo(totalsX, y - 2).lineTo(PAGE_W - MARGIN, y - 2).lineWidth(0.5).strokeColor("#dddddd").stroke();
    
    drawTotalLine("Grand Total:", invoice.total, true);
    drawTotalLine("Amount Paid:", invoice.paidAmount);
    drawTotalLine("Balance Due:", invoice.balanceAmount, true);

    // 5. NOTES AND TERMS
    y = PAGE_W - MARGIN - 120;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.5).strokeColor("#dddddd").stroke();
    
    y += 10;
    if (invoice.notes) {
      doc.font("Helvetica-Bold").fillColor(TEXT_MUTED).fontSize(8).text("NOTES / REMARKS:", MARGIN, y);
      doc.font("Helvetica").text(invoice.notes, MARGIN, y + 10, { width: CONTENT_W, height: 30 });
      y += 40;
    }
    
    if (invoice.terms) {
      doc.font("Helvetica-Bold").fillColor(TEXT_MUTED).fontSize(8).text("TERMS AND CONDITIONS:", MARGIN, y);
      doc.font("Helvetica").text(invoice.terms, MARGIN, y + 10, { width: CONTENT_W, height: 35 });
    }

    doc.end();
  });
};

/**
 * GET /api/clients/:clientId/invoices
 * Get all invoices for a client with dynamic overdue sync.
 */
exports.getClientInvoices = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const invoices = await Invoice.find({ clientId }).sort({ createdAt: -1 });

    const now = new Date();
    for (const inv of invoices) {
      const isOverdue = inv.dueDate < now && inv.balanceAmount > 0;
      const isNotFinal = inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled" && inv.paymentStatus !== "Draft";
      
      if (isOverdue && isNotFinal) {
        inv.paymentStatus = "Overdue";
        inv.status = "Overdue";
        await inv.save();
      }
    }

    res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/clients/:clientId/invoices/:invoiceId
 * Fetch details of a single client invoice.
 */
exports.getClientInvoiceById = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;
    const invoice = await Invoice.findOne({ _id: invoiceId, clientId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found or does not belong to client." });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/clients/:clientId/invoices
 * Create a new client-linked invoice.
 */
exports.createClientInvoice = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const {
      projectId,
      contractId,
      issueDate,
      dueDate,
      currency,
      taxType,
      taxValue,
      discountType,
      discountValue,
      notes,
      terms,
      lineItems,
      paidAmount,
      status, // 'Draft' or 'Sent' (initial override)
    } = req.body;

    if (!dueDate) {
      return res.status(400).json({ success: false, message: "Due date is required." });
    }

    const issue = issueDate ? new Date(issueDate) : new Date();
    const due = new Date(dueDate);
    if (due < issue) {
      return res.status(400).json({ success: false, message: "Due date cannot precede issue date." });
    }

    const initialPaid = Number(paidAmount) || 0;

    // Calculations
    const calculated = calculateInvoiceAmounts(
      lineItems,
      taxType || "Percentage",
      taxValue || 0,
      discountType || "Percentage",
      discountValue || 0,
      initialPaid
    );

    const invoice = new Invoice({
      customer: client.clientName,
      amount: calculated.total,
      dueDate: due,
      projectId: projectId || null,
      clientId,
      contractId: contractId || null,
      issueDate: issue,
      currency: currency || "INR",
      subtotal: calculated.subtotal,
      taxType: taxType || "Percentage",
      taxValue: Number(taxValue) || 0,
      taxAmount: calculated.taxAmount,
      discountType: discountType || "Percentage",
      discountValue: Number(discountValue) || 0,
      discountAmount: calculated.discountAmount,
      total: calculated.total,
      paidAmount: calculated.paidAmount,
      balanceAmount: calculated.balanceAmount,
      notes,
      terms,
      lineItems: calculated.lineItems,
      createdBy: req.user.id,
    });

    // Enforce initial status (Draft or auto-computed from Sent)
    invoice.paymentStatus = determinePaymentStatus(invoice, status || "Sent");
    invoice.status = invoice.paymentStatus; // legacy status mapping

    const savedInvoice = await invoice.save();

    await AuditLog.create({
      action: "INVOICE_CREATE",
      performedBy: req.user.id,
      details: { clientId, invoiceNumber: savedInvoice.invoiceNumber, total: savedInvoice.total },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, data: savedInvoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/clients/:clientId/invoices/:invoiceId
 * Edit invoice details. Allowed only if status is not Cancelled.
 */
exports.updateClientInvoice = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;
    const invoice = await Invoice.findOne({ _id: invoiceId, clientId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot edit a cancelled invoice." });
    }

    const {
      projectId,
      contractId,
      issueDate,
      dueDate,
      currency,
      taxType,
      taxValue,
      discountType,
      discountValue,
      notes,
      terms,
      lineItems,
    } = req.body;

    if (dueDate) {
      const issue = issueDate ? new Date(issueDate) : new Date(invoice.issueDate);
      const due = new Date(dueDate);
      if (due < issue) {
        return res.status(400).json({ success: false, message: "Due date cannot precede issue date." });
      }
      invoice.dueDate = due;
    }

    if (lineItems && lineItems.length) {
      const calculated = calculateInvoiceAmounts(
        lineItems,
        taxType || invoice.taxType,
        taxValue !== undefined ? taxValue : invoice.taxValue,
        discountType || invoice.discountType,
        discountValue !== undefined ? discountValue : invoice.discountValue,
        invoice.paidAmount
      );

      invoice.subtotal = calculated.subtotal;
      invoice.taxAmount = calculated.taxAmount;
      invoice.discountAmount = calculated.discountAmount;
      invoice.total = calculated.total;
      invoice.amount = calculated.total;
      invoice.balanceAmount = calculated.balanceAmount;
      invoice.lineItems = calculated.lineItems;
    }

    if (taxType) invoice.taxType = taxType;
    if (taxValue !== undefined) invoice.taxValue = Number(taxValue) || 0;
    if (discountType) invoice.discountType = discountType;
    if (discountValue !== undefined) invoice.discountValue = Number(discountValue) || 0;

    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (currency) invoice.currency = currency;
    if (projectId !== undefined) invoice.projectId = projectId || null;
    if (contractId !== undefined) invoice.contractId = contractId || null;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;

    // Recalculate status
    invoice.paymentStatus = determinePaymentStatus(invoice);
    invoice.status = invoice.paymentStatus;

    invoice.updatedBy = req.user.id;
    const savedInvoice = await invoice.save();

    await AuditLog.create({
      action: "INVOICE_UPDATE",
      performedBy: req.user.id,
      details: { clientId, invoiceNumber: savedInvoice.invoiceNumber, total: savedInvoice.total },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: savedInvoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/clients/:clientId/invoices/:invoiceId/status
 * Transition status directly (e.g. Sent or Cancelled).
 */
exports.patchClientInvoiceStatus = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;
    const { status } = req.body;

    if (!["Sent", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status transition. Allowed: Sent, Cancelled." });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, clientId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Invoice is already cancelled." });
    }

    invoice.paymentStatus = determinePaymentStatus(invoice, status);
    invoice.status = invoice.paymentStatus;
    invoice.updatedBy = req.user.id;

    const savedInvoice = await invoice.save();

    await AuditLog.create({
      action: "INVOICE_UPDATE",
      performedBy: req.user.id,
      details: { clientId, invoiceNumber: savedInvoice.invoiceNumber, status: savedInvoice.paymentStatus },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: savedInvoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/clients/:clientId/invoices/:invoiceId/payment
 * Record a payment, append history log, and update aggregates.
 */
exports.recordClientPayment = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;
    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than 0." });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, clientId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot record payment on a cancelled invoice." });
    }

    if (payAmt > invoice.balanceAmount + 0.01) {
      return res.status(400).json({ success: false, message: `Payment amount (${payAmt}) exceeds remaining balance (${invoice.balanceAmount}).` });
    }

    // Append to payment history
    invoice.paymentHistory.push({
      amount: payAmt,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      referenceNumber,
      notes,
      recordedBy: req.user.id
    });

    invoice.paidAmount += payAmt;
    invoice.balanceAmount = Math.max(0, invoice.total - invoice.paidAmount);
    invoice.paymentStatus = determinePaymentStatus(invoice);
    invoice.status = invoice.paymentStatus;
    invoice.updatedBy = req.user.id;

    const savedInvoice = await invoice.save();

    await AuditLog.create({
      action: "INVOICE_UPDATE",
      performedBy: req.user.id,
      details: { clientId, invoiceNumber: savedInvoice.invoiceNumber, action: "PAYMENT_RECORDED", amount: payAmt },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: savedInvoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/clients/:clientId/invoices/:invoiceId/pdf
 * Generates and downloads a secure authenticated PDF stream.
 */
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, clientId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found or does not belong to client." });
    }

    const pdfBuffer = await renderInvoicePdfBuffer(invoice, client);
    const filename = `invoice-${invoice.invoiceNumber || "Draft"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Gen Error:", err);
    res.status(500).json({ success: false, message: "Failed to generate PDF.", error: err.message });
  }
};

/**
 * DELETE /api/clients/:clientId/invoices/:invoiceId
 * Delete invoice (Super User only).
 */
exports.deleteClientInvoice = async (req, res) => {
  try {
    const { clientId, invoiceId } = req.params;

    if (req.user.role !== "super_user") {
      return res.status(403).json({ success: false, message: "Forbidden: Super User access required." });
    }

    const deletedInvoice = await Invoice.findOneAndDelete({ _id: invoiceId, clientId });
    if (!deletedInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    await AuditLog.create({
      action: "INVOICE_DELETE",
      performedBy: req.user.id,
      details: { clientId, invoiceNumber: deletedInvoice.invoiceNumber },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Invoice deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

