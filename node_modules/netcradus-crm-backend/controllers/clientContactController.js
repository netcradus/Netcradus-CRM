const mongoose = require("mongoose");
const Client = require("../models/Client");
const ClientContact = require("../models/ClientContact");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcrypt");

const errorResponse = (res, status, message, code) =>
  res.status(status).json({ success: false, message, code });

// Scoping query by user role for security
const checkClientAccess = (req, client) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const userId = String(req.user?._id || req.user?.id);

  if (["super_user", "coo", "admin", "finance"].includes(role)) {
    return true;
  }

  if (role === "sales") {
    return (
      String(client.assignedSalesPerson || "") === userId ||
      String(client.createdBy || "") === userId
    );
  }

  if (role === "manager") {
    return (
      String(client.assignedAccountManager || "") === userId ||
      String(client.createdBy || "") === userId
    );
  }

  return false;
};

// Check if user is support admin (Super User, COO, Admin)
const isSupportAdmin = (req) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  return ["super_user", "coo", "admin"].includes(role);
};

// Helper to sync primary contact details to Client model for legacy compatibility
const syncPrimaryContactToClient = async (client, contact) => {
  if (contact && contact.isPrimary) {
    client.contactPersonName = contact.name;
    client.contactPersonDesignation = contact.designation || "";
    client.primaryEmail = contact.email;
    client.primaryPhone = contact.phone || "";
    client.alternatePhone = contact.alternatePhone || "";
    client.preferredContactMethod = contact.preferredContactMethod || "Email";
    await client.save();
  }
};

// 1. GET /api/clients/:clientId/contacts
exports.getClientContacts = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const contacts = await ClientContact.find({ clientId })
      .populate("linkedSupportUser", "_id name email role isDisabled")
      .sort({ isPrimary: -1, name: 1 });

    res.json({ success: true, contacts });
  } catch (error) {
    console.error("Get Client Contacts Error:", error);
    res.status(500).json({ success: false, message: "Error fetching contacts." });
  }
};

// 2. POST /api/clients/:clientId/contacts
exports.createClientContact = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      name,
      designation,
      department,
      email,
      phone,
      alternatePhone,
      preferredContactMethod,
      contactType,
      isPrimary,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 400, "Name is required.", "NAME_REQUIRED");
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 400, "Email is required.", "EMAIL_REQUIRED");
    }
    if (!phone || !phone.trim()) {
      return errorResponse(res, 400, "Phone number is required.", "PHONE_REQUIRED");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (client.status === "Archived") {
      return errorResponse(res, 400, "Cannot add contacts to an archived client.", "CLIENT_ARCHIVED");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    // Check unique email within same client
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await ClientContact.findOne({ clientId, email: normalizedEmail });
    if (existing) {
      return errorResponse(res, 400, "A contact with this email already exists for this client.", "DUPLICATE_EMAIL");
    }

    // Create contact
    const contact = new ClientContact({
      clientId,
      name: name.trim(),
      designation: designation ? designation.trim() : "",
      department: department ? department.trim() : "",
      email: normalizedEmail,
      phone: phone.trim(),
      alternatePhone: alternatePhone ? alternatePhone.trim() : "",
      preferredContactMethod: preferredContactMethod || "Email",
      contactType: contactType || "Other",
      isPrimary: Boolean(isPrimary),
      notes: notes ? notes.trim() : "",
      createdBy: req.user._id,
    });

    if (contact.isPrimary) {
      // Unmark all other contacts as primary
      await ClientContact.updateMany({ clientId }, { isPrimary: false });
    }

    await contact.save();

    // Sync Client primary contact details
    if (contact.isPrimary) {
      await syncPrimaryContactToClient(client, contact);
    }

    // Log Audit
    await AuditLog.create({
      action: "CLIENT_CONTACT_ADDED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, email: normalizedEmail, isPrimary: contact.isPrimary },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error("Create Contact Error:", error);
    res.status(500).json({ success: false, message: "Error creating contact." });
  }
};

// 3. GET /api/clients/:clientId/contacts/:contactId
exports.getClientContactById = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId })
      .populate("linkedSupportUser", "_id name email role isDisabled");

    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    res.json({ success: true, contact });
  } catch (error) {
    console.error("Get Contact Error:", error);
    res.status(500).json({ success: false, message: "Error fetching contact." });
  }
};

// 4. PUT /api/clients/:clientId/contacts/:contactId
exports.updateClientContact = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;
    const {
      name,
      designation,
      department,
      email,
      phone,
      alternatePhone,
      preferredContactMethod,
      contactType,
      isPrimary,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 400, "Name is required.", "NAME_REQUIRED");
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 400, "Email is required.", "EMAIL_REQUIRED");
    }
    if (!phone || !phone.trim()) {
      return errorResponse(res, 400, "Phone number is required.", "PHONE_REQUIRED");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    // Check unique email (excluding itself) within same client
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await ClientContact.findOne({ clientId, email: normalizedEmail, _id: { $ne: contactId } });
    if (existing) {
      return errorResponse(res, 400, "A contact with this email already exists for this client.", "DUPLICATE_EMAIL");
    }

    const wasPrimary = contact.isPrimary;
    const nowPrimary = Boolean(isPrimary);

    contact.name = name.trim();
    contact.designation = designation ? designation.trim() : "";
    contact.department = department ? department.trim() : "";
    contact.email = normalizedEmail;
    contact.phone = phone.trim();
    contact.alternatePhone = alternatePhone ? alternatePhone.trim() : "";
    contact.preferredContactMethod = preferredContactMethod || "Email";
    contact.contactType = contactType || "Other";
    contact.isPrimary = nowPrimary;
    contact.notes = notes ? notes.trim() : "";
    contact.updatedBy = req.user._id;

    if (nowPrimary && !wasPrimary) {
      // Unmark all other contacts as primary
      await ClientContact.updateMany({ clientId }, { isPrimary: false });
    }

    await contact.save();

    // Sync primary contact fields
    if (contact.isPrimary) {
      await syncPrimaryContactToClient(client, contact);
    } else if (wasPrimary && !nowPrimary) {
      // If we unmarked the only primary contact, Client fields are kept as legacy fallback, but we update status
      client.updatedBy = req.user._id;
      await client.save();
    }

    // Log Audit
    await AuditLog.create({
      action: "CLIENT_CONTACT_UPDATED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, email: normalizedEmail, isPrimary: contact.isPrimary },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, contact });
  } catch (error) {
    console.error("Update Contact Error:", error);
    res.status(500).json({ success: false, message: "Error updating contact." });
  }
};

// 5. PATCH /api/clients/:clientId/contacts/:contactId/primary
exports.makeContactPrimary = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    // Unmark all other contacts
    await ClientContact.updateMany({ clientId }, { isPrimary: false });

    contact.isPrimary = true;
    contact.updatedBy = req.user._id;
    await contact.save();

    // Sync Client primary contact fields
    await syncPrimaryContactToClient(client, contact);

    // Log Audit
    await AuditLog.create({
      action: "CLIENT_CONTACT_MADE_PRIMARY",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, email: contact.email },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Contact is now primary.", contact });
  } catch (error) {
    console.error("Make Primary Contact Error:", error);
    res.status(500).json({ success: false, message: "Error setting primary contact." });
  }
};

// 6. PATCH /api/clients/:clientId/contacts/:contactId/status
exports.patchContactStatus = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return errorResponse(res, 400, "Invalid status values.", "INVALID_STATUS");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    if (!checkClientAccess(req, client)) {
      return errorResponse(res, 403, "Access denied.", "FORBIDDEN");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    contact.status = status;
    contact.updatedBy = req.user._id;
    await contact.save();

    // Log Audit
    await AuditLog.create({
      action: "CLIENT_CONTACT_STATUS_UPDATED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, contact });
  } catch (error) {
    console.error("Patch Contact Status Error:", error);
    res.status(500).json({ success: false, message: "Error updating contact status." });
  }
};

// 7. DELETE /api/clients/:clientId/contacts/:contactId
exports.deleteClientContact = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;

    // Only super_user is authorized to delete contacts
    if (req.user?.role !== "super_user") {
      return errorResponse(res, 403, "Only Super Users can delete contact records.", "FORBIDDEN");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    const isPrimary = contact.isPrimary;
    const email = contact.email;

    await ClientContact.deleteOne({ _id: contactId });

    // Log Audit
    await AuditLog.create({
      action: "CLIENT_CONTACT_DELETED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId, email, wasPrimary: isPrimary },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Contact deleted successfully." });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    res.status(500).json({ success: false, message: "Error deleting contact." });
  }
};

// 8. POST /api/clients/:clientId/contacts/:contactId/support-access
exports.enableContactSupportAccess = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;
    const { temporaryPassword } = req.body;

    if (!isSupportAdmin(req)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can configure support access.", "FORBIDDEN");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }
    if (client.status === "Archived") {
      return errorResponse(res, 400, "Cannot configure support access for archived client.", "CLIENT_ARCHIVED");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    const normalizedEmail = contact.email.toLowerCase();

    // Check duplicate email
    let supportUser = await User.findOne({ email: normalizedEmail });
    if (supportUser) {
      if (String(supportUser.clientId) === String(client._id)) {
        // Just link existing support account if matching
        contact.linkedSupportUser = supportUser._id;
        contact.supportAccessEnabled = true;
        await contact.save();

        // Ensure user is in client's supportUsers list
        const existsInClient = client.supportUsers.some(u => String(u.user) === String(supportUser._id));
        if (!existsInClient) {
          client.supportUsers.push({
            user: supportUser._id,
            isPrimary: contact.isPrimary,
            status: "Active",
            grantedAt: new Date(),
            grantedBy: req.user._id,
          });
          await client.save();
        }

        return res.json({ success: true, message: "Linked existing support user successfully.", supportUser });
      }
      return errorResponse(res, 400, "A support user account with this email already exists for another client profile.", "DUPLICATE_EMAIL");
    }

    // Password validation
    if (!temporaryPassword || temporaryPassword.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters long.", "WEAK_PASSWORD");
    }

    // Generate unique support ID
    const count = await User.countDocuments({ role: "support", clientId: { $ne: null } });
    const number = String(count + 1).padStart(3, "0");
    const firstName = String(contact.name).trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const uniqueId = `support_${firstName || "user"}_${number}`;

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    supportUser = new User({
      userId: uniqueId,
      name: contact.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "support",
      clientId: client._id,
      skipOnboarding: true,
    });
    await supportUser.save();

    // Link contact
    contact.linkedSupportUser = supportUser._id;
    contact.supportAccessEnabled = true;
    await contact.save();

    // Sync client supportUsers
    client.supportAccessEnabled = true;
    client.supportPortalStatus = "Active";
    
    const clientRefIdx = client.supportUsers.findIndex(u => String(u.user) === String(supportUser._id));
    if (clientRefIdx === -1) {
      client.supportUsers.push({
        user: supportUser._id,
        isPrimary: contact.isPrimary,
        status: "Active",
        grantedAt: new Date(),
        grantedBy: req.user._id,
      });
    } else {
      client.supportUsers[clientRefIdx].status = "Active";
    }
    await client.save();

    // Log Audit
    await AuditLog.create({
      action: "SUPPORT_ACCESS_ENABLED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, supportUserId: supportUser._id, email: normalizedEmail },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, message: "Support access enabled.", supportUser });
  } catch (error) {
    console.error("Enable Contact Support Access Error:", error);
    res.status(500).json({ success: false, message: "Error enabling support access." });
  }
};

// 9. PATCH /api/clients/:clientId/contacts/:contactId/support-access/suspend
exports.suspendContactSupportAccess = async (req, res) => {
  try {
    const { clientId, contactId } = req.params;

    if (!isSupportAdmin(req)) {
      return errorResponse(res, 403, "Access denied. Only Super User, Admin, or COO can configure support access.", "FORBIDDEN");
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    const contact = await ClientContact.findOne({ _id: contactId, clientId });
    if (!contact) {
      return errorResponse(res, 404, "Contact not found.", "CONTACT_NOT_FOUND");
    }

    if (!contact.linkedSupportUser) {
      return errorResponse(res, 400, "No linked support user found for this contact.", "NO_SUPPORT_USER");
    }

    const supportUser = await User.findById(contact.linkedSupportUser);
    if (supportUser) {
      supportUser.isDisabled = true;
      supportUser.disabledAt = new Date();
      supportUser.disabledBy = req.user._id;
      supportUser.disabledReason = "Suspended from Support Portal by administrator";
      await supportUser.save();
    }

    contact.supportAccessEnabled = false;
    await contact.save();

    // Sync client supportUsers
    const userRef = client.supportUsers.find(u => String(u.user) === String(contact.linkedSupportUser));
    if (userRef) {
      userRef.status = "Suspended";
    }
    await client.save();

    // Log Audit
    await AuditLog.create({
      action: "SUPPORT_ACCESS_SUSPENDED",
      performedBy: req.user._id,
      entityType: "Client",
      entityId: client._id,
      details: { clientId: client.clientId, contactId: contact._id, supportUserId: contact.linkedSupportUser },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Support access suspended successfully." });
  } catch (error) {
    console.error("Suspend Support Access Error:", error);
    res.status(500).json({ success: false, message: "Error suspending support access." });
  }
};
