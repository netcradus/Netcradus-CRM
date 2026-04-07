const Ticket = require("../models/Ticket");
const AuditLog = require("../models/AuditLog");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/tickets/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `ticket-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
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

// CREATE TICKET
const createTicket = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;
        const count = await Ticket.countDocuments();
        const ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;

        const attachments = req.files ? req.files.map(f => ({
            filename: f.filename,
            path: f.path,
            mimetype: f.mimetype,
            size: f.size
        })) : [];

        const ticket = new Ticket({
            ticketId,
            raisedBy: req.user.id,
            role: req.user.role,
            title,
            description,
            category,
            priority,
            attachments
        });

        await ticket.save();
        await AuditLog.create({ action: "TICKET_CREATED", actorId: req.user.id, targetId: ticket._id, metadata: { ticketId }, ip: req.ip });

        res.status(201).json({ success: true, ticket });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET TICKETS (Role-scoped)
const getTickets = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'management') {
            query.raisedBy = req.user.id;
        } else if (req.user.role === 'admin') {
            query.role = 'management';
        }
        // Super user sees all (implicit)

        const tickets = await Ticket.find(query).populate('raisedBy', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ADD COMMENT (Admin / Super User only)
const addComment = async (req, res) => {
    try {
        const { message } = req.body;
        const { id } = req.params;

        if (req.user.role === 'management') {
            return res.status(403).json({ success: false, message: "Management cannot comment on tickets" });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        ticket.comments.push({
            senderId: req.user.id,
            senderRole: req.user.role,
            message
        });

        await ticket.save();
        res.json({ success: true, ticket });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ADD INFO (Raiser only)
const addInfo = async (req, res) => {
    try {
        const { message } = req.body;
        const { id } = req.params;

        const ticket = await Ticket.findOne({ _id: id, raisedBy: req.user.id });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found or unauthorized" });

        ticket.infoUpdates.push({ message });
        await ticket.save();
        res.json({ success: true, ticket });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// UPDATE STATUS (Admin / Super User only)
const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (req.user.role === 'management') {
            return res.status(403).json({ success: false, message: "Management cannot update ticket status" });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        const oldStatus = ticket.status;
        ticket.status = status;
        await ticket.save();

        await AuditLog.create({
            action: "TICKET_STATUS_UPDATED",
            actorId: req.user.id,
            targetId: ticket._id,
            metadata: { oldStatus, newStatus: status, ticketId: ticket.ticketId },
            ip: req.ip
        });

        res.json({ success: true, ticket });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    upload,
    createTicket,
    getTickets,
    addComment,
    addInfo,
    updateTicketStatus
};
