const mongoose = require('mongoose');

const reAuthTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

reAuthTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }); // 5 minutes
reAuthTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('ReAuthToken', reAuthTokenSchema);
