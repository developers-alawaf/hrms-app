const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const companyScheduleOverrideController = require('../controllers/companyScheduleOverrideController');
const { restrictTo } = require('../middleware/auth');
// const passport = require('passport');
const { uploadCompanyLogo } = require('../middleware/upload');

router.post('/', restrictTo('Super Admin', 'Company Admin'), companyController.createCompany);
router.get('/', companyController.getCompanies);

// Schedule overrides (e.g. Ramadan) - must be before /:id
router.post('/:companyId/schedule-overrides', restrictTo('Super Admin', 'Company Admin', 'HR Manager'), async (req, res) => {
  req.body.companyId = req.params.companyId;
  try {
    await companyScheduleOverrideController.createOverride(req, res);
  } catch (err) {
    console.error('[company] createOverride route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create schedule override' });
  }
});
router.get('/:companyId/schedule-overrides', companyScheduleOverrideController.getOverridesByCompany);

router.get('/:id', companyController.getCompanyById);
router.put('/:id', restrictTo('Super Admin', 'Company Admin'), companyController.updateCompany);

router.put('/schedule-overrides/:id', restrictTo('Super Admin', 'Company Admin', 'HR Manager'), companyScheduleOverrideController.updateOverride);
router.delete('/schedule-overrides/:id', restrictTo('Super Admin', 'Company Admin', 'HR Manager'), companyScheduleOverrideController.deleteOverride);

module.exports = router;