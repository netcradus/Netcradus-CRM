const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route: Get all leads (visible to all authenticated users)
router.get('/', leadsController.getLeads);

// Protected routes: User and Admin
router.get('/:id', authMiddleware, leadsController.getLead);                    // Get single lead
router.post('/', authMiddleware, leadsController.createLead);                   // Create new lead
router.put('/:id', authMiddleware, leadsController.updateLead);                 // Update lead

// Admin only: Delete lead
router.delete('/:id', authMiddleware, leadsController.deleteLead);              // Delete lead

module.exports = router;
