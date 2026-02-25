const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  client: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Sent", "Accepted", "Rejected"],
    default: "Sent",
  },
  dateSent: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Quote", quoteSchema);
