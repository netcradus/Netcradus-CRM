const mongoose = require("mongoose");
 
const workspaceTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  label: {
    type: String,
    maxLength: 200,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });
 
module.exports = mongoose.model("WorkspaceTask", workspaceTaskSchema);
 
 