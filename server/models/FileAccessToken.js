const mongoose = require('mongoose');

const fileAccessTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
});

fileAccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
fileAccessTokenSchema.index({ token: 1 });

module.exports = mongoose.model('FileAccessToken', fileAccessTokenSchema);
