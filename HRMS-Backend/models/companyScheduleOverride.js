const mongoose = require('mongoose');

/**
 * Special schedule overrides (e.g. Ramadan) - date-based office hours per company.
 * When a date falls within effectiveFrom–effectiveTo, these times override company default.
 */
const companyScheduleOverrideSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "Ramadan 2026"
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, required: true },
  officeStartTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }, // HH:mm
  officeEndTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },   // HH:mm
  gracePeriod: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

companyScheduleOverrideSchema.index({ companyId: 1, effectiveFrom: 1, effectiveTo: 1 });

module.exports = mongoose.models.CompanyScheduleOverride || mongoose.model('CompanyScheduleOverride', companyScheduleOverrideSchema);
