const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ""
    },
    email: {
        type: String,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Closed', 'In Progress', 'Not Interested'],
        default: 'In Progress'
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Basic indexes for filtering and sorting
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

// Text index for search functionality
leadSchema.index({ 
    name: 'text', 
    email: 'text', 
    company: 'text',
    phone: 'text'
});

module.exports = mongoose.model('Lead', leadSchema);
