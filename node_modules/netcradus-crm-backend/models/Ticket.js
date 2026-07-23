const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, unique: true, required: true }, // TKT-XXXX
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true }, // Role of the raiser at time of creation
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g. 'Technical', 'HR', 'Facility'
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    companyName: { type: String },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    product: { type: String },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    attachments: [{
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    }],
    comments: [commentSchema],
    infoUpdates: [{
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
