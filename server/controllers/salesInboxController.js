const SalesInbox = require('../models/SalesInbox');

// Get all messages
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await SalesInbox.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get a single message by ID
exports.getMessageById = async (req, res) => {
    try {
        const message = await SalesInbox.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Create a new message
exports.createMessage = async (req, res) => {
    try {
        const newMessage = new SalesInbox(req.body);
        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error });
    }
};

// Update a message
exports.updateMessage = async (req, res) => {
    try {
        const updatedMessage = await SalesInbox.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMessage) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json(updatedMessage);
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const deletedMessage = await SalesInbox.findByIdAndDelete(req.params.id);
        if (!deletedMessage) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
