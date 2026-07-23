const mongoose = require('mongoose');

const salesInboxSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Unread', 'Read', 'Archived'], default: 'Unread' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SalesInbox', salesInboxSchema);
