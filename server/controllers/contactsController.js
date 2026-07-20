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
const PDFDocument = require("pdfkit");

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
const SELF_PROFILE_FIELDS = ["contactNumber", "address", "emergencyContactName", "emergencyContactNumber", "personalEmail", "emergencyContact", "dob", "bloodGroup", "profilePhoto"];
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
    "emergencyContact",
    "employeeStatus",
    "employmentType",
    "probationEndDate",
    "noticePeriodDays",
    "offeredSalary",
    "aadhaarNumber",
    "panNumber",
    "uanNumber",
    "esicNumber",
    "reportsTo",
    "bankDetails",
    "dob",
    "bloodGroup",
    "profilePhoto",
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
    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};

// --- Number → Indian words ----------------------------------------------------
const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
              "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
              "Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

const numToWords = (n) => {
    n = Math.floor(Math.abs(n));
    if (n === 0) return "Zero";
    const chunk = (num) => {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + chunk(num % 100) : "");
    };
    const parts = [];
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh  = Math.floor(n / 100000);   n %= 100000;
    const thou  = Math.floor(n / 1000);     n %= 1000;
    if (crore) parts.push(chunk(crore) + " Crore");
    if (lakh)  parts.push(chunk(lakh)  + " Lakh");
    if (thou)  parts.push(chunk(thou)  + " Thousand");
    if (n)     parts.push(chunk(n));
    return parts.join(" ");
};

const netPayInWords = (amount) => {
    const rupees = Math.floor(amount);
    const paise  = Math.round((amount - rupees) * 100);
    let result   = numToWords(rupees) + " Rupees";
    if (paise) result += " and " + numToWords(paise) + " Paise";
    return result + " Only";
};

const DEPT_SALES = "sales";
const DEPT_IT    = "it";
const normDept   = (d) => String(d || "").toLowerCase().trim();

// All fields accepted from the frontend for a new salary slip
const SALARY_SLIP_FIELDS = [
    // Period
    "month", "year", "payDate",
    // Department
    "department",
    // Common earnings
    "basicSalary", "hra", "dearnessAllowance", "specialAllowance", "otherEarnings",
    // Sales-specific
    "travelAllowance", "salesIncentive", "commission", "commissionRate",
    "monthlyTarget", "achievedSales",
    "targetAchievementBonus", "clientAcquisitionBonus", "performanceBonus",
    // IT-specific
    "conveyance", "technicalAllowance", "internetAllowance",
    "wfhAllowance", "nightShiftAllowance", "onCallAllowance",
    "overtimePay", "projectCompletionBonus",
    // Deductions (PF intentionally excluded from new slips)
    "professionalTax", "otherDeductions",
    // Attendance
    "workingDays", "paidDays", "lopDays",
    // Payment info
    "paymentMode", "bankAccountLast4",
    // Misc
    "notes",
];

/**
 * Department-aware salary slip calculator.
 * Computes grossPay, lopDeduction, totalDeductions, netPay on the server;
 * never trusts frontend-supplied totals.
 */
const buildSalarySlipRecord = (payload = {}, actorId) => {
    const dept = normDept(payload.department);
    const month = String(payload.month || "").trim();
    const year  = Number(payload.year);

    // -- Common earnings ----------------------------------------------------
    const basicSalary       = toAmount(payload.basicSalary);
    const hra               = toAmount(payload.hra);
    const dearnessAllowance = toAmount(payload.dearnessAllowance);
    const specialAllowance  = toAmount(payload.specialAllowance);
    const otherEarnings     = toAmount(payload.otherEarnings);

    // -- Sales earnings -----------------------------------------------------
    const travelAllowance        = toAmount(payload.travelAllowance);
    const salesIncentive         = toAmount(payload.salesIncentive);
    const achievedSales          = toAmount(payload.achievedSales);
    const commissionRate         = Math.min(100, Math.max(0, toAmount(payload.commissionRate)));
    const commissionOverride     = toAmount(payload.commission);
    const commission = (achievedSales > 0 && commissionRate > 0)
        ? parseFloat((achievedSales * commissionRate / 100).toFixed(2))
        : commissionOverride;
    const monthlyTarget          = toAmount(payload.monthlyTarget);
    const targetAchievementBonus = toAmount(payload.targetAchievementBonus);
    const clientAcquisitionBonus = toAmount(payload.clientAcquisitionBonus);
    const performanceBonus       = toAmount(payload.performanceBonus);

    // -- IT earnings --------------------------------------------------------
    const conveyance             = toAmount(payload.conveyance);
    const technicalAllowance     = toAmount(payload.technicalAllowance);
    const internetAllowance      = toAmount(payload.internetAllowance);
    const wfhAllowance           = toAmount(payload.wfhAllowance);
    const nightShiftAllowance    = toAmount(payload.nightShiftAllowance);
    const onCallAllowance        = toAmount(payload.onCallAllowance);
    const overtimePay            = toAmount(payload.overtimePay);
    const projectCompletionBonus = toAmount(payload.projectCompletionBonus);

    // -- Gross Pay (department-specific formula) ----------------------------
    let grossPay;
    if (dept === DEPT_SALES) {
        grossPay = basicSalary + hra + dearnessAllowance + specialAllowance + otherEarnings
            + travelAllowance + salesIncentive + commission
            + targetAchievementBonus + clientAcquisitionBonus + performanceBonus;
    } else if (dept === DEPT_IT) {
        grossPay = basicSalary + hra + dearnessAllowance + specialAllowance + otherEarnings
            + conveyance + technicalAllowance + internetAllowance
            + wfhAllowance + nightShiftAllowance + onCallAllowance
            + overtimePay + projectCompletionBonus + performanceBonus;
    } else {
        // Default / Other departments
        grossPay = basicSalary + hra + dearnessAllowance + specialAllowance + otherEarnings + conveyance;
    }
    grossPay = parseFloat(grossPay.toFixed(2));

    // -- Attendance & LOP --------------------------------------------------
    const workingDays = Math.max(0, Math.round(toAmount(payload.workingDays)));
    const lopDays     = Math.max(0, Math.round(toAmount(payload.lopDays)));
    const paidDays    = Math.max(0, Math.round(toAmount(payload.paidDays)));
    const lopDeduction = (workingDays > 0 && lopDays > 0)
        ? parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
        : 0;

    // -- Deductions (PF excluded from all new slips) -----------------------
    const professionalTax = toAmount(payload.professionalTax);
    const otherDeductions = toAmount(payload.otherDeductions);
    const totalDeductions = parseFloat((professionalTax + otherDeductions + lopDeduction).toFixed(2));
    const netPay          = parseFloat((grossPay - totalDeductions).toFixed(2));

    return {
        filename: `salary-slip-${month || "month"}-${year || new Date().getFullYear()}.pdf`,
        uploadedAt: new Date(),
        month,
        year:  Number.isFinite(year) ? year : new Date().getFullYear(),
        payDate: payload.payDate ? new Date(payload.payDate) : new Date(),
        department: String(payload.department || "").trim(),
        // Common
        basicSalary, hra, dearnessAllowance, specialAllowance, otherEarnings,
        // Sales
        travelAllowance, salesIncentive, commission, commissionRate,
        monthlyTarget, achievedSales,
        targetAchievementBonus, clientAcquisitionBonus, performanceBonus,
        // IT
        conveyance, technicalAllowance, internetAllowance,
        wfhAllowance, nightShiftAllowance, onCallAllowance,
        overtimePay, projectCompletionBonus,
        // Deductions
        professionalTax, otherDeductions, lopDeduction,
        // Attendance
        workingDays, paidDays, lopDays,
        // Payment
        paymentMode:      String(payload.paymentMode || "").trim(),
        bankAccountLast4: String(payload.bankAccountLast4 || "").trim(),
        // Totals
        grossPay, totalDeductions, netPay,
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

// Resolve the logo once at module load time; gracefully skip if file is absent.
const LOGO_PATH = path.resolve(__dirname, "../../client/public/LOGO.png");
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

const inrFmt = (value = 0) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

/**
 * Generates a professional A4 salary slip PDF using PDFKit.
 * Returns a Promise<Buffer>.
 */
const renderSalarySlipPdfBuffer = (contact, slip) => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 0 });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end",  () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // -- Palette ------------------------------------------------------------
        const BRAND_DARK   = "#1a1a2e";
        const BRAND_MID    = "#16213e";
        const BRAND_ACCENT = "#e94560";
        const TEXT_LIGHT   = "#ffffff";
        const TEXT_DARK    = "#1a1a2e";
        const TEXT_MUTED   = "#555555";
        const ROW_ALT      = "#f5f5f5";
        const ROW_WHITE    = "#ffffff";
        const BORDER       = "#dddddd";

        const PAGE_W = doc.page.width;   // 595.28
        const MARGIN = 45;
        const COL_W  = (PAGE_W - MARGIN * 2) / 2;

        const dept = normDept(slip.department || contact.department);

        // -- Helpers ------------------------------------------------------------
        const fillRect = (x, y, w, h, color) =>
            doc.save().rect(x, y, w, h).fill(color).restore();

        const strokeRect = (x, y, w, h, color, lw = 0.5) =>
            doc.save().lineWidth(lw).rect(x, y, w, h).stroke(color).restore();

        const cell = (text, x, y, w, h, opts = {}) => {
            const { fontSize = 9, color = TEXT_DARK, align = "left", bold = false, padding = 6 } = opts;
            doc.font(bold ? "Helvetica-Bold" : "Helvetica")
               .fontSize(fontSize)
               .fillColor(color)
               .text(String(text ?? ""), x + padding, y + padding, {
                   width: w - padding * 2, height: h, align, lineBreak: false,
               });
        };

        // -- HEADER BAND --------------------------------------------------------
        const HEADER_H = 120;
        fillRect(0, 0, PAGE_W, HEADER_H, BRAND_DARK);

        doc.save()
           .lineWidth(0.5)
           .strokeColor("#e9456022");
        for (let i = 0; i < 6; i++) {
            const offset = i * 7;
            doc.moveTo(PAGE_W - 90 + offset, 0)
               .quadraticCurveTo(PAGE_W - 35, HEADER_H / 2, PAGE_W - offset, HEADER_H)
               .stroke();
        }
        doc.restore();

        fillRect(0, HEADER_H - 3, PAGE_W, 3, BRAND_ACCENT);

        const BOX_SIZE = 70;
        const BOX_X = MARGIN;
        const BOX_Y = (HEADER_H - BOX_SIZE - 3) / 2;

        doc.save()
           .lineWidth(1)
           .roundedRect(BOX_X, BOX_Y, BOX_SIZE, BOX_SIZE, 8)
           .stroke("#ffffff88")
           .restore();

        if (LOGO_EXISTS) {
            try {
                const LOGO_MAX = 56;
                doc.image(LOGO_PATH, BOX_X + 7, BOX_Y + 7, {
                    fit: [LOGO_MAX, LOGO_MAX],
                    align: "center",
                    valign: "center"
                });
            } catch (err) {
                doc.font("Helvetica").fontSize(7.5).fillColor("#cccccc")
                   .text("Company Logo", BOX_X + 2, BOX_Y + 31, { width: BOX_SIZE - 4, align: "center" });
            }
        } else {
            doc.font("Helvetica").fontSize(7.5).fillColor("#cccccc")
                   .text("Company Logo", BOX_X + 2, BOX_Y + 31, { width: BOX_SIZE - 4, align: "center" });
        }

        const textStartX = BOX_X + BOX_SIZE + 18;

        doc.font("Helvetica-Bold").fontSize(19).fillColor(TEXT_LIGHT)
           .text("Employee Salary Slip", textStartX, BOX_Y + 14, { lineBreak: false });

        const subY = BOX_Y + 41;
        doc.font("Helvetica").fontSize(7.5).fillColor("#a0a0b0")
           .text("-  CONFIDENTIAL", textStartX, subY, { continued: true });
        doc.font("Helvetica-Bold").fillColor(BRAND_ACCENT)
           .text("  *  ", { continued: true });
        doc.font("Helvetica").fillColor("#a0a0b0")
           .text("PREPARED FOR EMPLOYEE USE ONLY");

        const BADGE_W = 95;
        const BADGE_H = 20;
        const BADGE_X = PAGE_W - MARGIN - BADGE_W;
        const BADGE_Y = BOX_Y + 10;

        doc.save()
           .fillColor(BRAND_ACCENT)
           .roundedRect(BADGE_X, BADGE_Y, BADGE_W, BADGE_H, 10)
           .fill()
           .restore();

        const iconX = BADGE_X + 10;
        const iconY = BADGE_Y + 5;
        const iconS = 9;
        doc.save()
           .lineWidth(1)
           .strokeColor(TEXT_LIGHT)
           .rect(iconX, iconY, iconS, iconS)
           .stroke();
        doc.save()
           .fillColor(TEXT_LIGHT)
           .rect(iconX + 2, iconY - 2, 1.5, 3)
           .rect(iconX + 5.5, iconY - 2, 1.5, 3)
           .fill()
           .restore();

        const monthLabel = String(slip.month || "").toUpperCase() + " " + (slip.year || "");
        doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_LIGHT)
           .text(monthLabel, BADGE_X + 23, BADGE_Y + 6, { width: BADGE_W - 25, align: "left" });

        const DIVIDER_X = BADGE_X - 18;
        fillRect(DIVIDER_X, BOX_Y + 8, 0.75, 38, "#ffffff44");

        const payDateStr = slip.payDate
            ? new Date(slip.payDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
            : "-";
        const DATE_Y = BADGE_Y + 28;
        doc.font("Helvetica").fontSize(8).fillColor("#cccccc")
           .text("Pay Date: ", BADGE_X - 4, DATE_Y, { continued: true })
           .font("Helvetica-Bold").fillColor(TEXT_LIGHT)
           .text(payDateStr);

        let curY = HEADER_H + 18;

        // -- EMPLOYEE DETAILS ---------------------------------------------------
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND_ACCENT)
           .text("EMPLOYEE DETAILS", MARGIN, curY);
        curY += 14;
        fillRect(0, curY - 1, PAGE_W, 0.5, BRAND_ACCENT);
        curY += 6;

        let linkedUser = null;
        let managerName = null;
        try {
            if (contact.linkedUser || contact.sourceUserId) {
                linkedUser = await User.findById(contact.linkedUser || contact.sourceUserId).lean();
                if (linkedUser?.reportsTo) {
                    const manager = await User.findById(linkedUser.reportsTo).select("name").lean();
                    if (manager?.name) {
                        managerName = manager.name;
                    }
                }
            }
        } catch (err) {
            console.error("PDF generation user resolve error:", err);
        }

        const maskMobileNumber = (numStr) => {
            if (!numStr) return "Not Provided";
            const cleanNum = String(numStr).replace(/\D/g, "");
            if (cleanNum.length < 3) return "Not Provided";
            const last3 = cleanNum.slice(-3);
            return `+91 XXXXXXX${last3}`;
        };

        const employeeId = slip.employeeId || contact.employeeId || linkedUser?.userId || "N/A";
        const mobileNumberRaw = contact.contactNumber || linkedUser?.contactNumber;
        const maskedMobile = maskMobileNumber(mobileNumberRaw);

        // Optional fields formatting
        const joiningDateVal = contact.joiningDate || linkedUser?.joiningDate;
        const joiningDateStr = joiningDateVal
            ? new Date(joiningDateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
            : null;

        const officeLocation = contact.officeLocation || linkedUser?.officeLocation || contact.workLocation || linkedUser?.workLocation;
        const employmentType = contact.employmentType || linkedUser?.employmentType;

        const maskedBank = slip.bankAccountLast4
            ? `XXXX XXXX XXXX ${slip.bankAccountLast4}`
            : "-";

        const detailRows = [
            ["Name",         contact.name        || "-",  "Department",    contact.department  || "-"        ],
            ["Designation",  contact.designation || "-",  "Email",         contact.email       || "-"        ],
            ["Employee ID",  employeeId,                  "Mobile Number", maskedMobile                      ],
        ];

        if (joiningDateStr) {
            detailRows.push(["Date of Joining", joiningDateStr, "Employment Type", employmentType || "-"]);
        }
        if (managerName) {
            detailRows.push(["Reporting Manager", managerName, "Office Location", officeLocation || "-"]);
        } else if (officeLocation || employmentType) {
            detailRows.push(["Office Location", officeLocation || "-", "Employment Type", employmentType || "-"]);
        }

        detailRows.push(
            ["Working Days", String(slip.workingDays || 0), "Paid Days",   String(slip.paidDays || 0)        ],
            ["Payment Mode", slip.paymentMode     || "-",  "Bank Account",  maskedBank                       ]
        );

        const DET_H  = 22;
        const DET_W1 = 95;
        const DET_W2 = COL_W - DET_W1;

        detailRows.forEach((row, ri) => {
            const rowY = curY + ri * DET_H;
            const bg   = ri % 2 === 0 ? ROW_WHITE : ROW_ALT;
            fillRect(MARGIN, rowY, PAGE_W - MARGIN * 2, DET_H, bg);
            cell(row[0], MARGIN,                  rowY, DET_W1, DET_H, { bold: true,  color: TEXT_MUTED, fontSize: 8 });
            cell(row[1], MARGIN + DET_W1,         rowY, DET_W2, DET_H, { color: TEXT_DARK, fontSize: 9 });
            cell(row[2], MARGIN + COL_W,          rowY, DET_W1, DET_H, { bold: true,  color: TEXT_MUTED, fontSize: 8 });
            cell(row[3], MARGIN + COL_W + DET_W1, rowY, DET_W2, DET_H, { color: TEXT_DARK, fontSize: 9 });
            strokeRect(MARGIN, rowY, PAGE_W - MARGIN * 2, DET_H, BORDER);
        });

        curY += detailRows.length * DET_H + 20;

        // -- EARNINGS & DEDUCTIONS ----------------------------------------------
        const TABLE_GAP = 16;
        const HALF_W    = (PAGE_W - MARGIN * 2 - TABLE_GAP) / 2;
        const EARN_X    = MARGIN;
        const DED_X     = MARGIN + HALF_W + TABLE_GAP;
        const COL_LABEL = HALF_W * 0.63;
        const COL_AMT   = HALF_W - COL_LABEL;
        const ROW_H     = 23;
        const HEAD_H    = 26;

        // Build department-specific earning rows
        let earningsRows;
        if (dept === DEPT_SALES) {
            earningsRows = [
                ["Basic Salary",             slip.basicSalary            ],
                ["HRA",                      slip.hra                    ],
                ["Dearness Allowance",       slip.dearnessAllowance      ],
                ["Special Allowance",        slip.specialAllowance       ],
                ["Travel Allowance",         slip.travelAllowance        ],
                ["Sales Incentive",          slip.salesIncentive         ],
                ["Commission",               slip.commission             ],
                ["Target Achievement Bonus", slip.targetAchievementBonus ],
                ["Client Acquisition Bonus", slip.clientAcquisitionBonus ],
                ["Performance Bonus",        slip.performanceBonus       ],
                ["Other Earnings",           slip.otherEarnings          ],
            ].filter(r => Number(r[1]) > 0 || r[0] === "Basic Salary");
        } else if (dept === DEPT_IT) {
            earningsRows = [
                ["Basic Salary",          slip.basicSalary           ],
                ["HRA",                   slip.hra                   ],
                ["Dearness Allowance",    slip.dearnessAllowance     ],
                ["Special Allowance",     slip.specialAllowance      ],
                ["Conveyance",            slip.conveyance            ],
                ["Technical Allowance",   slip.technicalAllowance    ],
                ["Internet Allowance",    slip.internetAllowance     ],
                ["WFH Allowance",         slip.wfhAllowance          ],
                ["Night Shift Allowance", slip.nightShiftAllowance   ],
                ["On-call Allowance",     slip.onCallAllowance       ],
                ["Overtime Pay",          slip.overtimePay           ],
                ["Project Completion Bonus", slip.projectCompletionBonus],
                ["Performance Bonus",     slip.performanceBonus      ],
                ["Other Earnings",        slip.otherEarnings         ],
            ].filter(r => Number(r[1]) > 0 || r[0] === "Basic Salary");
        } else {
            // Default / other departments - show all non-zero
            earningsRows = [
                ["Basic Salary",       slip.basicSalary     ],
                ["HRA",                slip.hra             ],
                ["Dearness Allowance", slip.dearnessAllowance],
                ["Special Allowance",  slip.specialAllowance],
                ["Conveyance",         slip.conveyance      ],
                ["Other Earnings",     slip.otherEarnings   ],
            ].filter(r => Number(r[1]) > 0 || r[0] === "Basic Salary");
        }

        // Deductions - no PF for new slips; LOP shown if > 0; legacy PF shown if stored
        const legacyPF = Number(slip.providentFund) || 0; // backward-compat
        const deductionRows = [
            ...(legacyPF > 0        ? [["Provident Fund (legacy)", legacyPF]] : []),
            ["Professional Tax",   slip.professionalTax || 0],
            ...(Number(slip.lopDeduction) > 0  ? [["LOP Deduction", slip.lopDeduction]] : []),
            ["Other Deductions",   slip.otherDeductions || 0],
        ].filter(r => Number(r[1]) > 0);

        // Earnings header
        fillRect(EARN_X, curY, HALF_W, HEAD_H, BRAND_MID);
        cell("Earnings",      EARN_X,           curY, COL_LABEL, HEAD_H, { bold: true, color: TEXT_LIGHT, fontSize: 9 });
        cell("Amount (Rs.)",  EARN_X + COL_LABEL, curY, COL_AMT, HEAD_H, { bold: true, color: TEXT_LIGHT, fontSize: 9, align: "right" });

        // Deductions header
        fillRect(DED_X, curY, HALF_W, HEAD_H, BRAND_MID);
        cell("Deductions",    DED_X,            curY, COL_LABEL, HEAD_H, { bold: true, color: TEXT_LIGHT, fontSize: 9 });
        cell("Amount (Rs.)",  DED_X + COL_LABEL, curY, COL_AMT, HEAD_H, { bold: true, color: TEXT_LIGHT, fontSize: 9, align: "right" });
        curY += HEAD_H;

        const maxRows = Math.max(earningsRows.length, deductionRows.length);
        for (let i = 0; i < maxRows; i++) {
            const rowY = curY + i * ROW_H;
            const bg   = i % 2 === 0 ? ROW_WHITE : ROW_ALT;
            fillRect(EARN_X, rowY, HALF_W, ROW_H, bg);
            if (earningsRows[i]) {
                cell(earningsRows[i][0], EARN_X,            rowY, COL_LABEL, ROW_H, { fontSize: 9, color: TEXT_DARK });
                cell(inrFmt(earningsRows[i][1]), EARN_X + COL_LABEL, rowY, COL_AMT, ROW_H, { fontSize: 9, color: TEXT_DARK, align: "right" });
            }
            strokeRect(EARN_X, rowY, HALF_W, ROW_H, BORDER);

            fillRect(DED_X, rowY, HALF_W, ROW_H, bg);
            if (deductionRows[i]) {
                cell(deductionRows[i][0], DED_X,             rowY, COL_LABEL, ROW_H, { fontSize: 9, color: TEXT_DARK });
                cell(inrFmt(deductionRows[i][1]), DED_X + COL_LABEL, rowY, COL_AMT, ROW_H, { fontSize: 9, color: TEXT_DARK, align: "right" });
            }
            strokeRect(DED_X, rowY, HALF_W, ROW_H, BORDER);
        }
        curY += maxRows * ROW_H + 1;

        // Gross Pay & Total Deductions footer row
        const storedTotalDed = Number(slip.totalDeductions) > 0
            ? slip.totalDeductions
            : (legacyPF + (slip.professionalTax || 0) + (slip.otherDeductions || 0) + (slip.lopDeduction || 0));

        fillRect(EARN_X, curY, HALF_W, ROW_H, BRAND_DARK);
        cell("Gross Pay",       EARN_X,            curY, COL_LABEL, ROW_H, { bold: true, color: TEXT_LIGHT, fontSize: 9 });
        cell(inrFmt(slip.grossPay), EARN_X + COL_LABEL, curY, COL_AMT, ROW_H, { bold: true, color: TEXT_LIGHT, fontSize: 9, align: "right" });

        fillRect(DED_X, curY, HALF_W, ROW_H, BRAND_DARK);
        cell("Total Deductions", DED_X,             curY, COL_LABEL, ROW_H, { bold: true, color: TEXT_LIGHT, fontSize: 9 });
        cell(inrFmt(storedTotalDed), DED_X + COL_LABEL, curY, COL_AMT, ROW_H, { bold: true, color: TEXT_LIGHT, fontSize: 9, align: "right" });
        curY += ROW_H + 16;

        // -- NET PAY BAND -------------------------------------------------------
        const NET_H = 38;
        fillRect(MARGIN, curY, PAGE_W - MARGIN * 2, NET_H, BRAND_ACCENT);
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_LIGHT)
           .text("NET PAY", MARGIN + 10, curY + 11, { lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(14).fillColor(TEXT_LIGHT)
           .text(inrFmt(slip.netPay), 0, curY + 9, { width: PAGE_W - MARGIN, align: "right", lineBreak: false });
        curY += NET_H + 8;

        // Net Pay in Words
        doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED)
           .text(netPayInWords(slip.netPay), MARGIN, curY, { width: PAGE_W - MARGIN * 2 });
        curY += 20;

        // -- NOTES --------------------------------------------------------------
        const notesText = slip.notes && slip.notes.trim() ? slip.notes.trim() : "-";
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND_ACCENT)
           .text("NOTES", MARGIN, curY);
        curY += 13;
        fillRect(MARGIN, curY, PAGE_W - MARGIN * 2, 0.5, BORDER);
        curY += 6;
        doc.font("Helvetica").fontSize(9).fillColor(TEXT_MUTED)
           .text(notesText, MARGIN, curY, { width: PAGE_W - MARGIN * 2 });
        curY += 40;

        // -- SIGNATURES ---------------------------------------------------------
        const SIG_LINE_W = 140;
        const EMP_SIG_X  = MARGIN;
        const HR_SIG_X   = PAGE_W - MARGIN - SIG_LINE_W;

        fillRect(EMP_SIG_X, curY, SIG_LINE_W, 0.75, TEXT_DARK);
        doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED)
           .text("Employee Signature", EMP_SIG_X, curY + 4, { width: SIG_LINE_W, align: "center", lineBreak: false });

        fillRect(HR_SIG_X, curY, SIG_LINE_W, 0.75, TEXT_DARK);
        doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED)
           .text("Authorised by HR / Management", HR_SIG_X, curY + 4, { width: SIG_LINE_W, align: "center", lineBreak: false });

        // -- FOOTER -------------------------------------------------------------
        const FOOTER_Y = doc.page.height - 28;
        fillRect(0, FOOTER_Y, PAGE_W, 28, BRAND_DARK);
        doc.font("Helvetica").fontSize(7.5).fillColor("#888888")
           .text("This is a computer-generated salary slip and does not require a physical signature.",
               MARGIN, FOOTER_Y + 9, { width: PAGE_W - MARGIN * 2, align: "center", lineBreak: false });

        doc.end();
    });
};

// End of renderSalarySlipPdfBuffer


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
    ["joiningDate", "leavingDate", "probationEndDate"].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(next, field)) {
            next[field] = next[field] ? new Date(next[field]) : null;
        }
    });

    if (Object.prototype.hasOwnProperty.call(next, "salary")) {
        next.salary = next.salary === "" || next.salary === null ? null : Number(next.salary);
    }

    if (Object.prototype.hasOwnProperty.call(next, "offeredSalary")) {
        next.offeredSalary = next.offeredSalary === "" || next.offeredSalary === null ? null : Number(next.offeredSalary);
    }

    if (Object.prototype.hasOwnProperty.call(next, "noticePeriodDays")) {
        next.noticePeriodDays = next.noticePeriodDays === "" || next.noticePeriodDays === null ? 0 : Number(next.noticePeriodDays);
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

    if (Object.prototype.hasOwnProperty.call(next, "panNumber")) {
        next.panNumber = String(next.panNumber || "").trim().toUpperCase();
    }

    ["aadhaarNumber", "uanNumber", "esicNumber"].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(next, field)) {
            next[field] = String(next[field] || "").replace(/\D/g, "");
        }
    });

    return next;
};

const serializeEmployeeProfile = async (contact) => {
    const linkedUser = await resolveLinkedUser(contact);
    const doc = toPlainContact(contact);
    const targetUserId = contact.linkedUser || contact.sourceUserId || contact._id;
    const profilePhotoUrl = contact.profilePhoto
        ? `/api/contacts/profiles/${targetUserId}/photo`
        : "";

    return {
        ...doc,
        profilePhoto: profilePhotoUrl,
        employeeId: contact.employeeId || null,
        reportsTo: linkedUser?.reportsTo || null,
        linkedUser: linkedUser
            ? {
                _id: linkedUser._id,
                name: linkedUser.name,
                email: linkedUser.email,
                role: linkedUser.role,
                department: linkedUser.department,
                reportsTo: linkedUser.reportsTo || null,
                profilePhoto: profilePhotoUrl,
            }
            : null,
    };
};

const maskBankAccount = (val) => {
    if (!val) return "";
    const clean = String(val).trim();
    if (clean.length < 4) return val;
    return `${"X".repeat(clean.length - 4)}${clean.slice(-4)}`;
};

const maskAadhaar = (val) => {
    if (!val) return "";
    const clean = String(val).replace(/\s/g, "");
    if (clean.length !== 12) return val;
    return `XXXX XXXX ${clean.slice(-4)}`;
};

const maskPan = (val) => {
    if (!val) return "";
    const clean = String(val).trim().toUpperCase();
    if (clean.length !== 10) return val;
    return `${clean.slice(0, 3)}XXXXXX${clean.slice(-1)}`;
};

const maskUan = (val) => {
    if (!val) return "";
    const clean = String(val).trim();
    if (clean.length < 4) return val;
    return `${"X".repeat(clean.length - 4)}${clean.slice(-4)}`;
};

const maskEsic = (val) => {
    if (!val) return "";
    const clean = String(val).trim();
    if (clean.length < 4) return val;
    return `${"X".repeat(clean.length - 4)}${clean.slice(-4)}`;
};

// Helper to filter fields based on role and re-auth status
const filterContactFields = (contact, role, isReAuthed = false) => {
    const doc = toPlainContact(contact);

    // Management: Highly restricted
    if (role === 'management') {
        return {
            _id: doc._id,
            employeeId: doc.employeeId || null,
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
        result.aadhaarNumber = maskAadhaar(doc.aadhaarNumber);
        result.panNumber = maskPan(doc.panNumber);
        result.uanNumber = maskUan(doc.uanNumber);
        result.esicNumber = maskEsic(doc.esicNumber);
        if (!isReAuthed) {
            result.salary = "********";
            result.offeredSalary = "********";
            result.contactNumber = "********";
            result.address = "********";
            result.salarySlips = doc.salarySlips ? doc.salarySlips.length : 0; // Just return count
            if (result.bankDetails && result.bankDetails.accountNumber) {
                result.bankDetails = {
                    ...result.bankDetails,
                    accountNumber: maskBankAccount(result.bankDetails.accountNumber)
                };
            }
        }
        return result;
    }

    // Super User: Sees all, but still masks PII/Slips if not re-authed (per user requirement)
    if (role === 'super_user') {
        const result = { ...doc };
        result.aadhaarNumber = maskAadhaar(doc.aadhaarNumber);
        result.panNumber = maskPan(doc.panNumber);
        result.uanNumber = maskUan(doc.uanNumber);
        result.esicNumber = maskEsic(doc.esicNumber);
        if (!isReAuthed) {
            result.contactNumber = "********";
            result.address = "********";
            result.salary = "********";
            result.offeredSalary = "********";
            result.salarySlips = doc.salarySlips ? doc.salarySlips.length : 0;
            if (result.bankDetails && result.bankDetails.accountNumber) {
                result.bankDetails = {
                    ...result.bankDetails,
                    accountNumber: maskBankAccount(result.bankDetails.accountNumber)
                };
            }
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

        const pdfBuffer = await renderSalarySlipPdfBuffer(contact, salarySlip);
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
        if (!payload.month || !String(payload.month).trim()) {
            return res.status(400).json({ message: "Month and year are required" });
        }
        if (!payload.year) {
            return res.status(400).json({ message: "Month and year are required" });
        }
        if (!payload.payDate) {
            return res.status(400).json({ message: "Pay Date is required" });
        }

        const basicVal = Number(payload.basicSalary);
        if (isNaN(basicVal) || basicVal <= 0) {
            return res.status(400).json({ message: "Basic Salary is required and must be greater than 0" });
        }

        // Working Days must be mandatory, integer between 1 and 31.
        const workingDaysRaw = payload.workingDays;
        const workingDaysVal = Number(workingDaysRaw);
        if (workingDaysRaw === undefined || workingDaysRaw === null || workingDaysRaw === "" || isNaN(workingDaysVal) || !Number.isInteger(workingDaysVal) || workingDaysVal < 1 || workingDaysVal > 31) {
            return res.status(400).json({ message: "Working Days must be between 1 and 31." });
        }

        // Paid Days must be mandatory, integer greater than 0, cannot exceed Working Days.
        const paidDaysRaw = payload.paidDays;
        const paidDaysVal = Number(paidDaysRaw);
        if (paidDaysRaw === undefined || paidDaysRaw === null || paidDaysRaw === "" || isNaN(paidDaysVal) || !Number.isInteger(paidDaysVal) || paidDaysVal <= 0) {
            return res.status(400).json({ message: "Paid Days must be greater than 0." });
        }
        if (paidDaysVal > workingDaysVal) {
            return res.status(400).json({ message: "Paid Days cannot exceed Working Days." });
        }

        // LWP/LOP Days must be integer, 0 or greater.
        const lopDaysRaw = payload.lopDays !== undefined && payload.lopDays !== null && payload.lopDays !== "" ? payload.lopDays : 0;
        const lopDaysVal = Number(lopDaysRaw);
        if (isNaN(lopDaysVal) || !Number.isInteger(lopDaysVal) || lopDaysVal < 0) {
            return res.status(400).json({ message: "LWP/LOP Days cannot be negative." });
        }
        if (lopDaysVal > workingDaysVal) {
            return res.status(400).json({ message: "LWP/LOP Days cannot exceed Working Days." });
        }

        // Paid Days + LWP/LOP Days <= Working Days
        if (paidDaysVal + lopDaysVal > workingDaysVal) {
            return res.status(400).json({ message: "Paid Days and LWP/LOP Days cannot exceed total Working Days." });
        }

        // Monetary values check (no negative values)
        const monetaryFields = [
            "basicSalary", "hra", "dearnessAllowance", "specialAllowance", "otherEarnings",
            "travelAllowance", "salesIncentive", "commission", "commissionRate",
            "monthlyTarget", "achievedSales", "targetAchievementBonus", "clientAcquisitionBonus",
            "conveyance", "technicalAllowance", "internetAllowance", "wfhAllowance",
            "nightShiftAllowance", "onCallAllowance", "overtimePay", "projectCompletionBonus",
            "performanceBonus", "professionalTax", "otherDeductions"
        ];
        for (const field of monetaryFields) {
            if (payload[field] !== undefined && payload[field] !== null && payload[field] !== "") {
                const val = Number(payload[field]);
                if (isNaN(val) || val < 0) {
                    return res.status(400).json({ message: `${field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())} cannot be negative` });
                }
            }
        }

        // Commission rate must be between 0 and 100
        const commRate = Number(payload.commissionRate || 0);
        if (commRate < 0 || commRate > 100) {
            return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
        }

        // Bank account last digits must contain exactly 4 digits when provided
        if (payload.bankAccountLast4 && payload.bankAccountLast4.trim()) {
            if (!/^[0-9]{4}$/.test(payload.bankAccountLast4.trim())) {
                return res.status(400).json({ message: "Bank account last digits must contain exactly 4 digits" });
            }
        }

        const contact = await ensureContactProfileForUser(user._id);
        if (!contact) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        // -- Root-cause fix: always build from buildSalarySlipRecord so that
        //    grossPay, totalDeductions, and netPay are ALWAYS calculated
        //    server-side and never rely on frontend-supplied values.
        const slipRecord = buildSalarySlipRecord(payload, req.user._id);
        const newSlip = new SalarySlip({
            ...slipRecord,
            contactId: contact._id,
            employeeId: contact.employeeId || user.userId || ""
        });
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

        const cleanBody = { ...req.body };
        const maskedFields = ["salary", "offeredSalary", "contactNumber", "address", "aadhaarNumber", "panNumber", "uanNumber", "esicNumber"];
        maskedFields.forEach(field => {
            if (cleanBody[field] !== undefined) {
                const valStr = String(cleanBody[field]);
                if (valStr.includes("*") || valStr.includes("X") || valStr.includes("x")) {
                    delete cleanBody[field];
                }
            }
        });

        if (cleanBody.bankDetails) {
            const accNum = String(cleanBody.bankDetails.accountNumber || "");
            if (accNum.includes("X") || accNum.includes("*") || accNum.includes("x")) {
                delete cleanBody.bankDetails.accountNumber;
            }
        }

        const updates = normalizeProfileValues(
            sanitizeProfilePayload(cleanBody, STAFF_PROFILE_FIELDS)
        );
        const contact = await ensureContactProfileForUser(user._id);

        if (!contact) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        // --- VALIDATIONS ---

        // 1. Joining Date
        if (updates.joiningDate) {
            const now = new Date();
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            if (updates.joiningDate > todayEnd) {
                return res.status(400).json({ message: "Joining Date cannot be in the future." });
            }
        }

        // 2. Relieving Date (leavingDate)
        const currentJoiningDate = updates.joiningDate || contact.joiningDate;
        if (updates.leavingDate) {
            if (!currentJoiningDate) {
                return res.status(400).json({ message: "Joining Date is required before setting a Relieving Date." });
            }
            if (updates.leavingDate < currentJoiningDate) {
                return res.status(400).json({ message: "Relieving Date cannot be before Joining Date." });
            }
        }

        // 3. Probation End Date
        if (updates.probationEndDate) {
            if (!currentJoiningDate) {
                return res.status(400).json({ message: "Joining Date is required before setting a Probation End Date." });
            }
            if (updates.probationEndDate < currentJoiningDate) {
                return res.status(400).json({ message: "Probation End Date cannot be before Joining Date." });
            }
        }

        // 4. Employee Status, sync to status / leavingDate
        const newEmpStatus = updates.employeeStatus || contact.employeeStatus || "Active";
        if (newEmpStatus === "Ex Employee" || newEmpStatus === "Terminated") {
            const currentLeavingDate = updates.leavingDate || contact.leavingDate;
            if (!currentLeavingDate) {
                return res.status(400).json({ message: "Relieving Date is required when status is Ex Employee or Terminated." });
            }
            updates.status = "Ex-Employee";
            updates.isActive = false;
        } else if (newEmpStatus === "Notice Period") {
            const currentNoticePeriod = updates.noticePeriodDays !== undefined ? updates.noticePeriodDays : contact.noticePeriodDays;
            if (currentNoticePeriod === undefined || currentNoticePeriod === null || isNaN(Number(currentNoticePeriod)) || Number(currentNoticePeriod) < 0) {
                return res.status(400).json({ message: "Notice Period Days is required when status is Notice Period." });
            }
            updates.status = "Employee";
            updates.isActive = true;
        } else {
            updates.status = "Employee";
            updates.isActive = true;
        }

        // 5. Notice Period Days
        if (updates.noticePeriodDays !== undefined && updates.noticePeriodDays !== null) {
            const npDays = Number(updates.noticePeriodDays);
            if (isNaN(npDays) || !Number.isInteger(npDays) || npDays < 0 || npDays > 365) {
                return res.status(400).json({ message: "Notice Period Days must be an integer between 0 and 365." });
            }
        }

        // 6. Offered Salary
        if (updates.offeredSalary !== undefined && updates.offeredSalary !== null) {
            const sal = Number(updates.offeredSalary);
            if (isNaN(sal) || sal < 0) {
                return res.status(400).json({ message: "Offered Salary cannot be negative." });
            }
        }

        // 7. Current Salary
        if (updates.salary !== undefined && updates.salary !== null) {
            const sal = Number(updates.salary);
            if (isNaN(sal) || sal < 0) {
                return res.status(400).json({ message: "Current Salary cannot be negative." });
            }
        }

        // 8. Aadhaar Validation
        if (updates.aadhaarNumber) {
            if (!/^[0-9]{12}$/.test(updates.aadhaarNumber)) {
                return res.status(400).json({ message: "Aadhaar Number must contain exactly 12 digits." });
            }
        }

        // 9. PAN Validation
        if (updates.panNumber) {
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(updates.panNumber)) {
                return res.status(400).json({ message: "Enter a valid PAN number, for example ABCDE1234F." });
            }
        }

        // 10. UAN Validation
        if (updates.uanNumber) {
            if (!/^[0-9]{12}$/.test(updates.uanNumber)) {
                return res.status(400).json({ message: "UAN Number must contain exactly 12 digits." });
            }
        }

        // 11. ESIC Validation
        if (updates.esicNumber) {
            if (!/^[0-9]{10,17}$/.test(updates.esicNumber)) {
                return res.status(400).json({ message: "ESIC Number must contain between 10 and 17 digits." });
            }
        }

        // 12. Reporting Manager (reportsTo)
        if (Object.prototype.hasOwnProperty.call(updates, "reportsTo")) {
            const managerId = updates.reportsTo;
            if (managerId && managerId !== "" && managerId !== "null") {
                if (String(managerId) === String(user._id)) {
                    return res.status(400).json({ message: "Employee cannot report to themselves." });
                }
                const manager = await User.findById(managerId);
                if (!manager) {
                    return res.status(400).json({ message: "Reporting Manager not found." });
                }
                if (manager.reportsTo && String(manager.reportsTo) === String(user._id)) {
                    return res.status(400).json({ message: "Circular reporting detected. Manager cannot report to this employee." });
                }
                user.reportsTo = manager._id;
            } else {
                user.reportsTo = null;
            }
            delete updates.reportsTo;
        }

        // Bank Details Validation
        if (updates.bankDetails) {
            const currentBankDetails = {
                ...(contact.bankDetails || {}),
                ...updates.bankDetails
            };

            // Payment Mode
            if (currentBankDetails.paymentMode) {
                const validModes = ["Bank Transfer", "Cash", "Cheque", "UPI", ""];
                if (!validModes.includes(currentBankDetails.paymentMode)) {
                    return res.status(400).json({ message: "Invalid Payment Mode selected." });
                }
            }

            // Account Number
            if (currentBankDetails.accountNumber) {
                const cleanAcc = String(currentBankDetails.accountNumber).trim();
                if (!/^[0-9]{9,18}$/.test(cleanAcc)) {
                    return res.status(400).json({ message: "Account Number must contain between 9 and 18 digits." });
                }
            }

            // IFSC Code
            if (currentBankDetails.ifscCode) {
                const cleanIfsc = String(currentBankDetails.ifscCode).trim().toUpperCase();
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
                    return res.status(400).json({ message: "Enter a valid IFSC code (e.g. SBIN0001234)." });
                }
                updates.bankDetails.ifscCode = cleanIfsc;
            }

            // Account Type
            if (currentBankDetails.accountType) {
                const validTypes = ["Savings", "Current", ""];
                if (!validTypes.includes(currentBankDetails.accountType)) {
                    return res.status(400).json({ message: "Invalid Account Type selected." });
                }
            }

            // Merge into contact.bankDetails manually
            contact.bankDetails = currentBankDetails;
            delete updates.bankDetails;
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

// Configure multer for profile photo upload
const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = './uploads/avatars/';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `avatar-${req.params.userId || Date.now()}-${Date.now()}${ext}`);
        }
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpg|jpeg|png|webp/i;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error("Only JPG, JPEG, PNG, and WEBP files are allowed."));
    }
}).single("photo");

// Upload Profile Photo
exports.uploadProfilePhoto = (req, res) => {
    avatarUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Failed to upload file" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        try {
            const { userId } = req.params;
            const contact = await ensureContactProfileForUser(userId);
            if (!contact) {
                return res.status(404).json({ message: "Employee profile not found" });
            }

            // Remove old photo if it exists
            if (contact.profilePhoto) {
                const oldPath = path.resolve(contact.profilePhoto);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (unlinkErr) {
                        console.error("Failed to delete old avatar file:", unlinkErr);
                    }
                }
            }

            // Save new photo path
            contact.profilePhoto = req.file.path.replace(/\\/g, "/");
            await Contact.updateOne({ _id: contact._id }, { $set: { profilePhoto: contact.profilePhoto } });

            res.json({
                message: "Profile photo uploaded successfully",
                profilePhoto: `/api/contacts/profiles/${userId}/photo`
            });
        } catch (dbErr) {
            console.error("Upload Profile Photo DB Error:", dbErr);
            res.status(500).json({ message: "Server Error" });
        }
    });
};

// Delete Profile Photo
exports.deleteProfilePhoto = async (req, res) => {
    try {
        const { userId } = req.params;
        const contact = await ensureContactProfileForUser(userId);
        if (!contact) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        if (contact.profilePhoto) {
            const oldPath = path.resolve(contact.profilePhoto);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (unlinkErr) {
                    console.error("Failed to delete avatar file:", unlinkErr);
                }
            }
            contact.profilePhoto = "";
            await Contact.updateOne({ _id: contact._id }, { $set: { profilePhoto: "" } });
        }

        res.json({ message: "Profile photo removed successfully" });
    } catch (err) {
        console.error("Delete Profile Photo Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Stream Profile Photo
exports.getProfilePhoto = async (req, res) => {
    try {
        const { userId } = req.params;
        const contact = await Contact.findOne({ linkedUser: userId });
        if (!contact || !contact.profilePhoto) {
            return res.status(404).json({ message: "Profile photo not found" });
        }

        const resolvedPath = path.resolve(contact.profilePhoto);
        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ message: "Profile photo file not found" });
        }

        res.sendFile(resolvedPath);
    } catch (err) {
        console.error("Get Profile Photo Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.uploadPrivate = uploadPrivate;
