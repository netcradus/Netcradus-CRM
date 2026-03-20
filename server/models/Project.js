const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: String,
  client: String,

  status: {
    type: String,
    enum: [
      "Pending",
      "Ongoing",
      "Completed",
      "To Do",
      "Bugs",
      "Solutions",
      "Ideas",
    ],
    default: "Pending",
  },

  // ✅ NEW FIELD (IMPORTANT)
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Column",
    default: null,
  },

  deadline: Date,

  progress: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);