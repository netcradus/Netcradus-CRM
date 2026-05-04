const Contact = require("../models/Contact");
const SalarySlip = require("../models/SalarySlip");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const LeaveApplication = require("../models/LeaveApplication");
const mongoose = require("mongoose");
const { createNotifications } = require("../services/taskNotificationService");
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
const SELF_PROFILE_FIELDS = ["contactNumber", "address", "emergencyContactName", "emergencyContactNumber", "personalEmail"];
const STAFF_PROFILE_FIELDS = [
    "name",
    "email",
    "status",
    "department",
    "designation",
    "joiningDate",
    "leavingDate",
    "salary",
    "contactNumber",
    "address",
    "leaves",
    "isActive",
    "emergencyContactName",
    "emergencyContactNumber",
    "personalEmail",
];

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
    if (contactDoc) {
        const doc = toPlainContact(contactDoc);
        return {
            ...doc,
            linkedUser: doc.linkedUser || user._id,
        };
    }

    return {
        _id: `user-${user._id}`,
        sourceUserId: user._id,
        linkedUser: user._id,
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
        salarySlipsCount: 0,
        leaves: 0,
        contactNumber: "",
        address: "",
        emergencyContactName: "",
        emergencyContactNumber: "",
        personalEmail: "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

const ensureContactProfileForUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    let contact = await Contact.findOne({
        $or: [{ linkedUser: user._id }, { email: normalizeEmail(user.email) }],
    });

    if (!contact) {
        contact = await Contact.create({
            linkedUser: user._id,
            name: user.name,
            email: normalizeEmail(user.email),
            status: "Employee",
            department: user.department || "General",
            designation: formatRoleLabel(user.role || "employee"),
            joiningDate: user.createdAt,
            isActive: true,
        });
        return contact;
    }

    let shouldSave = false;
    if (!contact.linkedUser) {
        contact.linkedUser = user._id;
        shouldSave = true;
    }
    if (!contact.name && user.name) {
        contact.name = user.name;
        shouldSave = true;
    }
    if (normalizeEmail(contact.email) !== normalizeEmail(user.email)) {
        contact.email = normalizeEmail(user.email);
        shouldSave = true;
    }
    if (!contact.department && user.department) {
        contact.department = user.department;
        shouldSave = true;
    }
    if (!contact.designation && user.role) {
        contact.designation = formatRoleLabel(user.role);
        shouldSave = true;
    }

    if (shouldSave) {
        await contact.save();
    }

    return contact;
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

    if (mongoose?.Types?.ObjectId?.isValid?.(id)) {
        const linkedContact = await Contact.findOne({ linkedUser: id });
        if (linkedContact) return linkedContact;
    }

    if (id.includes("@")) {
        const linkedContact = await Contact.findOne({ email: normalizeEmail(id) });
        if (linkedContact) return linkedContact;
    }

    return null;
};

const getLinkedUserRole = async (contact) => {
    if (contact?.sourceUserId || contact?.linkedUser) {
        const user = await User.findById(contact.sourceUserId || contact.linkedUser).select("role").lean();
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

const getTodayLeaveWindow = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
};

const resolveLinkedUser = async (contact) => {
    if (contact?.sourceUserId || contact?.linkedUser) {
        return User.findById(contact.sourceUserId || contact.linkedUser).select("_id name email role department").lean();
    }

    if (contact?.email) {
        return User.findOne({ email: normalizeEmail(contact.email) }).select("_id name email role").lean();
    }

    return null;
};

const getTodayApprovedLeave = async (userId) => {
    if (!userId) return null;

    const { start, end } = getTodayLeaveWindow();

    return LeaveApplication.findOne({
        userId,
        status: "approved",
        from: { $lte: end },
        to: { $gte: start },
    })
        .populate("leaveTypeId", "name code")
        .sort({ from: 1 })
        .lean();
};

const toAmount = (value) => {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
};

const SALARY_SLIP_FIELDS = [
    "month",
    "year",
    "payDate",
    "basicSalary",
    "hra",
    "conveyance",
    "bonus",
    "specialAllowance",
    "providentFund",
    "professionalTax",
    "otherDeductions",
    "notes",
];

const buildSalarySlipRecord = (payload = {}, actorId) => {
    const basicSalary = toAmount(payload.basicSalary);
    const hra = toAmount(payload.hra);
    const conveyance = toAmount(payload.conveyance);
    const bonus = toAmount(payload.bonus);
    const specialAllowance = toAmount(payload.specialAllowance);
    const providentFund = toAmount(payload.providentFund);
    const professionalTax = toAmount(payload.professionalTax);
    const otherDeductions = toAmount(payload.otherDeductions);
    const grossPay = basicSalary + hra + conveyance + bonus + specialAllowance;
    const netPay = grossPay - (providentFund + professionalTax + otherDeductions);
    const month = String(payload.month || "").trim();
    const year = Number(payload.year);

    return {
        filename: `salary-slip-${month || "month"}-${year || new Date().getFullYear()}.pdf`,
        uploadedAt: new Date(),
        month,
        year: Number.isFinite(year) ? year : new Date().getFullYear(),
        payDate: payload.payDate ? new Date(payload.payDate) : new Date(),
        basicSalary,
        hra,
        conveyance,
        bonus,
        specialAllowance,
        providentFund,
        professionalTax,
        otherDeductions,
        grossPay,
        netPay,
        notes: String(payload.notes || "").trim(),
        generatedBy: actorId,
    };
};

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formatCurrencyForPdf = (value = 0) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const escapeHtml = (value = "") =>
    String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const escapePdfText = (value = "") =>
    String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\r/g, "")
        .replace(/\n/g, " ");

const buildPdfTextLines = (contact, slip) => {
    const payDate = slip.payDate ? new Date(slip.payDate).toLocaleDateString("en-IN") : "-";
    return [
        { text: "Salary Slip", size: 22, x: 50, y: 800 },
        { text: `${contact.name || "Employee"}`, size: 16, x: 50, y: 772 },
        {
            text: `${contact.designation || "Employee"} | ${contact.department || "General"}`,
            size: 11,
            x: 50,
            y: 754,
        },
        { text: `Month: ${slip.month || "-"} ${slip.year || ""}`, size: 11, x: 360, y: 800 },
        { text: `Pay Date: ${payDate}`, size: 11, x: 360, y: 782 },
        { text: `Email: ${contact.email || "-"}`, size: 11, x: 360, y: 764 },
        { text: "Earnings", size: 14, x: 50, y: 720 },
        { text: "Basic Salary", size: 11, x: 50, y: 696 },
        { text: formatCurrencyForPdf(slip.basicSalary), size: 11, x: 220, y: 696 },
        { text: "HRA", size: 11, x: 50, y: 676 },
        { text: formatCurrencyForPdf(slip.hra), size: 11, x: 220, y: 676 },
        { text: "Conveyance", size: 11, x: 50, y: 656 },
        { text: formatCurrencyForPdf(slip.conveyance), size: 11, x: 220, y: 656 },
        { text: "Bonus", size: 11, x: 50, y: 636 },
        { text: formatCurrencyForPdf(slip.bonus), size: 11, x: 220, y: 636 },
        { text: "Special Allowance", size: 11, x: 50, y: 616 },
        { text: formatCurrencyForPdf(slip.specialAllowance), size: 11, x: 220, y: 616 },
        { text: "Deductions", size: 14, x: 320, y: 720 },
        { text: "Provident Fund", size: 11, x: 320, y: 696 },
        { text: formatCurrencyForPdf(slip.providentFund), size: 11, x: 490, y: 696 },
        { text: "Professional Tax", size: 11, x: 320, y: 676 },
        { text: formatCurrencyForPdf(slip.professionalTax), size: 11, x: 490, y: 676 },
        { text: "Other Deductions", size: 11, x: 320, y: 656 },
        { text: formatCurrencyForPdf(slip.otherDeductions), size: 11, x: 490, y: 656 },
        { text: "Gross Pay", size: 13, x: 50, y: 570 },
        { text: formatCurrencyForPdf(slip.grossPay), size: 13, x: 180, y: 570 },
        { text: "Net Pay", size: 13, x: 320, y: 570 },
        { text: formatCurrencyForPdf(slip.netPay), size: 13, x: 430, y: 570 },
        { text: `Notes: ${slip.notes || "-"}`, size: 10, x: 50, y: 520 },
    ];
};

const renderSalarySlipPdfBuffer = (contact, slip) => {
    const lines = buildPdfTextLines(contact, slip);
    const content = [
        "BT",
        ...lines.map(
            (line) =>
                `/F1 ${line.size} Tf 1 0 0 1 ${line.x} ${line.y} Tm (${escapePdfText(line.text)}) Tj`
        ),
        "ET",
    ].join("\n");

    const objects = [];
    const addObject = (body) => {
        objects.push(body);
    };

    addObject("<< /Type /Catalog /Pages 2 0 R >>");
    addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>");
    addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    addObject(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((body, index) => {
        offsets.push(Buffer.byteLength(pdf, "utf8"));
        pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefStart = Buffer.byteLength(pdf, "utf8");
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(pdf, "utf8");
};

const sanitizeProfilePayload = (payload, allowedFields) =>
    allowedFields.reduce((acc, field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
            acc[field] = payload[field];
        }
        return acc;
    }, {});

const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    return Boolean(value);
};

const normalizeProfileValues = (payload = {}) => {
    const next = { ...payload };
    ["joiningDate", "leavingDate"].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(next, field)) {
            next[field] = next[field] ? new Date(next[field]) : null;
        }
    });

    if (Object.prototype.hasOwnProperty.call(next, "salary")) {
        next.salary = next.salary === "" || next.salary === null ? null : Number(next.salary);
    }

    if (Object.prototype.hasOwnProperty.call(next, "leaves")) {
        next.leaves = next.leaves === "" || next.leaves === null ? 0 : Number(next.leaves);
    }

    if (Object.prototype.hasOwnProperty.call(next, "isActive")) {
        next.isActive = toBoolean(next.isActive);
    }

    if (Object.prototype.hasOwnProperty.call(next, "email")) {
        next.email = normalizeEmail(next.email);
    }

    if (Object.prototype.hasOwnProperty.call(next, "personalEmail")) {
        next.personalEmail = normalizeEmail(next.personalEmail);
    }

    return next;
};

const serializeEmployeeProfile = async (contact) => {
    const linkedUser = await resolveLinkedUser(contact);
    const doc = toPlainContact(contact);

    return {
        ...doc,
        linkedUser: linkedUser
            ? {
                  _id: linkedUser._id,
                  name: linkedUser.name,
                  email: linkedUser.email,
                  role: linkedUser.role,
                  department: linkedUser.department,
              }
            : null,
    };
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
        const linkedUser = await resolveLinkedUser(contact);
        const liveLeave = await getTodayApprovedLeave(linkedUser?._id);
        const auditTargetId = contact.sourceUserId || contact._id;

        if (liveLeave) {
            filtered.leaves = liveLeave.totalDays || 1;
            filtered.leaveToday = {
                isOnLeave: true,
                leaveType: liveLeave.leaveTypeId?.name || "Leave",
                from: liveLeave.from,
                to: liveLeave.to,
                totalDays: liveLeave.totalDays || 1,
                isHalfDay: !!liveLeave.isHalfDay,
            };
        } else {
            filtered.leaveToday = {
                isOnLeave: false,
            };
        }

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

        const salarySlips = await SalarySlip.find({ contactId: contact._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                contactId: contact._id,
                contactName: contact.name,
                salarySlips: salarySlips.map(slip => ({
                    _id: slip._id,
                    filename: slip.filename,
                    uploadedAt: slip.uploadedAt,
                    month: slip.month,
                    year: slip.year,
                    netPay: slip.netPay
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.downloadSalarySlip = async (req, res) => {
    try {
        const salarySlip = await SalarySlip.findById(req.params.id);
        if (!salarySlip) return res.status(404).json({ message: "Salary slip not found." });

        const contact = await resolveContactRecord(salarySlip.contactId);
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        if (!canAccessSalarySlips(req.user, contact)) {
            return res.status(403).json({ message: "You are not allowed to download this salary slip." });
        }

        if (salarySlip.path) {
            const resolvedPath = path.resolve(salarySlip.path || "");
            if (!resolvedPath || !fs.existsSync(resolvedPath)) {
                return res.status(404).json({ message: "Salary slip file is missing." });
            }

            return res.download(resolvedPath, salarySlip.filename || path.basename(resolvedPath));
        }

        const pdfBuffer = renderSalarySlipPdfBuffer(contact, salarySlip);
        const downloadName = (salarySlip.filename || `salary-slip-${salarySlip.month}-${salarySlip.year}.pdf`).replace(/\.html$/i, ".pdf");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.generateSalarySlip = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "super_user") {
            return res.status(403).json({ message: "Super Admin salary slips are not managed here" });
        }

        const payload = sanitizeProfilePayload(req.body || {}, SALARY_SLIP_FIELDS);
        if (!payload.month || !payload.year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const contact = await ensureContactProfileForUser(user._id);
        if (!contact) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        const slipData = {
            ...payload,
            contactId: contact._id,
            generatedBy: req.user._id
        };
        const newSlip = new SalarySlip(slipData);
        await newSlip.save();

        try {
            await createNotifications({
                userIds: [user._id],
                message: `Your salary slip for ${newSlip.month} ${newSlip.year} is now available.`,
                targetPath: "/my-profile",
            });
        } catch (notificationError) {
            console.error("Salary Slip Notification Error:", notificationError);
        }

        res.json({
            message: `Salary slip generated for ${contact.name}`,
            slip: newSlip,
        });
    } catch (err) {
        console.error("Generate Salary Slip Error:", err);
        res.status(400).json({ message: err.message || "Unable to generate salary slip" });
    }
};

exports.listEmployeeProfiles = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: "super_user" } }).sort({ createdAt: -1 });
        const profiles = await Promise.all(
            users.map(async (user) => {
                const contact = await ensureContactProfileForUser(user._id);
                return serializeEmployeeProfile(contact);
            })
        );

        res.json(profiles);
    } catch (err) {
        console.error("List Employee Profiles Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const contact = await ensureContactProfileForUser(req.user._id);
        if (!contact) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json(await serializeEmployeeProfile(contact));
    } catch (err) {
        console.error("Get My Profile Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const updates = normalizeProfileValues(
            sanitizeProfilePayload(req.body || {}, SELF_PROFILE_FIELDS)
        );
        const contact = await ensureContactProfileForUser(req.user._id);

        if (!contact) {
            return res.status(404).json({ message: "Profile not found" });
        }

        Object.assign(contact, updates);
        await contact.save();

        res.json({
            message: "Your profile has been updated",
            profile: await serializeEmployeeProfile(contact),
        });
    } catch (err) {
        console.error("Update My Profile Error:", err);
        res.status(400).json({ message: err.message || "Unable to update profile" });
    }
};

exports.updateEmployeeProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "super_user") {
            return res.status(403).json({ message: "Super Admin profile cannot be edited here" });
        }

        const updates = normalizeProfileValues(
            sanitizeProfilePayload(req.body || {}, STAFF_PROFILE_FIELDS)
        );
        const contact = await ensureContactProfileForUser(user._id);

        if (!contact) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        Object.assign(contact, updates);
        contact.linkedUser = user._id;

        if (updates.email && updates.email !== user.email) {
            const existingUser = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ message: "That email is already in use by another user" });
            }
            user.email = updates.email;
        }

        if (updates.name) {
            user.name = updates.name;
        }

        if (updates.department) {
            user.department = updates.department;
        }

        await Promise.all([contact.save(), user.save()]);

        res.json({
            message: `${user.name}'s profile has been updated`,
            profile: await serializeEmployeeProfile(contact),
        });
    } catch (err) {
        console.error("Update Employee Profile Error:", err);
        res.status(400).json({ message: err.message || "Unable to update employee profile" });
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
