const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// More specific paths first (so /month-summary is not shadowed)
router.get('/month-summary', dashboardController.getMonthSummary);
router.get('/dashboard-stats', dashboardController.getDashboardStats);
router.get('/present-today', dashboardController.getPresentToday);
router.get('/absent-today', dashboardController.getAbsentToday);
router.get('/remote-today', dashboardController.getRemoteToday);
router.get('/leave-today', dashboardController.getLeaveToday);
router.get('/', dashboardController.getEmployeeDashboard);

module.exports = router;