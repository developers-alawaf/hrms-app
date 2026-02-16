const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getEmployeeDashboard);
router.get('/dashboard-stats', dashboardController.getDashboardStats);
router.get('/present-today', dashboardController.getPresentToday);
router.get('/absent-today', dashboardController.getAbsentToday);
router.get('/remote-today', dashboardController.getRemoteToday);
router.get('/leave-today', dashboardController.getLeaveToday);

module.exports = router;