const mongoose = require('mongoose');
const Employee = require('../models/employee');
const EmployeesAttendance = require('../models/employeesAttendance');
const Payslip = require('../models/payslip');
const LeaveRequest = require('../models/leaveRequest');
const HolidayCalendar = require('../models/holidayCalendar');
const moment = require('moment-timezone');

exports.getEmployeeDashboard = async (req, res) => {
  try {
    console.log('[dashboard] getEmployeeDashboard hit');
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const employeeId = req.user?.employeeId;
    const companyId = req.user?.companyId;
    if (!employeeId || !companyId) {
      // Return 200 with minimal data so dashboard still shows in production (e.g. Super Admin)
      console.log('[dashboard] no employeeId/companyId, returning 200 minimal');
      const fallbackName = req.user?.email || req.user?.fullName || 'User';
      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            fullName: fallbackName,
            employeeCode: null,
            designation: null,
            department: null,
            joiningDate: null,
            email: req.user?.email || null,
            phone: null,
          },
          attendance: [],
          payslips: [],
          leaveRequests: [],
          holidays: [],
        },
      });
    }

    const employee = await Employee.findOne({ _id: employeeId, companyId }).select(
      'fullName newEmployeeCode designation assignedDepartment joiningDate email personalPhoneNumber'
    );
    if (!employee) {
      console.log('[dashboard] employee not found, returning 200 minimal');
      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            fullName: req.user?.email || 'User',
            employeeCode: null,
            designation: null,
            department: null,
            joiningDate: null,
            email: req.user?.email || null,
            phone: null,
          },
          attendance: [],
          payslips: [],
          leaveRequests: [],
          holidays: [],
        },
      });
    }

    const startDate = moment().tz('Asia/Dhaka').subtract(7, 'days').startOf('day');
    const attendance = await EmployeesAttendance.find({
      employeeId,
      companyId,
      date: { $gte: startDate.toDate() }
    }).select('date check_in check_out work_hours status leave_type');

    const payslips = await Payslip.find({
      employeeId,
      companyId,
      month: { $gte: moment().subtract(3, 'months').format('YYYY-MM') }
    }).select('month netPay status generatedDate');

    const leaveRequests = await LeaveRequest.find({
      employeeId,
      companyId,
      startDate: { $gte: moment().startOf('day').toDate() }
    }).select('startDate endDate type status isHalfDay');

    const currentYear = moment().year();
    const holidayCalendar = await HolidayCalendar.findOne({ companyId, year: currentYear });

    const upcomingHolidays = holidayCalendar ? holidayCalendar.holidays.filter(h => {
      const holidayDate = moment(h.date);
      return holidayDate.isBetween(moment().startOf('day'), moment().add(30, 'days').endOf('day'));
    }) : [];

    const response = {
      personalInfo: {
        fullName: employee.fullName,
        employeeCode: employee.newEmployeeCode,
        designation: employee.designation,
        department: employee.assignedDepartment,
        joiningDate: moment(employee.joiningDate).format('YYYY-MM-DD'),
        email: employee.email,
        phone: employee.personalPhoneNumber
      },
      attendance: attendance.map(a => ({
        date: moment(a.date).tz('Asia/Dhaka').format('YYYY-MM-DD'),
        check_in: a.check_in ? moment(a.check_in).tz('Asia/Dhaka').format('HH:mm:ss') : null,
        check_out: a.check_out ? moment(a.check_out).tz('Asia/Dhaka').format('HH:mm:ss') : null,
        work_hours: a.work_hours ? a.work_hours.toFixed(2) : null,
        status: a.status,
        leave_type: a.leave_type
      })),
      payslips: payslips.map(p => ({
        month: p.month,
        netPay: p.netPay,
        status: p.status,
        generatedDate: moment(p.generatedDate).format('YYYY-MM-DD')
      })),
      leaveRequests: leaveRequests.map(l => ({
        startDate: moment(l.startDate).format('YYYY-MM-DD'),
        endDate: moment(l.endDate).format('YYYY-MM-DD'),
        type: l.type,
        status: l.status,
        isHalfDay: l.isHalfDay
      })),
      holidays: upcomingHolidays.map(h => ({
        date: moment(h.date).format('YYYY-MM-DD'),
        name: h.name,
        type: h.type
      }))
    };

    console.log('[dashboard] getEmployeeDashboard 200 with data');
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('[dashboard] getEmployeeDashboard error:', error);
    res.status(500).json({ success: false, error: 'Server error loading dashboard' });
  }
};

// 🔹 Admin/company-level dashboard stats (scoped by companyId for Super Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day');
    const todayDate = today.toDate();

    // Scope by company when user has companyId (Super Admin with linked company)
    const companyId = req.user?.companyId;
    const empFilter = companyId ? { companyId } : {};
    const attFilter = companyId ? { companyId, date: todayDate } : { date: todayDate };
    const leaveFilter = companyId
      ? { companyId, status: 'approved', startDate: { $lte: todayDate }, endDate: { $gte: todayDate } }
      : { status: 'approved', startDate: { $lte: todayDate }, endDate: { $gte: todayDate } };

    const totalEmployees = Number(await Employee.countDocuments(empFilter)) || 0;
    const activeEmployees = Number(await Employee.countDocuments({ ...empFilter, employeeStatus: 'active' })) || 0;
    const inactiveEmployees = Math.max(0, totalEmployees - activeEmployees);

    // Count anyone who has checked in today as present
    const presentToday = Number(await EmployeesAttendance.countDocuments({
      ...attFilter,
      check_in: { $exists: true, $ne: null }
    })) || 0;

    const remoteToday = Number(await EmployeesAttendance.countDocuments({
      ...attFilter,
      status: 'Remote'
    })) || 0;

    const leaveToday = Number(await LeaveRequest.countDocuments(leaveFilter)) || 0;

    // Absent = active employees minus (present + remote + on leave)
    const absentToday = Math.max(0, activeEmployees - presentToday - remoteToday - leaveToday);

    res.status(200).json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      presentToday,
      absentToday,
      remoteToday,
      leaveToday
    });
  } catch (error) {
    console.error('[dashboard] getDashboardStats error:', error);
    res.status(500).json({
      error: error.message,
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      remoteToday: 0,
      leaveToday: 0
    });
  }
};

// List of employees absent today (not present, not remote, not on leave)
exports.getAbsentToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();

    // Anyone with check-in (in time) today is considered present
    const presentRecords = await EmployeesAttendance.find({
      date: today,
      check_in: { $exists: true, $ne: null }
    })
      .select('employeeId')
      .lean();
    const presentIds = presentRecords.map((r) => r.employeeId).filter(Boolean);

    const onLeaveOrRemote = await LeaveRequest.find({
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    })
      .select('employeeId')
      .lean();
    const onLeaveOrRemoteIds = [...new Set(onLeaveOrRemote.map((r) => r.employeeId?.toString()).filter(Boolean))];
    const allExcludeStr = [...new Set([...presentIds.map((id) => id.toString()), ...onLeaveOrRemoteIds])];
    const excludeIds = allExcludeStr.map((id) => new mongoose.Types.ObjectId(id));

    const employees = await Employee.find({
      _id: { $nin: excludeIds },
      employeeStatus: 'active'
    })
      .populate({ path: 'department', select: 'name' })
      .populate({ path: 'designation', select: 'name' })
      .select('fullName newEmployeeCode department designation')
      .sort({ fullName: 1 })
      .lean();

    const absentList = employees.map((emp) => ({
      fullName: emp.fullName,
      employeeCode: emp.newEmployeeCode,
      department: emp.department?.name || '—',
      designation: emp.designation?.name || '—'
    }));

    res.json({ success: true, data: absentList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List of employees present today (for dashboard) — anyone with check-in (in time) today
exports.getPresentToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();
    const list = await EmployeesAttendance.find({
      date: today,
      check_in: { $exists: true, $ne: null }
    })
      .populate({
        path: 'employeeId',
        select: 'fullName newEmployeeCode department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'name' }
        ]
      })
      .sort({ check_in: 1 })
      .lean();

    const presentList = list
      .filter((a) => a.employeeId)
      .map((a) => ({
        fullName: a.employeeId.fullName,
        employeeCode: a.employeeId.newEmployeeCode,
        department: a.employeeId.department?.name || '—',
        designation: a.employeeId.designation?.name || '—',
        check_in: a.check_in ? moment(a.check_in).tz('Asia/Dhaka').format('HH:mm') : null,
        check_out: a.check_out ? moment(a.check_out).tz('Asia/Dhaka').format('HH:mm') : null,
        work_hours: a.work_hours != null ? Number(a.work_hours).toFixed(1) : null
      }));

    res.json({ success: true, data: presentList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List of employees working remote today (approved LeaveRequest type 'remote')
// For dashboard, we consider anyone with approved remote leave covering today as remote — even if they forgot to check in
exports.getRemoteToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();
    const list = await LeaveRequest.find({
      status: 'approved',
      type: 'remote',
      startDate: { $lte: today },
      endDate: { $gte: today }
    })
      .populate({
        path: 'employeeId',
        select: 'fullName newEmployeeCode department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'name' }
        ]
      })
      .sort({ startDate: 1 })
      .lean();

    const remoteList = list
      .filter((r) => r.employeeId)
      .map((r) => ({
        fullName: r.employeeId.fullName,
        employeeCode: r.employeeId.newEmployeeCode,
        department: r.employeeId.department?.name || '—',
        designation: r.employeeId.designation?.name || '—',
        startDate: moment(r.startDate).format('YYYY-MM-DD'),
        endDate: moment(r.endDate).format('YYYY-MM-DD')
      }));

    res.json({ success: true, data: remoteList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Current month attendance day counts for the logged-in employee (for all users with employeeId)
exports.getMonthSummary = async (req, res) => {
  try {
    console.log('[dashboard] getMonthSummary hit');
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const employeeId = req.user?.employeeId;
    const companyId = req.user?.companyId;
    if (!employeeId || !companyId) {
      // Return 200 with zeroed data so dashboard section still shows (e.g. Super Admin without employee link)
      console.log('[dashboard] getMonthSummary no employeeId/companyId, returning 200 zeroed');
      const tz = 'Asia/Dhaka';
      return res.status(200).json({
        success: true,
        data: {
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          remoteDays: 0,
          leaveDays: 0,
          totalLateByMinutes: 0,
          totalOvertimeMinutes: 0,
          month: moment().tz(tz).format('YYYY-MM'),
        },
      });
    }

    const tz = 'Asia/Dhaka';
    const monthStart = moment().tz(tz).startOf('month');
    const today = moment().tz(tz).startOf('day');

    // Working days = weekdays (Mon–Fri) from 1st of month to today inclusive, minus company holidays in that range
    const holidayCalendar = await HolidayCalendar.findOne({ companyId, year: monthStart.year() });
    const holidayDates = new Set();
    if (holidayCalendar && holidayCalendar.holidays && holidayCalendar.holidays.length) {
      holidayCalendar.holidays.forEach((h) => {
        const start = moment(h.startDate).tz(tz).startOf('day');
        const end = h.endDate ? moment(h.endDate).tz(tz).startOf('day') : start;
        for (let d = moment(start); d.isSameOrBefore(end, 'day'); d.add(1, 'day')) {
          if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(today, 'day')) {
            holidayDates.add(d.format('YYYY-MM-DD'));
          }
        }
      });
    }

    let workingDays = 0;
    for (let d = moment(monthStart); d.isSameOrBefore(today, 'day'); d.add(1, 'day')) {
      const dayOfWeek = d.isoWeekday(); // 1 = Mon, 7 = Sun
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isHoliday = holidayDates.has(d.format('YYYY-MM-DD'));
      if (isWeekday && !isHoliday) workingDays++;
    }

    const monthStartDate = monthStart.toDate();
    const todayDate = today.toDate();

    const records = await EmployeesAttendance.find({
      employeeId,
      companyId,
      date: { $gte: monthStartDate, $lte: todayDate },
    })
      .select('status lateBy overtimeHours')
      .lean();

    const presentDays = records.filter((r) => r.status === 'Present').length;
    const remoteDays = records.filter((r) => r.status === 'Remote').length;
    const leaveDays = records.filter((r) => r.status === 'Leave').length;
    // Absent = working days minus (present + remote + leave); cap at 0
    const absentDays = Math.max(0, workingDays - presentDays - remoteDays - leaveDays);

    // Total late by (minutes) and overtime (overtimeHours stored as decimal hours → convert to minutes for display)
    const totalLateByMinutes = records.reduce((sum, r) => sum + (Number(r.lateBy) || 0), 0);
    const totalOvertimeMinutes = records.reduce((sum, r) => {
      const hours = Number(r.overtimeHours);
      return sum + (Number.isNaN(hours) ? 0 : Math.round(hours * 60));
    }, 0);

    console.log('[dashboard] getMonthSummary 200', { workingDays, presentDays, absentDays, remoteDays, leaveDays });
    res.status(200).json({
      success: true,
      data: {
        workingDays,
        presentDays,
        absentDays,
        remoteDays,
        leaveDays,
        totalLateByMinutes,
        totalOvertimeMinutes,
        month: moment().tz(tz).format('YYYY-MM'),
      },
    });
  } catch (error) {
    console.error('[dashboard] getMonthSummary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// List of employees on leave today (approved LeaveRequest, type not 'remote')
exports.getLeaveToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();
    const list = await LeaveRequest.find({
      status: 'approved',
      type: { $ne: 'remote' },
      startDate: { $lte: today },
      endDate: { $gte: today }
    })
      .populate({
        path: 'employeeId',
        select: 'fullName newEmployeeCode department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'name' }
        ]
      })
      .sort({ startDate: 1 })
      .lean();

    const leaveList = list
      .filter((r) => r.employeeId)
      .map((r) => ({
        fullName: r.employeeId.fullName,
        employeeCode: r.employeeId.newEmployeeCode,
        department: r.employeeId.department?.name || '—',
        designation: r.employeeId.designation?.name || '—',
        type: r.type,
        startDate: moment(r.startDate).format('YYYY-MM-DD'),
        endDate: moment(r.endDate).format('YYYY-MM-DD'),
        isHalfDay: r.isHalfDay || false
      }));

    res.json({ success: true, data: leaveList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};