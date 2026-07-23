const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

      clientName: {
      type: String,
      required: true,
    },


    company: {
      type: String,
      required: true,
    },
    phone: String,
    email: String,
    projectTitle: String,
    projectDetails: String,
    participants: String,

    visitDate: {
      type: Date,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);