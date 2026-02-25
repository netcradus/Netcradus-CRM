const express = require('express');
const router = express.Router();
const dealsController = require('../controllers/dealsController');

// Routes

// Get all deals
router.get('/', dealsController.getDeals);

// Get a single deal by ID
router.get('/:id', dealsController.getDeal);

// Create a new deal
router.post('/', dealsController.createDeal);

// Update an existing deal by ID
router.put('/:id', dealsController.updateDeal);

// Delete a deal by ID
router.delete('/:id', dealsController.deleteDeal);

module.exports = router;
