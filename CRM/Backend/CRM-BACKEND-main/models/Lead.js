const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    phone: { type: String },
    company: { type: String },
    status: { type: String, default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
