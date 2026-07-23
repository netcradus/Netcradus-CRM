const express = require('express');
const router = express.Router();
const campaignsController = require('../controllers/campaignController');
const rbac = require("../middleware/rbac");
const { DIGITAL_MEDIA_ROLES } = require("../utils/digitalMediaAccess");

router.use(rbac(DIGITAL_MEDIA_ROLES));

router.get('/', campaignsController.getCampaigns);
router.get('/:id', campaignsController.getCampaign);
router.post('/', campaignsController.addCampaign);
router.put('/:id', campaignsController.updateCampaign);
router.patch('/:id/budget', campaignsController.updateCampaignBudget);
router.post('/:id/submit-for-review', campaignsController.submitCampaignForReview);
router.post('/:id/approve', rbac(["admin", "hr", "super_user"]), campaignsController.approveCampaign);
router.post('/:id/reject', rbac(["admin", "hr", "super_user"]), campaignsController.rejectCampaign);
router.delete('/:id', campaignsController.deleteCampaign);

module.exports = router;
