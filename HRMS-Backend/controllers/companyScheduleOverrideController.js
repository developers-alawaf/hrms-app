const CompanyScheduleOverride = require('../models/companyScheduleOverride');
const mongoose = require('mongoose');

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

function normalizeTime(t) {
  if (!t || typeof t !== 'string') return t;
  const parts = t.trim().split(':');
  if (parts.length < 2) return t;
  const h = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
  const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
  return `${h}:${m}`;
}

exports.createOverride = async (req, res) => {
  try {
    const { companyId, name, effectiveFrom, effectiveTo, officeStartTime, officeEndTime, gracePeriod } = req.body;
    if (!companyId || !name || !effectiveFrom || !effectiveTo || !officeStartTime || !officeEndTime) {
      return res.status(400).json({ success: false, error: 'companyId, name, effectiveFrom, effectiveTo, officeStartTime, officeEndTime are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, error: 'Invalid companyId' });
    }
    const startTime = normalizeTime(officeStartTime);
    const endTime = normalizeTime(officeEndTime);
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({ success: false, error: 'Times must be in HH:mm format (e.g. 09:00, 18:00)' });
    }
    const from = new Date(effectiveFrom);
    const to = new Date(effectiveTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      return res.status(400).json({ success: false, error: 'effectiveFrom must be before effectiveTo' });
    }
    const override = new CompanyScheduleOverride({
      companyId,
      name: String(name).trim(),
      effectiveFrom: from,
      effectiveTo: to,
      officeStartTime: startTime,
      officeEndTime: endTime,
      gracePeriod: typeof gracePeriod === 'number' && gracePeriod >= 0 ? gracePeriod : 0
    });
    await override.save();
    res.status(201).json({ success: true, data: override });
  } catch (error) {
    console.error('createOverride - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getOverridesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, error: 'Invalid companyId' });
    }
    const overrides = await CompanyScheduleOverride.find({ companyId }).sort({ effectiveFrom: 1 }).lean();
    res.status(200).json({ success: true, data: overrides });
  } catch (error) {
    console.error('getOverridesByCompany - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateOverride = async (req, res) => {
  try {
    const override = await CompanyScheduleOverride.findById(req.params.id);
    if (!override) return res.status(404).json({ success: false, error: 'Override not found' });
    const { name, effectiveFrom, effectiveTo, officeStartTime, officeEndTime, gracePeriod } = req.body;
    if (name !== undefined) override.name = name;
    if (effectiveFrom !== undefined) override.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined) override.effectiveTo = new Date(effectiveTo);
    if (officeStartTime && timePattern.test(officeStartTime)) override.officeStartTime = officeStartTime;
    if (officeEndTime && timePattern.test(officeEndTime)) override.officeEndTime = officeEndTime;
    if (typeof gracePeriod === 'number' && gracePeriod >= 0) override.gracePeriod = gracePeriod;
    await override.save();
    res.status(200).json({ success: true, data: override });
  } catch (error) {
    console.error('updateOverride - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteOverride = async (req, res) => {
  try {
    const override = await CompanyScheduleOverride.findByIdAndDelete(req.params.id);
    if (!override) return res.status(404).json({ success: false, error: 'Override not found' });
    res.status(200).json({ success: true, message: 'Override deleted' });
  } catch (error) {
    console.error('deleteOverride - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
