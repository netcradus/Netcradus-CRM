/*
 * Additive Mongo migration notes for the Partner role.
 *
 * This codebase does not currently include a migration runner. The live schema
 * additions are defined in Mongoose models and MongoDB will backfill nullable
 * fields lazily. Run this script manually only if you want indexes created
 * before normal application startup touches these models.
 */

require("dotenv").config();
const connectDB = require("../config/db");
const Vendor = require("../models/vendorModel");
const Project = require("../models/Project");
const ProjectTimeline = require("../models/ProjectTimeline");

async function migrate() {
  await connectDB();

  // These syncIndexes calls create the additive partner/timeline indexes declared in the schemas.
  await Promise.all([
    Vendor.syncIndexes(),
    Project.syncIndexes(),
    ProjectTimeline.syncIndexes(),
  ]);

  console.log("Partner role indexes are in sync.");
  process.exit(0);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
