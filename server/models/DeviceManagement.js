const mongoose = require("mongoose");
const Counter = require("./Counter");

const deviceManagementSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  number: {
    type: String,
    required: true,
    trim: true
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  product_type: {
    type: String,
    required: true,
    trim: true
  },
  serial_number: {
    type: String,
    required: true,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { 
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" } 
});

// COMPOUND INDEX: Prevent duplicate number + product_type combination
deviceManagementSchema.index({ number: 1, product_type: 1 }, { unique: true });

// Pre-save hook to auto-increment the numeric id
deviceManagementSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "device_management_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("DeviceManagement", deviceManagementSchema, "device_management");
