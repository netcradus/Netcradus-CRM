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
const rbac = require("../middleware/rbac");

// Create Ticket (Any role)
router.post("/", upload.array("attachments", 5), createTicket);

// Get Tickets (Role-scoped visibility inside controller)
router.get("/", getTickets);

// Add Comment (Super User only)
router.post("/:id/comment", rbac(["super_user"]), addComment);

// Add Info (Raiser ONLY - logic in controller)
router.post("/:id/info", addInfo);

// Update Status (Super User only)
router.patch("/:id/status", rbac(["super_user"]), updateTicketStatus);

module.exports = router;
