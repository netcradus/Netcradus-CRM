const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const DeviceManagement = require("../models/DeviceManagement");

const isCorruptedString = (str) => {
  if (typeof str !== "string") return true;
  const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str);
  const hasZipFragments = /xl\/(sharedStrings|worksheets|drawings|charts)\.xml|docProps\/(core|app)\.xml|\[Content_Types\]\.xml/.test(str);
  return hasControlChars || hasZipFragments;
};

async function run() {
  const confirm = process.argv.includes("--confirm");
  try {
    await connectDB();
    console.log("DB Connected successfully.");

    const devices = await DeviceManagement.find({});
    console.log(`Total devices scanned: ${devices.length}\n`);

    let corruptedIds = [];
    let validCount = 0;

    devices.forEach((dev) => {
      const reasons = [];
      
      if (!dev.number || !dev.product || !dev.product_type || !dev.serial_number) {
        reasons.push("Missing required field(s)");
      } else {
        if (isCorruptedString(dev.number)) reasons.push("Number field contains binary/control chars");
        if (isCorruptedString(dev.product)) reasons.push("Product field contains binary/control chars");
        if (isCorruptedString(dev.product_type)) reasons.push("Product Type field contains binary/control chars");
        if (isCorruptedString(dev.serial_number)) reasons.push("Serial Number field contains binary/control chars");
      }

      if (reasons.length > 0) {
        corruptedIds.push(dev._id);
        console.log(`[TARGET] ID: ${dev.id} | _id: ${dev._id} | Reasons: ${reasons.join(", ")}`);
      } else {
        validCount++;
      }
    });

    console.log("\n==================================");
    console.log(`Scan Summary:`);
    console.log(`  - Scanned: ${devices.length}`);
    console.log(`  - Valid: ${validCount}`);
    console.log(`  - Corrupted: ${corruptedIds.length}`);
    console.log("==================================");

    if (corruptedIds.length === 0) {
      console.log("No corrupted records found. Nothing to clean.");
      return;
    }

    if (confirm) {
      console.log(`\nExecuting deletion of ${corruptedIds.length} corrupted records...`);
      const result = await DeviceManagement.deleteMany({ _id: { $in: corruptedIds } });
      console.log(`Deletion complete. Deleted count: ${result.deletedCount}`);
    } else {
      console.log(`\n[DRY RUN] Run again with '--confirm' flag to delete these ${corruptedIds.length} corrupted records.`);
      console.log("Example: node scripts/cleanupCorruptedDevices.js --confirm");
    }

  } catch (err) {
    console.error("Cleanup Execution Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("DB Disconnected.");
  }
}

run();
