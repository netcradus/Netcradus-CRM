const mongoose = require("mongoose");
 
const stickyNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    maxLength: 500,
    default: "",
  },
  color: {
    type: String,
    enum: ["#1e293b", "#115e59", "#312e81", "#334155"],
    default: "#1e293b",
  },
}, { timestamps: true });
 
module.exports = mongoose.model("StickyNote", stickyNoteSchema);
 
 