const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: String,
}, { timestamps: true });

columnSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Column", columnSchema);
