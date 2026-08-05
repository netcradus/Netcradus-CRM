const ClientContract = require("../models/ClientContract");
const Client = require("../models/Client");
const AuditLog = require("../models/AuditLog");

// Get all contracts for a client
exports.getClientContracts = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const contracts = await ClientContract.find({ clientId, archivedAt: null }).sort({ createdAt: -1 });

    // Sync expired/expiring soon statuses dynamically in query time
    const now = new Date();
    for (const contract of contracts) {
      let status = contract.status;
      if (contract.status !== "Terminated" && contract.status !== "Renewed") {
        if (contract.endDate < now) {
          status = "Expired";
        } else if (contract.status === "Active" && (contract.endDate - now) <= 30 * 24 * 60 * 60 * 1000) {
          status = "Expiring Soon";
        } else if (contract.status === "Draft" && contract.startDate <= now && contract.endDate >= now) {
          status = "Active";
        }
      }

      if (status !== contract.status) {
        contract.status = status;
        await contract.save();
      }
    }

    res.status(200).json({ success: true, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new contract
exports.createContract = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const {
      title,
      contractType,
      startDate,
      endDate,
      contractValue,
      currency,
      billingType,
      paymentTerms,
      autoRenew,
      noticePeriodDays,
      description,
      terms,
      documentId,
    } = req.body;

    if (!title || !startDate || !endDate || contractValue === undefined) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, message: "End date cannot be earlier than start date." });
    }

    if (Number(contractValue) < 0) {
      return res.status(400).json({ success: false, message: "Contract value cannot be negative." });
    }

    // Determine initial status based on date range
    const now = new Date();
    let status = "Draft";
    if (start <= now && end >= now) {
      status = "Active";
    }

    const contract = new ClientContract({
      clientId,
      title,
      contractType,
      startDate,
      endDate,
      contractValue,
      currency,
      billingType,
      paymentTerms,
      status,
      autoRenew,
      noticePeriodDays,
      description,
      terms,
      documentId: documentId || null,
      createdBy: req.user.id,
    });

    const savedContract = await contract.save();

    // Audit logging
    await AuditLog.create({
      action: "CONTRACT_CREATE",
      performedBy: req.user.id,
      details: { clientId, title, contractId: savedContract.contractId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, data: savedContract });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get single contract details
exports.getContractById = async (req, res) => {
  try {
    const { clientId, contractId } = req.params;
    const contract = await ClientContract.findOne({ _id: contractId, clientId, archivedAt: null }).populate("documentId");
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found." });
    }
    res.status(200).json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a contract
exports.updateContract = async (req, res) => {
  try {
    const { clientId, contractId } = req.params;
    const contract = await ClientContract.findOne({ _id: contractId, clientId, archivedAt: null });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found." });
    }

    const {
      title,
      contractType,
      startDate,
      endDate,
      contractValue,
      currency,
      billingType,
      paymentTerms,
      status,
      autoRenew,
      noticePeriodDays,
      description,
      terms,
      documentId,
    } = req.body;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ success: false, message: "End date cannot be earlier than start date." });
      }
    }

    if (contractValue !== undefined && Number(contractValue) < 0) {
      return res.status(400).json({ success: false, message: "Contract value cannot be negative." });
    }

    // Apply updates
    if (title !== undefined) contract.title = title;
    if (contractType !== undefined) contract.contractType = contractType;
    if (startDate !== undefined) contract.startDate = startDate;
    if (endDate !== undefined) contract.endDate = endDate;
    if (contractValue !== undefined) contract.contractValue = contractValue;
    if (currency !== undefined) contract.currency = currency;
    if (billingType !== undefined) contract.billingType = billingType;
    if (paymentTerms !== undefined) contract.paymentTerms = paymentTerms;
    if (status !== undefined) contract.status = status;
    if (autoRenew !== undefined) contract.autoRenew = autoRenew;
    if (noticePeriodDays !== undefined) contract.noticePeriodDays = noticePeriodDays;
    if (description !== undefined) contract.description = description;
    if (terms !== undefined) contract.terms = terms;
    if (documentId !== undefined) contract.documentId = documentId || null;

    contract.updatedBy = req.user.id;
    const updatedContract = await contract.save();

    await AuditLog.create({
      action: "CONTRACT_UPDATE",
      performedBy: req.user.id,
      details: { clientId, contractId: contract.contractId, title: contract.title },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, data: updatedContract });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Archive a contract (soft delete)
exports.archiveContract = async (req, res) => {
  try {
    const { clientId, contractId } = req.params;
    const contract = await ClientContract.findOne({ _id: contractId, clientId, archivedAt: null });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found or already archived." });
    }

    contract.archivedAt = new Date();
    contract.archivedBy = req.user.id;
    contract.status = "Terminated";
    await contract.save();

    await AuditLog.create({
      action: "CONTRACT_ARCHIVE",
      performedBy: req.user.id,
      details: { clientId, contractId: contract.contractId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Contract archived successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hard delete a contract (Super User only)
exports.deleteContract = async (req, res) => {
  try {
    const { clientId, contractId } = req.params;
    
    // Explicit role permission check
    if (req.user.role !== "super_user") {
      return res.status(403).json({ success: false, message: "Forbidden: Super User access required." });
    }

    const contract = await ClientContract.findOneAndDelete({ _id: contractId, clientId });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found." });
    }

    await AuditLog.create({
      action: "CONTRACT_DELETE",
      performedBy: req.user.id,
      details: { clientId, contractId: contract.contractId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ success: true, message: "Contract permanently deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
