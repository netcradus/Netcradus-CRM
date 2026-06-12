// const mongoose = require("mongoose");

// const dealSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     status: {
//       type: String,
//       enum: ["New", "In Progress", "Won", "Lost"],
//       default: "New",
//     },
//     value: {
//       type: String,
//       required: true,
//     },
//     assignedTo: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     expectedCloseDate: {
//       type: Date,
//       default: null,
//     },
//     sourceLead: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Lead",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Deal", dealSchema);



const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      trim: true,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },
    meetingTime: {
      type: Date,
      default: null,
    },
    discussion: {
      type: String,
      trim: true,
      default: "",
    },
    nextAction: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    remindAt: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const dealSchema = new mongoose.Schema(
  {
    // Existing field (KEEP)
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Client Details
    clientName: {
      type: String,
      trim: true,
      default: "",
    },

    clientPhone: {
      type: String,
      trim: true,
      default: "",
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    businessUrl: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Deal Pipeline
    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Meeting Scheduled",
        "Proposal Sent",
        "Negotiation",
        "Pending",
        "Won",
        "Lost",
      ],
      default: "New",
    },

    value: {
      type: Number,
      default: 0,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dealWonBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dealClosedAt: {
      type: Date,
      default: null,
    },

    expectedCloseDate: {
      type: Date,
      default: null,
    },

    sourceLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    // CRM Features
    comments: {
      type: [commentSchema],
      default: [],
    },

    meetings: {
      type: [meetingSchema],
      default: [],
    },

    reminders: {
      type: [reminderSchema],
      default: [],
    },

    activities: {
      type: [activitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

dealSchema.index({ status: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ sourceLead: 1 });
dealSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Deal", dealSchema);