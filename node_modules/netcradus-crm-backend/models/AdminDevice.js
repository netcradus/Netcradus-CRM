const mongoose = require("mongoose");

const adminDeviceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    userAgent: {
        type: String,
        required: true
    },
    deviceName: {
        type: String,
        default: "Unknown Device"
    },
    trusted: {
        type: Boolean,
        default: false
    },
    firstLoginIp: {
        type: String
    },
    lastLoginIp: {
        type: String
    },
    lastLoginLat: {
        type: Number
    },
    lastLoginLong: {
        type: Number
    },
    lastCity: {
        type: String
    },
    lastCountry: {
        type: String
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// COMPOUND INDEX: Ensure an admin can have multiple devices, but each device ID is unique per user
adminDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model("AdminDevice", adminDeviceSchema);
