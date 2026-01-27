// contactRoutes.js
const express = require("express");
const router = express.Router();
const contactsController = require("../controllers/contactsController");

// Routes
router.get("/", contactsController.getContacts);          // Get all contacts
router.post("/", contactsController.createContact);      // Create a new contact
router.get("/:id", contactsController.getContactById);   // Get a contact by ID
router.put("/:id", contactsController.updateContact);    // Update a contact by ID
router.delete("/:id", contactsController.deleteContact); // Delete a contact by ID

module.exports = router;
