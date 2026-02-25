const express = require('express');
const router = express.Router();
const campaignsController = require('../controllers/campaignController');

// Routes

// Get all campaigns
router.get('/', campaignsController.getCampaigns);

// Get a single campaign by ID
router.get('/:id', campaignsController.getCampaign);

// Create a new campaign
router.post('/', campaignsController.addCampaign);

// Update an existing campaign by ID
router.put('/:id', campaignsController.updateCampaign);

// Delete a campaign by ID
router.delete('/:id', campaignsController.deleteCampaign);

module.exports = router;
