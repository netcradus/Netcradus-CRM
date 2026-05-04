const mongoose = require('mongoose');

const reAuthAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  attempts: { type: Number, default: 1 },
  lastAttempt: { type: Date, default: Date.now },
  lockedUntil: { type: Date }
});

reAuthAttemptSchema.index({ lockedUntil: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ReAuthAttempt', reAuthAttemptSchema);
