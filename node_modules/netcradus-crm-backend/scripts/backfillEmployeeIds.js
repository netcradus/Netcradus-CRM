/**
 * backfillEmployeeIds.js
 *
 * Manual script to backfill sequential Employee IDs (NC001, NC002...) for employee profiles.
 * Preserves existing valid IDs, finds duplicates and malformed values, initializes sequence counter.
 *
 * Usage:
 *   node scripts/backfillEmployeeIds.js
 *   node scripts/backfillEmployeeIds.js --dry-run
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Counter = require('../models/Counter');
const connectDB = require('../config/db');

const run = async () => {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`=== Employee ID Backfill Script [Mode: ${isDryRun ? "DRY-RUN" : "LIVE"}] ===`);

  await connectDB();

  // Find all profiles that are Employees or Ex-Employees
  const allProfiles = await Contact.find({
    status: { $in: ["Employee", "Ex-Employee"] }
  }).sort({ createdAt: 1 });

  console.log(`Found ${allProfiles.length} total employee/ex-employee profiles.`);

  const validIdRegex = /^NC\d{3,}$/;
  const idMap = new Map();
  const duplicates = [];
  const malformed = [];
  let maxSeq = 0;

  // Analysis Phase
  allProfiles.forEach(profile => {
    const eid = profile.employeeId;
    if (eid) {
      if (validIdRegex.test(eid)) {
        const num = parseInt(eid.substring(2), 10);
        if (num > maxSeq) {
          maxSeq = num;
        }
        if (idMap.has(eid)) {
          duplicates.push({ id: eid, name: profile.name, email: profile.email });
        } else {
          idMap.set(eid, profile._id);
        }
      } else {
        malformed.push({ id: eid, name: profile.name, email: profile.email });
      }
    }
  });

  console.log("\n--- Analysis Summary ---");
  console.log(`Highest existing valid sequence number (maxSeq): ${maxSeq}`);
  console.log(`Duplicate IDs found: ${duplicates.length}`);
  duplicates.forEach(d => console.log(`  - Duplicate ID: ${d.id} (Name: ${d.name}, Email: ${d.email})`));
  console.log(`Malformed IDs found: ${malformed.length}`);
  malformed.forEach(m => console.log(`  - Malformed ID: ${m.id} (Name: ${m.name}, Email: ${m.email})`));

  // Determine which profiles need new IDs (missing, empty, or malformed)
  const profilesToAssign = allProfiles.filter(profile => {
    const eid = profile.employeeId;
    return !eid || !validIdRegex.test(eid);
  });

  console.log(`Profiles needing ID assignment: ${profilesToAssign.length}`);

  if (profilesToAssign.length === 0) {
    console.log("\nNo profiles need new IDs. Initializing sequence counter to maxSeq...");
    if (!isDryRun) {
      await Counter.findOneAndUpdate(
        { id: "employeeId" },
        { $max: { seq: maxSeq } },
        { upsert: true, new: true }
      );
      console.log(`Counter initialized/updated to seq: ${maxSeq}`);
    } else {
      console.log(`[DRY-RUN] Would initialize/update Counter to seq: ${maxSeq}`);
    }
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log("\n--- Proposed ID Assignments ---");
  let currentSeq = maxSeq;
  const updates = [];

  profilesToAssign.forEach(profile => {
    currentSeq++;
    const nextId = currentSeq <= 999
      ? `NC${String(currentSeq).padStart(3, "0")}`
      : `NC${currentSeq}`;

    updates.push({
      profileId: profile._id,
      name: profile.name,
      email: profile.email,
      oldId: profile.employeeId || "(empty)",
      newId: nextId
    });

    console.log(`  Profile: ${profile.name} (${profile.email}) | Old ID: ${profile.employeeId || "None"} -> Proposed: ${nextId}`);
  });

  console.log(`\nFinal sequence number after proposed backfill: ${currentSeq}`);

  if (!isDryRun) {
    console.log("\nExecuting live updates...");
    for (const update of updates) {
      await Contact.updateOne(
        { _id: update.profileId },
        { $set: { employeeId: update.newId } }
      );
    }

    // Upsert the Counter sequence to the final sequence number
    await Counter.findOneAndUpdate(
      { id: "employeeId" },
      { $set: { seq: currentSeq } },
      { upsert: true, new: true }
    );
    console.log(`Successfully updated ${updates.length} records. Counter sequence updated to: ${currentSeq}`);
  } else {
    console.log("\n[DRY-RUN] No database modifications were made.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
};

run().catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
