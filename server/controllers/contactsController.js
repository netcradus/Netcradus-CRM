const Contact = require("../models/Contact");
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

// Helper to filter fields based on role and re-auth status
const filterContactFields = (contact, role, isReAuthed = false) => {
    const doc = contact.toObject();
    
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

    // Admin: Can see most things, but PII and Slips require re-auth
    if (role === 'admin') {
        const result = { ...doc };
        if (!isReAuthed) {
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
        const contacts = await Contact.find().sort({ createdAt: -1 });
        const filtered = contacts.map(c => filterContactFields(c, req.user.role, false)); // List view never sends re-authed data
        res.json(filtered);
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// Get a contact by ID (Standard access)
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        
        const filtered = filterContactFields(contact, req.user.role, false);
        res.json(filtered);
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// Get sensitive contact info (Requires Re-auth)
exports.getContactSensitive = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        // This route should be protected by checkReAuthToken middleware in routes
        const filtered = filterContactFields(contact, req.user.role, true);
        
        await AuditLog.create({
            action: "SENSITIVE_CONTACT_ACCESS",
            actorId: req.user.id,
            targetId: contact._id,
            metadata: { fields: ['PII', 'Salary', 'Slips'] },
            ip: req.ip
        });

        res.json(filtered);
    } catch (err) {
        res.status(500).send("Server Error");
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
