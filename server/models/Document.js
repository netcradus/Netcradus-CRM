const mongoose = require('mongoose');

/**
 * Document — tracks every file uploaded by a user to their personal Drive folder.
 * Drive file IDs and raw view links are NEVER sent to the frontend.
 * All file access goes through /api/documents/view/:id (proxy endpoint).
 */
const documentSchema = new mongoose.Schema({
  // Ownership
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Folder context
  folderId: { type: String, required: true },   // Drive folder ID this file lives in
  folderName: { type: String },                  // human-readable folder name (e.g. "cvs")

  // File metadata
  originalName: { type: String },               // sanitized original filename
  safeName: { type: String },                   // slugified name used in Drive
  mimeType: { type: String },
  fileSizeBytes: { type: Number, default: 0 },
  fileSizeMB: { type: Number, default: 0 },

  // Drive references — INTERNAL ONLY, never exposed to frontend
  driveFileId: { type: String },
  driveViewLink: { type: String },

  // CRM entity link (optional — for attaching docs to leads, deals, etc.)
  entityType: {
    type: String,
    enum: ['user', 'lead', 'deal', 'contact', 'company', 'ticket', null],
    default: null,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },

  documentType: { type: String, default: null },
  notes: { type: String, default: null },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  uploadedAt: { type: Date, default: Date.now },
});

// Compound index for fast per-user, per-folder queries
documentSchema.index({ ownerId: 1, folderId: 1, isDeleted: 1 });

module.exports = mongoose.model('Document', documentSchema);
