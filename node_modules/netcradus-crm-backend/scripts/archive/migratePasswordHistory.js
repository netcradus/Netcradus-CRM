const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// You will need to create PasswordHistory model if it doesn't exist, but assuming it exists as per instructions.
// Let's create it if it doesn't exist, or just use mongoose.connection.collection directly if there is no schema.
// Wait, the prompt says "into the new PasswordHistory collection, then unset from User docs."

const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const PasswordHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const migratePasswordHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for PasswordHistory migration.");

    // Check if PasswordHistory model is already defined, otherwise define it.
    const PasswordHistory = mongoose.models.PasswordHistory || mongoose.model("PasswordHistory", PasswordHistorySchema);

    const users = await User.find({ previousPasswords: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users to migrate.`);

    let totalMigrated = 0;

    for (const user of users) {
      if (user.previousPasswords && user.previousPasswords.length > 0) {
        const historyDocs = user.previousPasswords.map((hash) => ({
          userId: user._id,
          passwordHash: hash,
        }));

        await PasswordHistory.insertMany(historyDocs);
        totalMigrated += historyDocs.length;
        
        // Unset previousPasswords field
        await User.updateOne({ _id: user._id }, { $unset: { previousPasswords: "" } });
      }
    }

    console.log(`Migration complete. Migrated ${totalMigrated} password history records.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migratePasswordHistory();
