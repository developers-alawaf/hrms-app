const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      // Authentication
      'LOGIN', 'LOGOUT', 'CHANGE_PASSWORD', 'RESET_PASSWORD', 'REQUEST_PASSWORD_RESET',
      'ACCEPT_INVITATION', 'RESEND_INVITATION', 'FORCE_RESEND_INVITATION',
      // Employee
      'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE', 'ACTIVATE_EMPLOYEE', 'DEACTIVATE_EMPLOYEE',
      // Company
      'CREATE_COMPANY', 'UPDATE_COMPANY', 'DELETE_COMPANY', 'ACTIVATE_COMPANY', 'DEACTIVATE_COMPANY',
      // Department
      'CREATE_DEPARTMENT', 'UPDATE_DEPARTMENT', 'DELETE_DEPARTMENT', 'ACTIVATE_DEPARTMENT', 'DEACTIVATE_DEPARTMENT',
      // Designation
      'CREATE_DESIGNATION', 'UPDATE_DESIGNATION', 'DELETE_DESIGNATION',
      // User
      'CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER', 'ACTIVATE_USER',
      // Leave
      'CREATE_LEAVE_REQUEST', 'APPROVE_LEAVE', 'REJECT_LEAVE', 'CANCEL_LEAVE',
      // Attendance
      'ADJUST_ATTENDANCE', 'APPROVE_ATTENDANCE_ADJUSTMENT', 'REJECT_ATTENDANCE_ADJUSTMENT',
      // Document
      'UPLOAD_DOCUMENT', 'DELETE_DOCUMENT', 'DOWNLOAD_DOCUMENT',
      // Shift
      'CREATE_SHIFT', 'UPDATE_SHIFT', 'DELETE_SHIFT',
      // Roster
      'GENERATE_ROSTER', 'UPDATE_ROSTER', 'DELETE_ROSTER_ENTRY', 'BULK_ASSIGN_SHIFT',
      // Holiday
      'CREATE_HOLIDAY', 'UPDATE_HOLIDAY', 'DELETE_HOLIDAY',
      // Other
      'EXPORT_DATA', 'IMPORT_DATA', 'BULK_OPERATION'
    ]
  },
  entityType: {
    type: String,
    required: true,
    index: true,
    enum: ['Employee', 'Company', 'Department', 'Designation', 'User', 'Leave', 'Attendance', 'Document', 'Shift', 'Roster', 'Holiday', 'Other']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // Store before/after for updates
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional context
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS',
    index: true
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ companyId: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 2 years (optional - can be adjusted)
// activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

