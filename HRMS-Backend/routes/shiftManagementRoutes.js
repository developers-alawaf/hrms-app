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

// Roster Duty (Super Admin + NOC Manager only, NOC employees only)
router.get('/roster-duty/shifts', auth.authenticateJwt, shiftManagementController.getRosterDutyShifts);
router.post('/roster-duty/shifts', auth.authenticateJwt, shiftManagementController.createRosterDutyShift);
router.put('/roster-duty/shifts/:id', auth.authenticateJwt, shiftManagementController.updateRosterDutyShift);
router.delete('/roster-duty/shifts/:id', auth.authenticateJwt, shiftManagementController.deleteRosterDutyShift);
router.get('/roster-duty/employees', auth.authenticateJwt, shiftManagementController.getRosterDutyNocEmployees);
router.get('/roster-duty/schedules', auth.authenticateJwt, shiftManagementController.getRosterDutySchedules);
router.post('/roster-duty/schedules', auth.authenticateJwt, shiftManagementController.upsertRosterDutySchedule);
router.delete('/roster-duty/schedules/:employeeId', auth.authenticateJwt, shiftManagementController.deleteRosterDutySchedule);
router.post('/roster-duty/generate-roster', auth.authenticateJwt, shiftManagementController.generateRosterFromDuty);

module.exports = router;
