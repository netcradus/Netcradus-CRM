const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Deferred"],
      default: "Not Started",
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },
    dueDate: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // user responsible for task
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assigned user
    },
    associatedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account", // related CRM account
    },
    associatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead", // related CRM lead
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
