const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: String,
}, { timestamps: true });

module.exports = mongoose.model("Column", columnSchema);