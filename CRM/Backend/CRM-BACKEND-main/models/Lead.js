const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
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
        enum: ['Hot', 'Warm', 'Cold'],
        default: 'Cold' 
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

module.exports = mongoose.model('Lead', leadSchema);
