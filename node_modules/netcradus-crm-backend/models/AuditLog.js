const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'upload', 'view', 'LEAVE_APPROVED', etc.
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // alias for performedBy (attendance module)
  documentId: mongoose.Schema.Types.ObjectId,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  note: String,
  targetId: mongoose.Schema.Types.ObjectId,     // generic target (attendance/leave)
  targetModel: String,                           // e.g. 'LeaveApplication'
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

