const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  entityType: { 
    type: String, 
    enum: ['contact', 'deal', 'company', 'general'], 
    required: true,
    default: 'general'
  },
  entityId: { 
    type: String,   // String allows 'general' as a placeholder value
    index: true,
    default: 'general'
  },
  label: { 
    type: String, 
    trim: true, 
    maxlength: 200 
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  originalName: String,
  safeName: String,
  mimeType: String,
  fileSize: Number,
  storageProvider: { 
    type: String, 
    enum: ['drive', 'dropbox'] 
  },
  storageFileId: String,
  viewLink: String,
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  deletedAt: Date,
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
});

module.exports = mongoose.model('Document', documentSchema);
