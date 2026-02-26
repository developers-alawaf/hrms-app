const mongoose = require('mongoose');

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:mm

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  abbreviation: { type: String, required: true, unique: true, trim: true },
  employeeIdBase: { type: Number, required: true },
  logoUrl: { type: String }, // For company logo
  isActive: { type: Boolean, default: true },
  // Default office hours (dynamic schedule per company)
  defaultOfficeStartTime: { type: String, default: '09:00', match: timePattern },
  defaultOfficeEndTime: { type: String, default: '18:00', match: timePattern },
  gracePeriod: { type: Number, default: 0 }, // Minutes grace for late arrival
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// module.exports = mongoose.model('Company', companySchema);
module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
