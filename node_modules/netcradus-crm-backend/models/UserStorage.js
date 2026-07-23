const mongoose = require('mongoose');

/**
 * UserStorage — tracks per-user Google Drive folder structure and quota.
 * One document per user, created automatically when a new user is provisioned.
 */
const subFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },           // e.g. 'cvs', 'salary-slips', 'my-folder'
  driveFolderId: { type: String, required: true },  // Google Drive folder ID
  isDefault: { type: Boolean, default: false },      // true = role-based, false = custom
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const quotaHistorySchema = new mongoose.Schema({
  previousQuotaMB: { type: Number, required: true },
  newQuotaMB: { type: Number, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, trim: true },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const userStorageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // Drive folder references
  personalRootFolderId: { type: String, required: true },   // Drive ID of the user's root folder
  personalRootFolderName: { type: String, required: true }, // e.g. "abc123_John_Doe"

  subFolders: [subFolderSchema],

  // Quota (in MB)
  quotaMB: { type: Number, default: 500 },
  usedMB: { type: Number, default: 0 },
  fileCount: { type: Number, default: 0 },

  quotaHistory: [quotaHistorySchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

userStorageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('UserStorage', userStorageSchema);
