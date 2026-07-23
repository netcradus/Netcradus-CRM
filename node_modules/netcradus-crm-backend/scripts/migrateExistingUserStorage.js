/**
 * migrateExistingUserStorage.js
 *
 * One-time (idempotent) migration script to provision Google Drive storage
 * for all existing users who do not yet have it.
 *
 * Safe to run multiple times — already-provisioned users are skipped.
 *
 * Usage:
 *   cd server
 *   node scripts/migrateExistingUserStorage.js
 *
 * Prerequisites:
 *   - GOOGLE_CLIENT_ID must be set in server/.env
 *   - GOOGLE_CLIENT_SECRET must be set in server/.env
 *   - GOOGLE_REFRESH_TOKEN must be set in server/.env
 *   - DRIVE_FOLDER_ID must be set in server/.env
 *   - MONGODB_URI must be set in server/.env
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStorage = require('../models/UserStorage');
const storageService = require('../services/storageService');

const DELAY_MS = 500; // 500ms between Drive API calls to avoid rate limits

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  // ── Connect to DB ──────────────────────────────────────────────────────────
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[Migration] ERROR: MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('[Migration] Connected to MongoDB.');

  // ── Find users without provisioned storage ─────────────────────────────────
  const users = await User.find({ storageProvisioned: { $ne: true } }).lean();
  console.log(`[Migration] Found ${users.length} user(s) needing storage provisioning.`);

  if (users.length === 0) {
    console.log('[Migration] Nothing to do. All users are already provisioned.');
    await mongoose.disconnect();
    return;
  }

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const user of users) {
    const label = `${user.name || user.email} (${user._id})`;

    // Idempotency: if UserStorage already exists, just mark as provisioned
    const existing = await UserStorage.findOne({ userId: user._id });
    if (existing) {
      console.log(`[Migration] ⏭  Skipping ${label} — UserStorage already exists.`);
      await User.updateOne({ _id: user._id }, { storageProvisioned: true });
      skipCount++;
      await sleep(DELAY_MS);
      continue;
    }

    try {
      console.log(`[Migration] ⚙  Provisioning ${label}...`);
      await storageService.provisionUserStorage(user._id, user.name || user.email, user.role);
      await User.updateOne({ _id: user._id }, { storageProvisioned: true });
      console.log(`[Migration] ✅ Success: ${label}`);
      successCount++;
    } catch (err) {
      console.error(`[Migration] ❌ Failed for ${label}:`, err.message);
      failCount++;
    }

    await sleep(DELAY_MS);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`[Migration] Complete.`);
  console.log(`  ✅ Provisioned: ${successCount}`);
  console.log(`  ⏭  Skipped (already existed): ${skipCount}`);
  console.log(`  ❌ Failed:      ${failCount}`);
  console.log('══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
};

run().catch(err => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
