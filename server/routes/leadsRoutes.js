const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');

// Public route: Get all leads (visible to all authenticated users)
router.get('/', leadsController.getLeads);

// Protected routes: User and Admin
router.get('/:id', leadsController.getLead);                    // Get single lead
router.post('/', leadsController.createLead);                   // Create new lead
router.put('/:id', leadsController.updateLead);                 // Update lead

// Admin only: Delete operations
router.delete('/bulk', leadsController.bulkDeleteLeads);        // Delete selected IDs
router.delete('/all', leadsController.deleteAllLeads);          // Delete all matching filters
router.delete('/:id', leadsController.deleteLead);              // Delete single lead

module.exports = router;
