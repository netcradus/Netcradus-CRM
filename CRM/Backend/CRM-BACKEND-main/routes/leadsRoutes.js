const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');

// Routes
router.get('/', leadsController.getLeads);
router.get('/:id', leadsController.getLead);
router.post('/', leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.delete('/:id', leadsController.deleteLead);

module.exports = router;
