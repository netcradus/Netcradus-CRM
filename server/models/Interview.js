const mongoose = require("mongoose");

const ratingField = {
  type: Number,
  min: 0,
  max: 5,
  default: 0,
};

const interviewSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    appliedRole: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    interviewRound: {
      type: String,
      required: true,
      trim: true,
      enum: ["Screening", "HR Round", "Technical Round", "Manager Round", "Final Round"],
      default: "Screening",
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    interviewer: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: [
        "New",
        "Scheduled",
        "In Progress",
        "Feedback Pending",
        "Shortlisted",
        "Rejected",
        "On Hold",
        "Selected",
        "No Show",
      ],
      default: "New",
    },
    feedback: {
      overallRating: ratingField,
      communicationRating: ratingField,
      technicalRating: ratingField,
      cultureFitRating: ratingField,
      notes: {
        type: String,
        trim: true,
      },
    },
    offerDetails: {
      expectedSalary: {
        type: Number,
        min: 0,
        default: 0,
      },
      offeredSalary: {
        type: Number,
        min: 0,
        default: 0,
      },
      finalDecision: {
        type: String,
        trim: true,
        enum: ["Pending", "Offered", "Accepted", "Rejected", "Hold", "Not Selected"],
        default: "Pending",
      },
      joiningDate: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
