const express = require('express');
const router = express.Router();
const salesInboxController = require('../controllers/salesInboxController');

// Routes
router.get('/', salesInboxController.getAllMessages);
router.get('/:id', salesInboxController.getMessageById);
router.post('/', salesInboxController.createMessage);
router.put('/:id', salesInboxController.updateMessage);
router.delete('/:id', salesInboxController.deleteMessage);

module.exports = router;
