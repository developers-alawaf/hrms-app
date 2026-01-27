const ShiftManagement = require('../models/shiftManagement');
const Employee = require('../models/employee');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const moment = require('moment-timezone');

// Shift Definition Management
exports.createShift = async (req, res) => {
    try {
        const { name, shiftCode, officeStartTime, officeEndTime, wfhStartTime, wfhEndTime, isFingerprintRequired, isApprovalRequired, isOffDay } = req.body;
        const shift = new ShiftManagement({
            recordType: 'ShiftDefinition',
            name,
            shiftCode,
            officeStartTime,
            officeEndTime,
            wfhStartTime,
            wfhEndTime,
            isFingerprintRequired,
            isApprovalRequired,
            isOffDay
        });
        await shift.save();
        res.status(201).json({ message: 'Shift created successfully', shift });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Error creating shift', error: `Shift code '${req.body.shiftCode}' already exists.` });
        }
        res.status(500).json({ message: 'Error creating shift', error: error.message });
    }
};

exports.listShifts = async (req, res) => {
    try {
        const shifts = await ShiftManagement.find({ recordType: 'ShiftDefinition' });
        res.status(200).json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shifts', error: error.message });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const shift = await ShiftManagement.findOneAndUpdate(
            { _id: id, recordType: 'ShiftDefinition' },
            updateData,
            { new: true }
        );
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.status(200).json({ message: 'Shift updated successfully', shift });
    } catch (error) {
        res.status(500).json({ message: 'Error updating shift', error: error.message });
    }
};

// Roster Management
exports.generateRoster = async (req, res) => {
    try {
        const { month, rosters } = req.body; // rosters is an array of { employeeId, date, shiftId, isOff }

        if (!rosters || !Array.isArray(rosters)) {
            return res.status(400).json({ message: 'Invalid roster data' });
        }

        // Validate all roster entries before processing
        const Employee = require('../models/employee');
        const ShiftManagement = require('../models/shiftManagement');
        
        const employeeIds = [...new Set(rosters.map(r => r.employeeId))];
        const shiftIds = [...new Set(rosters.map(r => r.shiftId).filter(Boolean))];
        
        // Validate employees exist
        const employees = await Employee.find({ _id: { $in: employeeIds } });
        const validEmployeeIds = new Set(employees.map(e => e._id.toString()));
        const invalidEmployees = employeeIds.filter(id => !validEmployeeIds.has(id.toString()));
        
        if (invalidEmployees.length > 0) {
            return res.status(400).json({ 
                message: 'Invalid employee IDs found', 
                invalidEmployees 
            });
        }

        // Validate shifts exist (if shiftId is provided)
        if (shiftIds.length > 0) {
            const shifts = await ShiftManagement.find({ 
                _id: { $in: shiftIds },
                recordType: 'ShiftDefinition'
            });
            const validShiftIds = new Set(shifts.map(s => s._id.toString()));
            const invalidShifts = shiftIds.filter(id => !validShiftIds.has(id.toString()));
            
            if (invalidShifts.length > 0) {
                return res.status(400).json({ 
                    message: 'Invalid shift IDs found', 
                    invalidShifts 
                });
            }
        }

        // Normalize dates to start of day (UTC) for proper matching
        // Handle both YYYY-MM-DD format and Date objects
        const normalizeDate = (dateStr) => {
            let date;
            if (typeof dateStr === 'string') {
                // Parse YYYY-MM-DD format directly to avoid timezone issues
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                    const day = parseInt(parts[2], 10);
                    date = new Date(Date.UTC(year, month, day));
                } else {
                    date = new Date(dateStr);
                }
            } else {
                date = new Date(dateStr);
            }
            // Ensure we're using UTC to avoid timezone shifts
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        };

        const operations = rosters.map(r => {
            // Validate date format
            const rosterDate = normalizeDate(r.date);
            if (isNaN(rosterDate.getTime())) {
                throw new Error(`Invalid date format: ${r.date}`);
            }

            const filter = {
                recordType: 'Roster',
                employee: r.employeeId,
                date: rosterDate
            };
            const update = {
                $set: {
                    month,
                    recordType: 'Roster',
                    employee: r.employeeId,
                    date: rosterDate,
                    // Use 'shift' to match the model schema, taking value from 'shiftId'
                    shift: r.shiftId || null,
                    isOff: r.isOff || false,
                }
            };
            return {
                updateOne: {
                    filter: filter,
                    update: update,
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            await ShiftManagement.bulkWrite(operations);
        }

        res.status(201).json({ message: 'Roster processed successfully' });
    } catch (error) {
        console.error("Error processing roster:", error);
        res.status(500).json({ message: 'Error processing roster', error: error.message });
    }
};

exports.getEmployeeRoster = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month } = req.query; // Expects YYYY-MM format

        if (!month) {
            return res.status(400).json({ success: false, message: 'Month query parameter is required.' });
        }

        // Create a date range for the given month (normalized to UTC)
        const startDate = new Date(Date.UTC(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1));
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Go to the last day of the previous month (which is the current month)
        endDate.setHours(23, 59, 59, 999);

        const query = {
            recordType: 'Roster',
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };

        if (employeeId && employeeId !== 'all') {
            query.employee = employeeId;
        }

        const roster = await ShiftManagement.find(query)
            .populate({
                path: 'shift',
                model: 'ShiftManagement' // Explicitly specifying model for ShiftDefinition
            })
            .populate('employee');

        // Return data in a wrapped object as requested
        res.status(200).json({ success: true, data: roster });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching roster', error: error.message });
    }
};

// Get assigned shift for a specific date (for current employee)
exports.getAssignedShiftForDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date query parameter is required (YYYY-MM-DD format).' });
        }

        const employee = await Employee.findById(req.user.employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found for this user.' });
        }

        // Use the same normalizeDate logic as in generateRoster to ensure exact match
        const normalizeDate = (dateStr) => {
            let date;
            if (typeof dateStr === 'string') {
                // Parse YYYY-MM-DD format directly to avoid timezone issues
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                    const day = parseInt(parts[2], 10);
                    date = new Date(Date.UTC(year, month, day));
                } else {
                    date = new Date(dateStr);
                }
            } else {
                date = new Date(dateStr);
            }
            // Ensure we're using UTC to avoid timezone shifts
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        };

        const requestDate = normalizeDate(date);
        
        const rosterAssignment = await ShiftManagement.findOne({
            recordType: 'Roster',
            employee: employee._id,
            date: requestDate
        }).populate({
            path: 'shift',
            model: 'ShiftManagement',
            match: { recordType: 'ShiftDefinition' },
            select: '_id name shiftCode officeStartTime officeEndTime wfhStartTime wfhEndTime'
        });

        if (!rosterAssignment || !rosterAssignment.shift) {
            return res.status(200).json({ 
                success: true, 
                data: null,
                message: 'No shift assigned for this date.' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: {
                shift: rosterAssignment.shift,
                date: date
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching assigned shift', error: error.message });
    }
};

exports.deleteRosterEntry = async (req, res) => {
    try {
        const { employeeId, date } = req.query;

        if (!employeeId || !date) {
            return res.status(400).json({ message: 'Employee ID and date are required' });
        }

        // Normalize date to UTC start of day to match how we store dates
        let normalizedDate;
        if (typeof date === 'string' && date.includes('-')) {
            const parts = date.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                const day = parseInt(parts[2], 10);
                normalizedDate = new Date(Date.UTC(year, month, day));
            } else {
                normalizedDate = new Date(date);
                normalizedDate = new Date(Date.UTC(normalizedDate.getUTCFullYear(), normalizedDate.getUTCMonth(), normalizedDate.getUTCDate()));
            }
        } else {
            normalizedDate = new Date(date);
            normalizedDate = new Date(Date.UTC(normalizedDate.getUTCFullYear(), normalizedDate.getUTCMonth(), normalizedDate.getUTCDate()));
        }

        const result = await ShiftManagement.findOneAndDelete({
            recordType: 'Roster',
            employee: employeeId,
            date: normalizedDate,
        });

        if (!result) {
            // It's not an error if the entry doesn't exist, could have been already deleted
            return res.status(200).json({ message: 'Roster entry not found or already deleted' });
        }

        res.status(200).json({ message: 'Roster entry deleted successfully' });
    } catch (error) {
        console.error("Error deleting roster entry:", error);
        res.status(500).json({ message: 'Error deleting roster entry', error: error.message });
    }
};

// WFH Request
exports.submitWFHRequest = async (req, res) => {
    try {
        const { date, wfhShiftId } = req.body;
        const employee = await Employee.findById(req.user.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found for this user.' });
        }

        // Check if employee has a roster assignment for this date
        // Use the same normalizeDate logic as in generateRoster to ensure exact match
        const normalizeDate = (dateStr) => {
            let date;
            if (typeof dateStr === 'string') {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    date = new Date(Date.UTC(year, month, day));
                } else {
                    date = new Date(dateStr);
                }
            } else {
                date = new Date(dateStr);
            }
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        };
        
        const requestDate = normalizeDate(date);
        
        const rosterAssignment = await ShiftManagement.findOne({
            recordType: 'Roster',
            employee: employee._id,
            date: requestDate
        }).populate({
            path: 'shift',
            model: 'ShiftManagement',
            match: { recordType: 'ShiftDefinition' }
        });

        if (!rosterAssignment || !rosterAssignment.shift) {
            return res.status(400).json({ 
                message: 'You must be assigned to a shift for this date before applying for WFH.' 
            });
        }

        // Check if WFH request already exists for this date
        const existingRequest = await ShiftManagement.findOne({
            recordType: 'WFHRequest',
            employee: employee._id,
            date: requestDate,
            requestStatus: { $in: ['pending', 'approved'] }
        });

        if (existingRequest) {
            return res.status(400).json({ 
                message: 'A WFH request already exists for this date.' 
            });
        }

        const request = new ShiftManagement({
            recordType: 'WFHRequest',
            employee: employee._id,
            date: requestDate,
            wfhShift: wfhShiftId,
            requestStatus: 'pending'
        });
        await request.save();
        res.status(201).json({ message: 'WFH request submitted', request });

        // Log WFH request creation (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        const ipAddress = activityLogService.extractIpAddress(req);
        const userAgent = activityLogService.extractUserAgent(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logActivity({
                userId: userInfo.userId,
                employeeId: employee._id,
                companyId: employee.companyId,
                action: 'CREATE_LEAVE_REQUEST', // Using leave action for remote/WFH
                entityType: 'Leave',
                entityId: request._id,
                description: `Applied for WFH/Remote work on ${new Date(date).toISOString().split('T')[0]}`,
                ipAddress,
                userAgent,
                metadata: {
                    recordType: 'WFHRequest',
                    date: date,
                    wfhShiftId: wfhShiftId
                },
                status: 'SUCCESS'
            }).catch(() => {});
        }

    } catch (error) {
        res.status(500).json({ message: 'Error submitting WFH request', error: error.message });
        
        // Log error (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logError(
                userInfo.userId,
                'CREATE_LEAVE_REQUEST',
                'Leave',
                'Failed to submit WFH request',
                error.message,
                {
                    ipAddress: activityLogService.extractIpAddress(req),
                    userAgent: activityLogService.extractUserAgent(req)
                }
            ).catch(() => {});
        }
    }
};

exports.manageWFHRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        // Find the request first to check authorization
        const request = await ShiftManagement.findOne({ _id: id, recordType: 'WFHRequest' })
            .populate('employee');
        
        if (!request) {
            return res.status(404).json({ message: 'WFH Request not found' });
        }

        // Authorization check: Super Admin can approve any, Manager can approve their team members
        const isSuperAdmin = req.user.role === 'Super Admin';
        const isHRManager = req.user.role === 'HR Manager';
        const isCompanyAdmin = req.user.role === 'Company Admin';
        
        let isAuthorized = isSuperAdmin || isHRManager || isCompanyAdmin;
        
        if (req.user.role === 'Manager') {
            // Manager can only approve requests from their team members
            const wfhEmployee = await Employee.findById(request.employee._id || request.employee);
            if (wfhEmployee && wfhEmployee.managerId && wfhEmployee.managerId.toString() === req.user.employeeId.toString()) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to approve this WFH request.' });
        }

        // Update the request
        request.requestStatus = status;
        request.approvedBy = req.user._id;
        await request.save();

        // If approved, optionally update attendance record status to 'Remote' if no office attendance
        if (status === 'approved') {
            const EmployeesAttendance = require('../models/employeesAttendance');
            const timezone = require('../utils/timezoneHelper');
            const wfhDate = timezone.parse(moment(request.date).format('YYYY-MM-DD')).startOf('day').toDate();
            
            const attendance = await EmployeesAttendance.findOne({
                employeeId: request.employee._id || request.employee,
                date: wfhDate
            });

            // Only update status if there's no office attendance (check_in/check_out)
            if (attendance && !attendance.check_in && !attendance.check_out) {
                attendance.status = 'Remote';
                await attendance.save();
            } else if (!attendance) {
                // Create attendance record if it doesn't exist
                const wfhEmployee = await Employee.findById(request.employee._id || request.employee);
                if (wfhEmployee) {
                    await EmployeesAttendance.findOneAndUpdate(
                        {
                            employeeId: wfhEmployee._id,
                            date: wfhDate
                        },
                        {
                            companyId: wfhEmployee.companyId,
                            employeeId: wfhEmployee._id,
                            date: wfhDate,
                            status: 'Remote',
                            work_hours: 0
                        },
                        { upsert: true, new: true }
                    );
                }
            }
        }

        res.status(200).json({ success: true, message: `WFH request ${status}`, data: request });

        // Log WFH approval/rejection (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        const ipAddress = activityLogService.extractIpAddress(req);
        const userAgent = activityLogService.extractUserAgent(req);
        if (userInfo && userInfo.userId) {
            const wfhEmployee = await Employee.findById(request.employee).catch(() => null);
            const action = status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE';
            const description = status === 'approved' 
                ? `Approved WFH request for ${wfhEmployee?.fullName || request.employee} on ${new Date(request.date).toISOString().split('T')[0]}`
                : `Rejected WFH request for ${wfhEmployee?.fullName || request.employee} on ${new Date(request.date).toISOString().split('T')[0]}`;
            
            activityLogService.logActivity({
                userId: userInfo.userId,
                employeeId: req.user.employeeId,
                companyId: wfhEmployee?.companyId || null,
                action: action,
                entityType: 'Leave',
                entityId: request._id,
                description: description,
                ipAddress,
                userAgent,
                metadata: {
                    recordType: 'WFHRequest',
                    requestId: request._id,
                    employeeId: request.employee,
                    date: request.date,
                    status: status
                },
                status: 'SUCCESS'
            }).catch(() => {});
        }

    } catch (error) {
        res.status(500).json({ message: 'Error managing WFH request', error: error.message });
        
        // Log error (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logError(
                userInfo.userId,
                'MANAGE_WFH_REQUEST',
                'Leave',
                'Failed to manage WFH request',
                error.message,
                {
                    entityId: req.params.id,
                    ipAddress: activityLogService.extractIpAddress(req),
                    userAgent: activityLogService.extractUserAgent(req)
                }
            ).catch(() => {});
        }
    }
};

exports.getWFHRequests = async (req, res) => {
    try {
        let query = { recordType: 'WFHRequest' };
        
        // Employees can only see their own requests
        if (req.user.role === 'Employee') {
            if (!req.user.employeeId) {
                return res.status(404).json({ message: 'Employee not found for this user.' });
            }
            const employee = await Employee.findById(req.user.employeeId);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found for this user.' });
            }
            query.employee = employee._id;
        } 
        // Managers can see requests from their team members (NOC department)
        else if (req.user.role === 'Manager') {
            if (!req.user.employeeId) {
                return res.status(404).json({ message: 'Employee not found for this user.' });
            }
            const employee = await Employee.findById(req.user.employeeId);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found for this user.' });
            }
            const Department = require('../models/department');
            const nocDepartment = await Department.findOne({ 
                name: { $regex: /noc/i },
                isActive: true 
            });
            if (nocDepartment) {
                const teamMembers = await Employee.find({ 
                    department: nocDepartment._id,
                    managerId: employee._id 
                }).select('_id');
                const teamMemberIds = teamMembers.map(emp => emp._id);
                query.employee = { $in: teamMemberIds };
            } else {
                // If no NOC department, manager sees nothing
                query.employee = { $in: [] };
            }
        }
        // Super Admin, HR Manager, Company Admin can see all
        // (query remains as { recordType: 'WFHRequest' } to show all)

        const requests = await ShiftManagement.find(query)
            .populate('employee', 'fullName newEmployeeCode')
            .populate({
                path: 'wfhShift',
                model: 'ShiftManagement',
                match: { recordType: 'ShiftDefinition' },
                select: 'name wfhStartTime wfhEndTime'
            })
            .sort({ date: -1, createdAt: -1 });
        
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching WFH requests', error: error.message });
    }
};


// Outside Work Request
exports.submitOutsideWorkRequest = async (req, res) => {
    try {
        const { date, officeShiftId, outTime, expectedReturnTime, reason } = req.body;
        const employee = await Employee.findById(req.user.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found for this user.' });
        }

        // Check if employee has a roster assignment for this date
        // Use the same normalizeDate logic as in generateRoster to ensure exact match
        const normalizeDate = (dateStr) => {
            let date;
            if (typeof dateStr === 'string') {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    date = new Date(Date.UTC(year, month, day));
                } else {
                    date = new Date(dateStr);
                }
            } else {
                date = new Date(dateStr);
            }
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        };
        
        const requestDate = normalizeDate(date);
        
        const rosterAssignment = await ShiftManagement.findOne({
            recordType: 'Roster',
            employee: employee._id,
            date: requestDate
        }).populate({
            path: 'shift',
            model: 'ShiftManagement',
            match: { recordType: 'ShiftDefinition' }
        });

        if (!rosterAssignment || !rosterAssignment.shift) {
            return res.status(400).json({ 
                message: 'You must be assigned to a shift for this date before applying for Outside Work.' 
            });
        }

        // Check if Outside Work request already exists for this date
        const existingRequest = await ShiftManagement.findOne({
            recordType: 'OutsideWorkRequest',
            employee: employee._id,
            date: requestDate,
            requestStatus: { $in: ['pending', 'approved'] }
        });

        if (existingRequest) {
            return res.status(400).json({ 
                message: 'An Outside Work request already exists for this date.' 
            });
        }

        const request = new ShiftManagement({
            recordType: 'OutsideWorkRequest',
            employee: employee._id,
            date: requestDate,
            officeShift: officeShiftId,
            outTime,
            expectedReturnTime,
            reason,
            requestStatus: 'pending'
        });

        await request.save();
        res.status(201).json({ message: 'Outside work request submitted', request });

        // Log Outside Work request creation (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        const ipAddress = activityLogService.extractIpAddress(req);
        const userAgent = activityLogService.extractUserAgent(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logActivity({
                userId: userInfo.userId,
                employeeId: employee._id,
                companyId: employee.companyId,
                action: 'CREATE_LEAVE_REQUEST', // Using leave action for remote/outside work
                entityType: 'Leave',
                entityId: request._id,
                description: `Applied for Outside Work on ${new Date(date).toISOString().split('T')[0]}`,
                ipAddress,
                userAgent,
                metadata: {
                    recordType: 'OutsideWorkRequest',
                    date: date,
                    officeShiftId: officeShiftId,
                    outTime: outTime,
                    expectedReturnTime: expectedReturnTime
                },
                status: 'SUCCESS'
            }).catch(() => {});
        }

    } catch (error) {
        res.status(500).json({ message: 'Error submitting outside work request', error: error.message });
        
        // Log error (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logError(
                userInfo.userId,
                'CREATE_LEAVE_REQUEST',
                'Leave',
                'Failed to submit Outside Work request',
                error.message,
                {
                    ipAddress: activityLogService.extractIpAddress(req),
                    userAgent: activityLogService.extractUserAgent(req)
                }
            ).catch(() => {});
        }
    }
};

exports.manageOutsideWorkRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        // Find the request first to check authorization
        const request = await ShiftManagement.findOne({ _id: id, recordType: 'OutsideWorkRequest' })
            .populate('employee');
        
        if (!request) {
            return res.status(404).json({ message: 'Outside Work Request not found' });
        }

        // Authorization check: Super Admin can approve any, Manager can approve their team members
        const isSuperAdmin = req.user.role === 'Super Admin';
        const isHRManager = req.user.role === 'HR Manager';
        const isCompanyAdmin = req.user.role === 'Company Admin';
        
        let isAuthorized = isSuperAdmin || isHRManager || isCompanyAdmin;
        
        if (req.user.role === 'Manager') {
            // Manager can only approve requests from their team members
            const outsideWorkEmployee = await Employee.findById(request.employee._id || request.employee);
            if (outsideWorkEmployee && outsideWorkEmployee.managerId && outsideWorkEmployee.managerId.toString() === req.user.employeeId.toString()) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to approve this Outside Work request.' });
        }

        // Update the request
        request.requestStatus = status;
        request.approvedBy = req.user._id;
        await request.save();

        // If approved, update attendance record (similar to WFH)
        if (status === 'approved') {
            const EmployeesAttendance = require('../models/employeesAttendance');
            const timezone = require('../utils/timezoneHelper');
            const moment = require('moment-timezone');
            const outsideWorkDate = timezone.parse(moment(request.date).format('YYYY-MM-DD')).startOf('day').toDate();
            
            const attendance = await EmployeesAttendance.findOne({
                employeeId: request.employee._id || request.employee,
                date: outsideWorkDate
            });

            // Update or create attendance record - don't overwrite existing office attendance
            const outsideWorkEmployee = await Employee.findById(request.employee._id || request.employee);
            if (outsideWorkEmployee) {
                await EmployeesAttendance.findOneAndUpdate(
                    {
                        employeeId: outsideWorkEmployee._id,
                        date: outsideWorkDate
                    },
                    {
                        companyId: outsideWorkEmployee.companyId,
                        employeeId: outsideWorkEmployee._id,
                        date: outsideWorkDate,
                        // Don't overwrite status if there's office attendance
                        $setOnInsert: {
                            status: attendance?.status || 'Present',
                            work_hours: attendance?.work_hours || 0
                        }
                    },
                    { upsert: true, new: true }
                );
            }
        }

        res.status(200).json({ success: true, message: `Outside work request ${status}`, data: request });

        // Log Outside Work approval/rejection (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        const ipAddress = activityLogService.extractIpAddress(req);
        const userAgent = activityLogService.extractUserAgent(req);
        if (userInfo && userInfo.userId) {
            const outsideWorkEmployee = await Employee.findById(request.employee._id || request.employee).catch(() => null);
            const action = status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE';
            const description = status === 'approved' 
                ? `Approved Outside Work request for ${outsideWorkEmployee?.fullName || request.employee} on ${new Date(request.date).toISOString().split('T')[0]}`
                : `Rejected Outside Work request for ${outsideWorkEmployee?.fullName || request.employee} on ${new Date(request.date).toISOString().split('T')[0]}`;
            
            activityLogService.logActivity({
                userId: userInfo.userId,
                employeeId: req.user.employeeId,
                companyId: outsideWorkEmployee?.companyId || null,
                action: action,
                entityType: 'Leave',
                entityId: request._id,
                description: description,
                ipAddress,
                userAgent,
                metadata: {
                    recordType: 'OutsideWorkRequest',
                    requestId: request._id,
                    employeeId: request.employee,
                    date: request.date,
                    status: status
                },
                status: 'SUCCESS'
            }).catch(() => {});
        }

    } catch (error) {
        res.status(500).json({ message: 'Error managing outside work request', error: error.message });
        
        // Log error (non-blocking)
        const activityLogService = require('../services/activityLogService');
        const userInfo = activityLogService.extractUserInfo(req);
        if (userInfo && userInfo.userId) {
            activityLogService.logError(
                userInfo.userId,
                'MANAGE_OUTSIDE_WORK_REQUEST',
                'Leave',
                'Failed to manage Outside Work request',
                error.message,
                {
                    entityId: req.params.id,
                    ipAddress: activityLogService.extractIpAddress(req),
                    userAgent: activityLogService.extractUserAgent(req)
                }
            ).catch(() => {});
        }
    }
};

exports.getOutsideWorkRequests = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found for this user.' });
        }

        let query = { recordType: 'OutsideWorkRequest' };
        
        // Employees can only see their own requests
        if (req.user.role === 'Employee') {
            query.employee = employee._id;
        } 
        // Managers can see requests from their team members (NOC department)
        else if (req.user.role === 'Manager') {
            const Department = require('../models/department');
            const nocDepartment = await Department.findOne({ 
                name: { $regex: /noc/i },
                isActive: true 
            });
            if (nocDepartment) {
                const teamMembers = await Employee.find({ 
                    department: nocDepartment._id,
                    managerId: employee._id 
                }).select('_id');
                const teamMemberIds = teamMembers.map(emp => emp._id);
                query.employee = { $in: teamMemberIds };
            } else {
                // If no NOC department, manager sees nothing
                query.employee = { $in: [] };
            }
        }
        // Super Admin, HR Manager, Company Admin can see all
        // (query remains empty to show all)

        const requests = await ShiftManagement.find(query)
            .populate('employee', 'fullName newEmployeeCode')
            .populate({
                path: 'officeShift',
                model: 'ShiftManagement',
                match: { recordType: 'ShiftDefinition' },
                select: 'name officeStartTime officeEndTime'
            })
            .sort({ date: -1, createdAt: -1 });
        
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Outside Work requests', error: error.message });
    }
};


exports.uploadRoster = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 2) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'Excel file must have at least a header row and one data row.' });
        }
        
        const headers = data[0].map(h => h.toString().trim());
        const employeeRows = data.slice(1);

        const nameIndex = headers.indexOf('Name');
        const codeIndex = headers.indexOf('newEmployeeCode');

        if (codeIndex === -1) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Excel file is missing the required 'newEmployeeCode' column." });
        }

        const dateColumns = headers.map((header, index) => ({ header, index }))
                                   .filter(h => h.index !== nameIndex && h.index !== codeIndex);

        const upsertData = [];
        const deleteData = [];
        const allEmployeeCodes = new Set();
        const allShiftCodes = new Set();
        
        const parseDate = (dateStr) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(Date.UTC(year, month, day));
            }
            return new Date(dateStr);
        };

        employeeRows.forEach(row => {
            const employeeCode = row[codeIndex];
            if (!employeeCode) return;

            const empCodeStr = employeeCode.toString();
            allEmployeeCodes.add(empCodeStr);
            
            dateColumns.forEach(dateCol => {
                const shiftCode = row[dateCol.index];
                const date = parseDate(dateCol.header);

                if (shiftCode && shiftCode.toString().trim() === '-') {
                    deleteData.push({ employeeCode: empCodeStr, date });
                } else if (shiftCode) {
                    const shiftCodeStr = shiftCode.toString();
                    allShiftCodes.add(shiftCodeStr);
                    upsertData.push({
                        employeeCode: empCodeStr,
                        date,
                        shiftCode: shiftCodeStr
                    });
                }
            });
        });

        const employees = await Employee.find({ newEmployeeCode: { $in: [...allEmployeeCodes] } });
        const shifts = await ShiftManagement.find({
            recordType: 'ShiftDefinition',
            shiftCode: { $in: [...allShiftCodes] }
        });

        const employeeMap = new Map(employees.map(e => [e.newEmployeeCode, e._id]));
        const shiftMap = new Map(shifts.map(s => [s.shiftCode, s._id]));

        const rosterEntriesToUpsert = [];
        const errors = [];

        upsertData.forEach(item => {
            const employeeId = employeeMap.get(item.employeeCode);
            const shiftId = shiftMap.get(item.shiftCode);

            if (!employeeId) {
                errors.push(`Employee with code "${item.employeeCode}" not found.`);
            } else if (!shiftId) {
                errors.push(`Shift with code "${item.shiftCode}" not found for date ${item.date.toISOString().slice(0, 10)}.`);
            } else {
                rosterEntriesToUpsert.push({
                    updateOne: {
                        filter: { recordType: 'Roster', employee: employeeId, date: item.date },
                        update: {
                            $set: {
                                month: item.date.toISOString().slice(0, 7),
                                recordType: 'Roster',
                                employee: employeeId,
                                date: item.date,
                                shift: shiftId
                            }
                        },
                        upsert: true
                    }
                });
            }
        });

        const deletionConditions = deleteData
            .map(item => {
                const employeeId = employeeMap.get(item.employeeCode);
                if (employeeId) {
                    return { employee: employeeId, date: item.date };
                }
                return null;
            })
            .filter(Boolean);

        fs.unlinkSync(filePath);

        if (errors.length > 0) {
            return res.status(400).json({ message: "Errors found in Excel file.", errors: [...new Set(errors)] });
        }

        let upsertedCount = 0;
        let deletedCount = 0;

        if (rosterEntriesToUpsert.length > 0) {
            const result = await ShiftManagement.bulkWrite(rosterEntriesToUpsert);
            upsertedCount = result.upsertedCount + result.modifiedCount;
        }

        if (deletionConditions.length > 0) {
            const result = await ShiftManagement.deleteMany({
                recordType: 'Roster',
                $or: deletionConditions
            });
            deletedCount = result.deletedCount;
        }

        res.status(201).json({ 
            message: 'Roster uploaded successfully.', 
            upserted: upsertedCount,
            deleted: deletedCount
        });

    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Error processing Excel file', error: error.message });
    }
};

// Shift-based Attendance with WFH
exports.getShiftBasedAttendance = async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query; // Added employeeId
        const mongoose = require('mongoose');
        const EmployeesAttendance = require('../models/employeesAttendance');
        const Department = require('../models/department');
        const timezone = require('../utils/timezoneHelper');
        const moment = require('moment-timezone');

        // Default to current month if not provided
        const now = timezone.now();
        const defaultStart = startDate 
            ? timezone.parse(startDate).startOf('day').toDate()
            : now.clone().startOf('month').toDate();
        const defaultEnd = endDate 
            ? timezone.parse(endDate).endOf('day').toDate()
            : now.clone().endOf('month').toDate();

        let employeeIdsToFetch = [];
        let employeesToReport = [];

        // Determine which employees to fetch based on user role and employeeId query
        if (req.user.role === 'Employee') {
            // For regular employees, they can only see their own data
            if (!req.user.employeeId) {
                return res.status(403).json({ success: false, message: 'Employee ID not found for current user.' });
            }
            // Ensure the requested employeeId matches the logged-in employee's ID
            if (employeeId && employeeId.toString() !== req.user.employeeId.toString()) {
                return res.status(403).json({ success: false, message: 'Unauthorized to view other employees\' data.' });
            }

            employeeIdsToFetch.push(new mongoose.Types.ObjectId(req.user.employeeId));
            const emp = await Employee.findById(req.user.employeeId).select('_id fullName newEmployeeCode department').lean();
            if (emp) employeesToReport.push(emp);

        } else if (['HR Manager', 'Super Admin', 'Company Admin', 'Manager'].includes(req.user.role)) {
             // For authorized users, filter by NOC department or specific employeeId if provided
            const nocDepartment = await Department.findOne({
                name: { $regex: /noc/i },
                isActive: true
            });

            if (!nocDepartment) {
                return res.status(404).json({
                    success: false,
                    message: 'NOC department not found'
                });
            }

            let nocEmployeesQuery = { department: nocDepartment._id };
            if (employeeId) {
                // If an admin provides an employeeId, filter NOC employees by that ID
                nocEmployeesQuery._id = new mongoose.Types.ObjectId(employeeId);
            }

            const nocEmployees = await Employee.find(nocEmployeesQuery)
                .select('_id fullName newEmployeeCode department').lean();

            if (nocEmployees.length === 0 && !employeeId) { // No employees in NOC department, and no specific employee requested
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'No employees found in NOC department'
                });
            } else if (nocEmployees.length === 0 && employeeId) { // Specific employee requested but not found in NOC
                 return res.status(404).json({
                    success: false,
                    message: 'Employee not found in NOC department or invalid Employee ID.'
                });
            }

            employeeIdsToFetch = nocEmployees.map(emp => emp._id);
            employeesToReport = nocEmployees;

        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this data.' });
        }


        // Get roster assignments for the date range
        const rosterQuery = {
            recordType: 'Roster',
            employee: { $in: employeeIdsToFetch },
            date: { $gte: defaultStart, $lte: defaultEnd }
        };

        const rosters = await ShiftManagement.find(rosterQuery)
            .populate({
                path: 'shift',
                model: 'ShiftManagement',
                match: { recordType: 'ShiftDefinition' }
            })
            .populate('employee')
            .lean();

        // Get attendance records
        const attendanceRecords = await EmployeesAttendance.find({
            employeeId: { $in: employeeIdsToFetch },
            date: { $gte: defaultStart, $lte: defaultEnd }
        }).lean();

        // Get approved WFH requests
        const wfhRequests = await ShiftManagement.find({
            recordType: 'WFHRequest',
            employee: { $in: employeeIdsToFetch },
            date: { $gte: defaultStart, $lte: defaultEnd },
            requestStatus: 'approved'
        })
        .populate({
            path: 'wfhShift',
            model: 'ShiftManagement',
            match: { recordType: 'ShiftDefinition' }
        })
        .populate('employee')
        .lean();

        // Get approved Outside Work requests
        const outsideWorkRequests = await ShiftManagement.find({
            recordType: 'OutsideWorkRequest',
            employee: { $in: employeeIdsToFetch },
            date: { $gte: defaultStart, $lte: defaultEnd },
            requestStatus: 'approved'
        })
        .populate({
            path: 'officeShift',
            model: 'ShiftManagement',
            match: { recordType: 'ShiftDefinition' }
        })
        .populate('employee')
        .lean();

        // Helper function to calculate time difference in hours
        const calculateHours = (startTime, endTime) => {
            if (!startTime || !endTime) return 0;
            const start = moment(startTime, 'HH:mm');
            const end = moment(endTime, 'HH:mm');
            if (end.isBefore(start)) {
                end.add(1, 'day');
            }
            return end.diff(start, 'minutes') / 60;
        };

        // Helper function to format time from Date
        const formatTime = (date) => {
            if (!date) return null;
            return moment(date).format('HH:mm');
        };

        // Create a map for quick lookups
        const rosterMap = new Map();
        rosters.forEach(roster => {
            const dateStr = moment(roster.date).format('YYYY-MM-DD');
            const key = `${roster.employee._id}-${dateStr}`;
            rosterMap.set(key, roster);
        });

        const attendanceMap = new Map();
        attendanceRecords.forEach(att => {
            const dateStr = moment(att.date).format('YYYY-MM-DD');
            const key = `${att.employeeId}-${dateStr}`;
            attendanceMap.set(key, att);
        });

        const wfhMap = new Map();
        wfhRequests.forEach(wfh => {
            const dateStr = moment(wfh.date).format('YYYY-MM-DD');
            const key = `${wfh.employee._id}-${dateStr}`;
            wfhMap.set(key, wfh);
        });

        const outsideWorkMap = new Map();
        outsideWorkRequests.forEach(ow => {
            const dateStr = moment(ow.date).format('YYYY-MM-DD');
            const key = `${ow.employee._id}-${dateStr}`;
            outsideWorkMap.set(key, ow);
        });

        // Build result array
        const result = [];
        const current = moment(defaultStart);
        const endMoment = moment(defaultEnd);

        while (current.isSameOrBefore(endMoment, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            
            for (const emp of employeesToReport) { // Use employeesToReport here
                const key = `${emp._id}-${dateStr}`;
                const roster = rosterMap.get(key);
                const attendance = attendanceMap.get(key);
                const wfh = wfhMap.get(key);
                const outsideWork = outsideWorkMap.get(key);

                // Only include if there's a roster assignment or attendance record or WFH or Outside Work
                if (roster || attendance || wfh || outsideWork) {
                    const shift = roster?.shift;
                    const record = {
                        employeeId: emp._id,
                        employeeName: emp.fullName,
                        employeeCode: emp.newEmployeeCode,
                        date: dateStr,
                        shiftName: shift?.name || 'No Shift',
                        shiftCode: shift?.shiftCode || '-',
                        // Office times from fingerprint
                        officeStartTime: attendance?.check_in ? formatTime(attendance.check_in) : null,
                        officeEndTime: attendance?.check_out ? formatTime(attendance.check_out) : null,
                        // WFH times from approved request
                        wfhStartTime: wfh?.wfhShift?.wfhStartTime || null,
                        wfhEndTime: wfh?.wfhShift?.wfhEndTime || null,
                        wfhStatus: wfh ? (wfh.requestStatus === 'approved') : false,
                        // Outside Work times from approved request
                        outsideWorkOutTime: outsideWork?.outTime || null,
                        outsideWorkReturnTime: outsideWork?.expectedReturnTime || null,
                        outsideWorkStatus: outsideWork ? (outsideWork.requestStatus === 'approved') : false,
                        outsideWorkReason: outsideWork?.reason || null,
                        // Calculate hours
                        officeHours: 0,
                        wfhHours: 0,
                        outsideWorkHours: 0,
                        totalWorkHours: 0,
                        status: attendance?.status || 'Absent'
                    };

                    // Calculate office hours from fingerprint data
                    if (record.officeStartTime && record.officeEndTime && shift) {
                        // Use actual check-in/check-out times
                        const checkInMins = moment(record.officeStartTime, 'HH:mm').hours() * 60 + moment(record.officeStartTime, 'HH:mm').minutes();
                        const checkOutMins = moment(record.officeEndTime, 'HH:mm').hours() * 60 + moment(record.officeEndTime, 'HH:mm').minutes();
                        let diffMins = checkOutMins - checkInMins;
                        if (diffMins < 0) diffMins += 24 * 60; // Handle overnight
                        record.officeHours = parseFloat((diffMins / 60).toFixed(2));
                    } else if (attendance?.work_hours) {
                        // Fallback to stored work_hours
                        record.officeHours = parseFloat(attendance.work_hours.toFixed(2));
                    }

                    // Calculate WFH hours
                    if (record.wfhStatus && record.wfhStartTime && record.wfhEndTime) {
                        record.wfhHours = calculateHours(record.wfhStartTime, record.wfhEndTime);
                    }

                    // Calculate Outside Work hours (from outTime to expectedReturnTime)
                    if (record.outsideWorkStatus && record.outsideWorkOutTime && record.outsideWorkReturnTime) {
                        record.outsideWorkHours = calculateHours(record.outsideWorkOutTime, record.outsideWorkReturnTime);
                    }

                    // Total work hours = Office + WFH + Outside Work
                    record.totalWorkHours = parseFloat((record.officeHours + record.wfhHours + record.outsideWorkHours).toFixed(2));

                    result.push(record);
                }
            }
            current.add(1, 'day');
        }

        // Sort by date (newest first) then by employee name
        result.sort((a, b) => {
            if (b.date !== a.date) {
                return new Date(b.date) - new Date(a.date);
            }
            return a.employeeName.localeCompare(b.employeeName);
        });

        res.status(200).json({ 
            success: true, 
            data: result,
            totals: {
                totalRecords: result.length,
                totalEmployees: employeesToReport.length // Use employeesToReport here
            }
        });
    } catch (error) {
        console.error("Error fetching shift-based attendance:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching shift-based attendance', 
            error: error.message 
        });
    }
};
