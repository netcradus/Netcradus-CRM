const Contact = require("../models/Contact");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Config for private uploads (Salary Slips)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/private/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `slip-${Date.now()}-${file.originalname}`);
    }
});

const uploadPrivate = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|jpg|png|jpeg/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error("Only PDF, JPG, PNG are allowed"));
    }
});

const PRIVILEGED_CONTACT_ROLES = new Set(["admin", "hr", "super_user"]);

const normalizeRole = (value = "") => String(value || "").trim().toLowerCase();
const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const canAccessAnySalarySlip = (user) => PRIVILEGED_CONTACT_ROLES.has(normalizeRole(user?.role));
const isOwnContact = (user, contact) =>
    normalizeEmail(user?.email) && normalizeEmail(user?.email) === normalizeEmail(contact?.email);

const canAccessSalarySlips = (user, contact) =>
    canAccessAnySalarySlip(user) || isOwnContact(user, contact);

const HR_HIDDEN_ROLES = new Set(["admin", "super_user"]);

const formatRoleLabel = (role = "") =>
    String(role || "")
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const toPlainContact = (contact) =>
    typeof contact?.toObject === "function" ? contact.toObject() : { ...contact };

const buildContactFromUser = (user, contactDoc) => {
    if (contactDoc) return toPlainContact(contactDoc);

    return {
        _id: `user-${user._id}`,
        sourceUserId: user._id,
        name: user.name,
        email: user.email,
        status: "Employee",
        department: user.department || "General",
        designation: formatRoleLabel(user.role || "employee"),
        joiningDate: user.createdAt,
        leavingDate: null,
        interviewSchedule: null,
        isActive: true,
        salary: null,
        salarySlips: [],
        leaves: 0,
        contactNumber: "",
        address: "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

const resolveContactRecord = async (identifier) => {
    const id = String(identifier || "");

    if (id.startsWith("user-")) {
        const userId = id.replace("user-", "");
        const user = await User.findById(userId).lean();
        if (!user) return null;

        const linkedContact = await Contact.findOne({ email: normalizeEmail(user.email) });
        return buildContactFromUser(user, linkedContact);
    }

    const contact = await Contact.findById(id);
    if (contact) return contact;

    if (id.includes("@")) {
        const linkedContact = await Contact.findOne({ email: normalizeEmail(id) });
        if (linkedContact) return linkedContact;
    }

    return null;
};

const getLinkedUserRole = async (contact) => {
    if (contact?.sourceUserId) {
        const user = await User.findById(contact.sourceUserId).select("role").lean();
        return normalizeRole(user?.role);
    }

    if (contact?.email) {
        const user = await User.findOne({ email: normalizeEmail(contact.email) }).select("role").lean();
        return normalizeRole(user?.role);
    }

    return "";
};

const canViewerAccessContact = (viewerRole, targetRole) => {
    if (normalizeRole(viewerRole) === "hr" && HR_HIDDEN_ROLES.has(normalizeRole(targetRole))) {
        return false;
    }

    return true;
};

// Helper to filter fields based on role and re-auth status
const filterContactFields = (contact, role, isReAuthed = false) => {
    const doc = toPlainContact(contact);
    
    // Management: Highly restricted
    if (role === 'management') {
        return {
            _id: doc._id,
            name: doc.name,
            email: doc.email,
            status: doc.status,
            department: doc.department,
            designation: doc.designation,
            joiningDate: doc.joiningDate,
            leavingDate: doc.leavingDate,
            isActive: doc.isActive
        };
    }

    // Admin and HR: Can see most things, but PII and slips require re-auth
    if (role === 'admin' || role === 'hr') {
        const result = { ...doc };
        if (!isReAuthed) {
            result.salary = "********";
            result.contactNumber = "********";
            result.address = "********";
            result.salarySlips = doc.salarySlips ? doc.salarySlips.length : 0; // Just return count
        }
        return result;
    }

    // Super User: Sees all, but still masks PII/Slips if not re-authed (per user requirement)
    if (role === 'super_user') {
        const result = { ...doc };
        if (!isReAuthed) {
            result.contactNumber = "********";
            result.address = "********";
            result.salary = "********";
            result.salarySlips = doc.salarySlips ? doc.salarySlips.length : 0;
        }
        return result;
    }

    return doc;
};

// Get all contacts
exports.getContacts = async (req, res) => {
    try {
        const [contacts, users] = await Promise.all([
            Contact.find().sort({ createdAt: -1 }),
            User.find({}).sort({ createdAt: -1 }).lean()
        ]);
        const viewerRole = normalizeRole(req.user.role);

        const contactsByEmail = new Map(
            contacts.map((contact) => [normalizeEmail(contact.email), contact])
        );
        const userRoleByEmail = new Map(
            users.map((user) => [normalizeEmail(user.email), normalizeRole(user.role)])
        );

        const mergedContacts = [];
        const seenEmails = new Set();

        users.forEach((user) => {
            const email = normalizeEmail(user.email);
            if (!canViewerAccessContact(viewerRole, user.role)) {
                seenEmails.add(email);
                return;
            }
            const merged = buildContactFromUser(user, contactsByEmail.get(email));
            mergedContacts.push(merged);
            seenEmails.add(email);
        });

        contacts.forEach((contact) => {
            const email = normalizeEmail(contact.email);
            const linkedRole = userRoleByEmail.get(email);
            if (!seenEmails.has(email) && canViewerAccessContact(viewerRole, linkedRole)) {
                mergedContacts.push(toPlainContact(contact));
            }
        });

        const filtered = mergedContacts.map((c) => filterContactFields(c, req.user.role, false));
        res.json(filtered);
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// Get a contact by ID (Standard access)
exports.getContactById = async (req, res) => {
    try {
        const contact = await resolveContactRecord(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        const linkedRole = await getLinkedUserRole(contact);
        if (!canViewerAccessContact(req.user.role, linkedRole)) {
            return res.status(403).json({ message: "You are not allowed to view this contact." });
        }
        
        const filtered = filterContactFields(contact, req.user.role, false);
        res.json(filtered);
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// Get sensitive contact info (Requires Re-auth)
exports.getContactSensitive = async (req, res) => {
    try {
        const contact = await resolveContactRecord(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        const linkedRole = await getLinkedUserRole(contact);
        if (!canViewerAccessContact(req.user.role, linkedRole)) {
            return res.status(403).json({ message: "You are not allowed to unlock this contact." });
        }

        // This route should be protected by checkReAuthToken middleware in routes
        const filtered = filterContactFields(contact, req.user.role, true);
        const auditTargetId = contact.sourceUserId || contact._id;

        try {
            await AuditLog.create({
                action: "SENSITIVE_CONTACT_ACCESS",
                performedBy: req.user._id,
                targetId: auditTargetId,
                details: { fields: ["PII", "Salary", "Slips"] },
                ipAddress: req.ip
            });
        } catch (auditError) {
            console.error("Sensitive contact audit log failed:", auditError);
        }

        res.json(filtered);
    } catch (err) {
        console.error("Sensitive Contact Error:", err);
        res.status(500).send("Server Error");
    }
};

exports.getSalarySlipList = async (req, res) => {
    try {
        const contact = await resolveContactRecord(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        if (!canAccessSalarySlips(req.user, contact)) {
            return res.status(403).json({ message: "You are not allowed to view these salary slips." });
        }

        const salarySlips = (contact.salarySlips || []).map((slip, index) => ({
            index,
            filename: slip.filename,
            uploadedAt: slip.uploadedAt,
        }));

        res.json({
            success: true,
            data: {
                contactId: contact._id,
                contactName: contact.name,
                salarySlips,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.downloadSalarySlip = async (req, res) => {
    try {
        const contact = await resolveContactRecord(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        if (!canAccessSalarySlips(req.user, contact)) {
            return res.status(403).json({ message: "You are not allowed to download this salary slip." });
        }

        const index = Number.parseInt(req.params.index, 10);
        const salarySlip = contact.salarySlips?.[index];

        if (!Number.isInteger(index) || !salarySlip) {
            return res.status(404).json({ message: "Salary slip not found." });
        }

        const resolvedPath = path.resolve(salarySlip.path || "");
        if (!resolvedPath || !fs.existsSync(resolvedPath)) {
            return res.status(404).json({ message: "Salary slip file is missing." });
        }

        res.download(resolvedPath, salarySlip.filename || path.basename(resolvedPath));
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Create a new contact
exports.createContact = async (req, res) => {
    try {
        const { leavingDate } = req.body;
        const newContact = new Contact(req.body);
        
        if (leavingDate) {
            newContact.isActive = false;
            newContact.status = "Ex-Employee";
        }

        const savedContact = await newContact.save();
        res.json(savedContact);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a contact
exports.updateContact = async (req, res) => {
    try {
        const { leavingDate } = req.body;
        
        if (leavingDate) {
            req.body.isActive = false;
            req.body.status = "Ex-Employee";
        }

        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        
        res.json(contact);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a contact
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        res.json({ message: "Contact deleted successfully" });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

exports.uploadPrivate = uploadPrivate;
