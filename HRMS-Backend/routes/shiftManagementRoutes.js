const express = require('express');
const router = express.Router();
const shiftManagementController = require('../controllers/shiftManagementController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/uploads'); // Temporarily store files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Shift Definitions
router.post('/shifts', auth.restrictTo('HR Manager', 'Super Admin'), shiftManagementController.createShift);
router.get('/shifts', shiftManagementController.listShifts);
router.put('/shifts/:id', auth.restrictTo('HR Manager', 'Super Admin'), shiftManagementController.updateShift);

// Roster
router.post('/roster', auth.restrictTo('HR Manager', 'Super Admin'), shiftManagementController.generateRoster);
router.post('/roster/upload', auth.restrictTo('HR Manager', 'Super Admin'), upload.single('rosterFile'), shiftManagementController.uploadRoster);
router.get('/roster/assigned-shift', shiftManagementController.getAssignedShiftForDate); // Must come before /roster/:employeeId
router.get('/roster/:employeeId', shiftManagementController.getEmployeeRoster);
router.delete('/roster', auth.restrictTo('HR Manager', 'Super Admin'), shiftManagementController.deleteRosterEntry);

// WFH Requests
router.post('/wfh-requests', shiftManagementController.submitWFHRequest);
router.get('/wfh-requests', shiftManagementController.getWFHRequests);
router.put('/wfh-requests/:id/status', auth.restrictTo('HR Manager', 'Super Admin', 'Manager'), shiftManagementController.manageWFHRequest);

// Outside Work Requests
router.post('/outside-work-requests', shiftManagementController.submitOutsideWorkRequest);
router.get('/outside-work-requests', shiftManagementController.getOutsideWorkRequests);
router.put('/outside-work-requests/:id/status', auth.restrictTo('HR Manager', 'Super Admin'), shiftManagementController.manageOutsideWorkRequest);

// Shift-based Attendance
router.get('/attendance', shiftManagementController.getShiftBasedAttendance);

module.exports = router;
