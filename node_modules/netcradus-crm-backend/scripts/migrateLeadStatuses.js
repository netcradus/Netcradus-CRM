require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Lead = require("../models/Lead");

const STATUS_MAP = {
  not_interested: "not_interested",
  "Not Interested": "not_interested",
  in_progress: "call_back",
  "In Progress": "call_back",
  closed: "meeting_aligned",
  Closed: "meeting_aligned",
  call_back: "call_back",
  meeting_aligned: "meeting_aligned",
};

const mapStatus = (value) => STATUS_MAP[value] || "call_back";

const migrateLeadStatuses = async () => {
  await connectDB();

  const leads = await Lead.find({}, "_id status");
  let updatedCount = 0;

  for (const lead of leads) {
    const nextStatus = mapStatus(lead.status);
    if (lead.status !== nextStatus) {
      lead.status = nextStatus;
      await lead.save();
      updatedCount += 1;
    }
  }

  console.log(`Lead status migration complete. Updated ${updatedCount} lead(s).`);
  await mongoose.connection.close();
};

migrateLeadStatuses().catch(async (error) => {
  console.error("Lead status migration failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
