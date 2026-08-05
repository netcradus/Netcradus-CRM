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
    enum: ["#ff6547", "#16b364", "#4f7cff", "#f79009", "#1e293b", "#115e59", "#312e81", "#334155"],
    default: "#ff6547",
  },
}, { timestamps: true });
 
module.exports = mongoose.model("StickyNote", stickyNoteSchema);
 
 