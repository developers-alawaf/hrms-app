const moment = require('moment-timezone');
const Company = require('../models/company');
const CompanyScheduleOverride = require('../models/companyScheduleOverride');

const tz = process.env.APP_TIMEZONE || 'Asia/Dhaka';

/**
 * Compute working hours between start and end time (HH:mm)
 */
function computeWorkingHours(startTime, endTime) {
  const [sh, sm] = (startTime || '09:00').split(':').map(Number);
  const [eh, em] = (endTime || '18:00').split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  return (endMins - startMins) / 60;
}

/**
 * Get effective office schedule for a company on a specific date.
 * Checks special overrides (e.g. Ramadan) first, then company default.
 * Fallback: { startTime: '09:00', endTime: '18:00', workingHours: 8, gracePeriod: 0 }
 */
async function getEffectiveSchedule(companyId, date) {
  const dayMoment = moment(date).tz(tz);
  const dayStart = dayMoment.clone().startOf('day').toDate();
  const dayEnd = dayMoment.clone().endOf('day').toDate();

  // Find override where date falls within [effectiveFrom, effectiveTo] (inclusive)
  const override = await CompanyScheduleOverride.findOne({
    companyId,
    effectiveFrom: { $lte: dayEnd },
    effectiveTo: { $gte: dayStart }
  }).lean();

  if (override) {
    const workingHours = computeWorkingHours(override.officeStartTime, override.officeEndTime);
    return {
      startTime: override.officeStartTime,
      endTime: override.officeEndTime,
      workingHours,
      gracePeriod: override.gracePeriod ?? 0
    };
  }

  const company = await Company.findById(companyId).select('defaultOfficeStartTime defaultOfficeEndTime gracePeriod').lean();
  if (company && (company.defaultOfficeStartTime || company.defaultOfficeEndTime)) {
    const startTime = company.defaultOfficeStartTime || '09:00';
    const endTime = company.defaultOfficeEndTime || '18:00';
    return {
      startTime,
      endTime,
      workingHours: computeWorkingHours(startTime, endTime),
      gracePeriod: company.gracePeriod ?? 0
    };
  }

  return {
    startTime: '09:00',
    endTime: '18:00',
    workingHours: 8,
    gracePeriod: 0
  };
}

/**
 * Get effective working hours for a company on a specific date.
 * Used when only workingHours is needed (e.g. month summary).
 */
async function getEffectiveWorkingHours(companyId, date) {
  const s = await getEffectiveSchedule(companyId, date);
  return s.workingHours;
}

module.exports = {
  getEffectiveSchedule,
  getEffectiveWorkingHours,
  computeWorkingHours
};
