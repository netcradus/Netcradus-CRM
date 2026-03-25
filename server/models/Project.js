const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  client: String,

  // status is now free-text, driven by column name — no enum restriction
  status: {
    type: String,
    default: "To Do",
  },

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

   description: {
  type: String,
  default: "",
},

comments: [
  {
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],

}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);