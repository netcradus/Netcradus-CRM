const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load server environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const dbUri = process.env.MONGO_URI;
if (!dbUri) {
  console.error("Error: MONGO_URI is not set in environment.");
  process.exit(1);
}

const runMigration = async () => {
  try {
    console.log("Connecting to database at:", dbUri.substring(0, 30) + "...");
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB.");

    const usersWithoutDate = await User.find({
      passwordChangedAt: { $exists: false }
    });

    console.log(`Found ${usersWithoutDate.length} users with missing passwordChangedAt.`);

    let updatedCount = 0;
    const deploymentDate = new Date();

    for (const user of usersWithoutDate) {
      // Sets passwordChangedAt to lastPasswordChange or deployment date if missing
      user.passwordChangedAt = user.lastPasswordChange || deploymentDate;
      
      // Enforce default properties
      if (user.mustChangePassword === undefined || user.mustChangePassword === null) {
        user.mustChangePassword = false;
      }
      if (user.passwordExpiryExempt === undefined || user.passwordExpiryExempt === null) {
        user.passwordExpiryExempt = false;
      }
      if (user.tokenVersion === undefined || user.tokenVersion === null) {
        user.tokenVersion = 0;
      }

      await user.save();
      updatedCount++;
    }

    console.log(`Migration execution completed. Successfully backfilled ${updatedCount} users.`);
  } catch (err) {
    console.error("Migration execution failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed safely.");
  }
};

runMigration();
