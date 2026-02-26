const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Roster Duty Schedule - Weekly shift assignments per employee (NOC department).
 * Each employee has a shift assigned for each day of the week (Sunday-Saturday).
 * Used for recurring weekly roster duty as per KTL Roster Duty document.
 */
const rosterDutyScheduleSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  // Day-of-week shift assignments (0=Sunday, 1=Monday, ..., 6=Saturday)
  sunday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  monday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  tuesday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  wednesday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  thursday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  friday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
  saturday: { type: Schema.Types.ObjectId, ref: 'ShiftManagement', default: null },
}, { timestamps: true });

rosterDutyScheduleSchema.index({ employee: 1 }, { unique: true });

module.exports = mongoose.models.RosterDutySchedule || mongoose.model('RosterDutySchedule', rosterDutyScheduleSchema);
