const express = require("express");
const router = express.Router();
const { 
    createTicket, 
    getTickets, 
    addComment, 
    addInfo, 
    updateTicketStatus, 
    upload 
} = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");

// Apply auth to all ticket routes
router.use(authMiddleware);

// Create Ticket (Any role)
router.post("/", upload.array("attachments", 5), createTicket);

// Get Tickets (Role-scoped visibility inside controller)
router.get("/", getTickets);

// Add Comment (Super User & Admin ONLY)
router.post("/:id/comment", rbac(["admin"]), addComment);

// Add Info (Raiser ONLY - logic in controller)
router.post("/:id/info", addInfo);

// Update Status (Super User & Admin ONLY)
router.patch("/:id/status", rbac(["admin"]), updateTicketStatus);

module.exports = router;
