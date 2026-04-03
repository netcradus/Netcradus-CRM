const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  year: { type: Number, required: true, index: true },
  type: { type: String, enum: ['national', 'regional', 'optional'], default: 'national' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

holidaySchema.index({ date: 1, year: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
