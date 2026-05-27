const express = require('express');
const router = express.Router();
const vendorsController = require('../controllers/vendorsController');

// Routes

// Get all vendors
router.get('/', vendorsController.getVendors);

// Get a single vendor by ID
router.get('/:id', vendorsController.getVendor);

// Create a new vendor
router.post('/', vendorsController.createVendor);

// Update an existing vendor by ID
router.put('/:id', vendorsController.updateVendor);

// Delete a vendor by ID
router.delete('/:id', vendorsController.deleteVendor);

module.exports = router;
