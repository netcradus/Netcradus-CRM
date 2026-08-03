const mongoose = require("mongoose");
const Counter = require("./Counter");

const riskSchema = new mongoose.Schema(
  {
    riskId: {
      type: String,
      unique: true,
      trim: true,
    },
    risk: {
      type: String,
      required: [true, "Risk title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Financial", "Operational", "Strategic", "Compliance", "Technical"],
      required: [true, "Category is required"],
    },
    department: {
      type: String,
      trim: true,
      default: "General",
    },
    likelihood: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1: Rare, 5: Almost Certain
      required: [true, "Likelihood is required"],
    },
    impact: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1: Insignificant, 5: Critical
      required: [true, "Impact is required"],
    },
    riskScore: {
      type: Number,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Risk owner is required"],
    },
    treatment: {
      type: String,
      enum: ["Avoid", "Mitigate", "Transfer", "Accept"],
      required: [true, "Treatment is required"],
    },
    status: {
      type: String,
      enum: ["Identified", "Under Analysis", "Mitigated", "Closed", "On Hold"],
      default: "Identified",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for dynamic Priority classification
riskSchema.virtual("priority").get(function () {
  const score = this.likelihood * this.impact;
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
});

// Pre-save middleware to auto-calculate score and auto-generate sequential Risk ID
riskSchema.pre("save", async function (next) {
  // Auto-calculate score
  this.riskScore = this.likelihood * this.impact;

  // Auto-generate Risk ID
  if (!this.riskId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "riskId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seqNum = counter.seq;
      this.riskId = `RSK-${String(seqNum).padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

riskSchema.index({ riskId: 1 });
riskSchema.index({ status: 1 });
riskSchema.index({ owner: 1 });
riskSchema.index({ category: 1 });

module.exports = mongoose.model("Risk", riskSchema);
