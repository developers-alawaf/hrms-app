const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate('jwt', { session: false }));

// Get activity logs with filters
router.get('/', activityLogController.getActivityLogs);

// Get activity statistics
router.get('/stats', activityLogController.getActivityStats);

// Get specific activity log by ID
router.get('/:id', activityLogController.getActivityLogById);

// Get activity logs for a specific user
router.get('/user/:userId', activityLogController.getUserActivityLogs);

// Get activity logs for a specific entity
router.get('/entity/:entityType/:entityId', activityLogController.getEntityActivityLogs);

module.exports = router;

