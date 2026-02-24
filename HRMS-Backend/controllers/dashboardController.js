const mongoose = require('mongoose');
const Employee = require('../models/employee');
const EmployeesAttendance = require('../models/employeesAttendance');
const Payslip = require('../models/payslip');
const LeaveRequest = require('../models/leaveRequest');
const HolidayCalendar = require('../models/holidayCalendar');
const moment = require('moment-timezone');

/** Safe access to req.user - never throws, handles undefined or malformed req.user */
function getUser(req) {
  try {
    const u = req && req.user;
    if (!u || typeof u !== 'object') return null;
    return {
      employeeId: u.employeeId,
      companyId: u.companyId,
      email: u.email,
      fullName: u.fullName,
      role: u.role
    };
  } catch {
    return null;
  }
}

exports.getEmployeeDashboard = async (req, res) => {
  try {
    console.log('[dashboard] getEmployeeDashboard hit');
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const employeeId = user.employeeId;
    const companyId = user.companyId;
    if (!employeeId || !companyId) {
      // Return 200 with minimal data so dashboard still shows in production (e.g. Super Admin)
      console.log('[dashboard] no employeeId/companyId, returning 200 minimal');
      const fallbackName = user.email || user.fullName || 'User';
      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            fullName: fallbackName,
            employeeCode: null,
            designation: null,
            department: null,
            joiningDate: null,
            email: user.email || null,
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
            fullName: user.email || user.fullName || 'User',
            employeeCode: null,
            designation: null,
            department: null,
            joiningDate: null,
            email: user.email || null,
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
    const [companyCal, globalCal] = await Promise.all([
      HolidayCalendar.findOne({ companyId, year: currentYear }).lean(),
      HolidayCalendar.findOne({ companyId: null, year: currentYear }).lean()
    ]);
    const allHolidays = [...(companyCal?.holidays || []), ...(globalCal?.holidays || [])];

    const upcomingHolidays = allHolidays.filter(h => {
      const holidayDate = moment(h.startDate || h.date);
      return holidayDate.isBetween(moment().startOf('day'), moment().add(30, 'days').endOf('day'));
    });

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
        date: moment(h.startDate || h.date).format('YYYY-MM-DD'),
        name: h.name,
        type: h.type
      }))
    };

    console.log('[dashboard] getEmployeeDashboard 200 with data');
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('[dashboard] getEmployeeDashboard error:', error);
    return res.status(500).json({ success: false, error: 'Server error loading dashboard' });
  }
};

// 🔹 Admin/company-level dashboard stats (always returns numeric fields for consistent UI)
exports.getDashboardStats = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka');
    const dayStart = today.clone().startOf('day').toDate();
    const dayEnd = today.clone().endOf('day').toDate();

    const user = getUser(req);
    const companyId = user?.companyId;
    const companyFilter = companyId ? { companyId } : {};

    const totalEmployees = Number(await Employee.countDocuments(companyFilter)) || 0;
    const activeEmployees = Number(
      await Employee.countDocuments({ ...companyFilter, employeeStatus: 'active' })
    ) || 0;
    const inactiveEmployees = Math.max(0, totalEmployees - activeEmployees);

    // Count anyone who has checked in (in time) today as present — not only status 'Present'
    const presentToday = Number(await EmployeesAttendance.countDocuments({
      ...companyFilter,
      date: { $gte: dayStart, $lte: dayEnd },
      check_in: { $exists: true, $ne: null },
    })) || 0;

    const remoteToday = Number(await EmployeesAttendance.countDocuments({
      ...companyFilter,
      date: { $gte: dayStart, $lte: dayEnd },
      status: 'Remote',
    })) || 0;

    const leaveToday = Number(await LeaveRequest.countDocuments({
      ...companyFilter,
      status: 'approved',
      startDate: { $lte: dayEnd },
      endDate: { $gte: dayStart },
    })) || 0;

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
// Super Admin: may pass ?employeeId=xxx to get month summary for any employee
exports.getMonthSummary = async (req, res) => {
  try {
    console.log('[dashboard] getMonthSummary hit');
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    let employeeId = user.employeeId;
    let companyId = user.companyId;

    // Super Admin: allow ?employeeId=xxx to view any employee's month summary
    const queryEmployeeId = req.query.employeeId;
    if (user.role === 'Super Admin' && queryEmployeeId && mongoose.Types.ObjectId.isValid(queryEmployeeId)) {
      const targetEmp = await Employee.findById(queryEmployeeId).select('companyId').lean();
      if (targetEmp) {
        employeeId = new mongoose.Types.ObjectId(queryEmployeeId);
        companyId = targetEmp.companyId;
      }
    }

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
    const yesterday = today.clone().subtract(1, 'day');

    // Get employee's shift for weekend days and working hours
    const employee = await Employee.findById(employeeId).populate('shiftId', 'weekendDays workingHours').lean();
    const weekendDays = employee?.shiftId?.weekendDays || [5, 6];
    const shiftWorkingHours = Number(employee?.shiftId?.workingHours) || 8;

    // Working days = non-weekend, non-holiday days from 1st of month to yesterday (exclude today)
    const [companyCal, globalCal] = await Promise.all([
      HolidayCalendar.findOne({ companyId, year: monthStart.year() }).lean(),
      HolidayCalendar.findOne({ companyId: null, year: monthStart.year() }).lean()
    ]);
    const allHolidays = [...(companyCal?.holidays || []), ...(globalCal?.holidays || [])];
    const holidayDates = new Set();
    if (allHolidays.length) {
      allHolidays.forEach((h) => {
        const start = moment(h.startDate).tz(tz).startOf('day');
        const end = h.endDate ? moment(h.endDate).tz(tz).startOf('day') : start;
        for (let d = moment(start); d.isSameOrBefore(end, 'day'); d.add(1, 'day')) {
          if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(yesterday, 'day')) {
            holidayDates.add(d.format('YYYY-MM-DD'));
          }
        }
      });
    }

    let workingDays = 0;
    for (let d = moment(monthStart); d.isSameOrBefore(yesterday, 'day'); d.add(1, 'day')) {
      const dayNum = d.day(); // 0=Sun, 1=Mon, ..., 6=Sat
      const isWeekend = weekendDays.includes(dayNum);
      const isHoliday = holidayDates.has(d.format('YYYY-MM-DD'));
      if (!isWeekend && !isHoliday) workingDays++;
    }

    const monthStartDate = monthStart.toDate();
    const endDate = yesterday.toDate();

    const records = await EmployeesAttendance.find({
      employeeId,
      companyId,
      date: { $gte: monthStartDate, $lte: endDate },
    })
      .select('status work_hours')
      .lean();

    const presentDays = records.filter((r) => r.status === 'Present').length;
    const incompleteDays = records.filter((r) => r.status === 'Incomplete').length;
    const remoteDays = records.filter((r) => r.status === 'Remote').length;
    const leaveDays = records.filter((r) => r.status === 'Leave').length;
    // Absent = working days minus (present + incomplete + remote + leave); weekend/holiday are NOT working days
    const attendedDays = presentDays + incompleteDays + remoteDays + leaveDays;
    const absentDays = Math.max(0, workingDays - attendedDays);

    // Late by / Overtime: compare actual total work hours vs expected (on days they punched)
    // Expected = (presentDays + incompleteDays) * shift hours per day
    // Actual > expected → Overtime. Actual < expected → Late by (deficit)
    const punchedDays = presentDays + incompleteDays;
    const actualWorkHours = records
      .filter((r) => r.status === 'Present' || r.status === 'Incomplete')
      .reduce((sum, r) => sum + (Number(r.work_hours) || 0), 0);
    const expectedWorkHours = punchedDays * shiftWorkingHours;
    const diffMinutes = Math.round((actualWorkHours - expectedWorkHours) * 60);
    const totalLateByMinutes = diffMinutes < 0 ? Math.abs(diffMinutes) : 0;
    const totalOvertimeMinutes = diffMinutes > 0 ? diffMinutes : 0;

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

/**
 * Combined dashboard: employee data + stats + month summary in one response.
 * Primary endpoint - single route, avoids nested path issues.
 */
exports.getDashboardAll = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const isSuperAdmin = user.role === 'Super Admin';
    const employeeId = user.employeeId;
    const companyId = user.companyId;
    const fallbackName = user.email || user.fullName || 'User';
    const tz = 'Asia/Dhaka';
    const today = moment().tz(tz);
    const dayStart = today.clone().startOf('day').toDate();
    const dayEnd = today.clone().endOf('day').toDate();
    const companyFilter = companyId ? { companyId } : {};

    const minimalEmployee = {
      personalInfo: { fullName: fallbackName, employeeCode: null, designation: null, department: null, joiningDate: null, email: user.email || null, phone: null },
      attendance: [], payslips: [], leaveRequests: [], holidays: []
    };
    const zeroMonth = { workingDays: 0, presentDays: 0, absentDays: 0, remoteDays: 0, leaveDays: 0, totalLateByMinutes: 0, totalOvertimeMinutes: 0, month: moment().tz(tz).format('YYYY-MM') };
    const zeroStats = { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0, presentToday: 0, absentToday: 0, remoteToday: 0, leaveToday: 0 };

    let employeeData = minimalEmployee;
    if (employeeId && companyId) {
      const employee = await Employee.findOne({ _id: employeeId, companyId }).select('fullName newEmployeeCode designation assignedDepartment joiningDate email personalPhoneNumber');
      if (employee) {
        const startDate = moment().tz(tz).subtract(7, 'days').startOf('day');
        const [attendance, payslips, leaveRequests, companyCal, globalCal] = await Promise.all([
          EmployeesAttendance.find({ employeeId, companyId, date: { $gte: startDate.toDate() } }).select('date check_in check_out work_hours status leave_type').lean(),
          Payslip.find({ employeeId, companyId, month: { $gte: moment().subtract(3, 'months').format('YYYY-MM') } }).select('month netPay status generatedDate').lean(),
          LeaveRequest.find({ employeeId, companyId, startDate: { $gte: moment().startOf('day').toDate() } }).select('startDate endDate type status isHalfDay').lean(),
          HolidayCalendar.findOne({ companyId, year: moment().year() }).lean(),
          HolidayCalendar.findOne({ companyId: null, year: moment().year() }).lean()
        ]);
        const allHolidays = [...(companyCal?.holidays || []), ...(globalCal?.holidays || [])];
        const upcomingHolidays = allHolidays.filter(h => moment(h.startDate || h.date).isBetween(moment().startOf('day'), moment().add(30, 'days').endOf('day')));
        employeeData = {
          personalInfo: { fullName: employee.fullName, employeeCode: employee.newEmployeeCode, designation: employee.designation, department: employee.assignedDepartment, joiningDate: moment(employee.joiningDate).format('YYYY-MM-DD'), email: employee.email, phone: employee.personalPhoneNumber },
          attendance: attendance.map(a => ({ date: moment(a.date).tz(tz).format('YYYY-MM-DD'), check_in: a.check_in ? moment(a.check_in).tz(tz).format('HH:mm:ss') : null, check_out: a.check_out ? moment(a.check_out).tz(tz).format('HH:mm:ss') : null, work_hours: a.work_hours != null ? a.work_hours.toFixed(2) : null, status: a.status, leave_type: a.leave_type })),
          payslips: payslips.map(p => ({ month: p.month, netPay: p.netPay, status: p.status, generatedDate: moment(p.generatedDate).format('YYYY-MM-DD') })),
          leaveRequests: leaveRequests.map(l => ({ startDate: moment(l.startDate).format('YYYY-MM-DD'), endDate: moment(l.endDate).format('YYYY-MM-DD'), type: l.type, status: l.status, isHalfDay: l.isHalfDay })),
          holidays: upcomingHolidays.map(h => ({ date: moment(h.startDate || h.date).format('YYYY-MM-DD'), name: h.name, type: h.type }))
        };
      }
    }

    let stats = isSuperAdmin ? zeroStats : null;
    if (isSuperAdmin) {
      const totalEmployees = Number(await Employee.countDocuments(companyFilter)) || 0;
      const activeEmployees = Number(await Employee.countDocuments({ ...companyFilter, employeeStatus: 'active' })) || 0;
      const presentToday = Number(await EmployeesAttendance.countDocuments({ ...companyFilter, date: { $gte: dayStart, $lte: dayEnd }, check_in: { $exists: true, $ne: null } })) || 0;
      const remoteToday = Number(await EmployeesAttendance.countDocuments({ ...companyFilter, date: { $gte: dayStart, $lte: dayEnd }, status: 'Remote' })) || 0;
      const leaveToday = Number(await LeaveRequest.countDocuments({ ...companyFilter, status: 'approved', startDate: { $lte: dayEnd }, endDate: { $gte: dayStart } })) || 0;
      stats = { totalEmployees, activeEmployees, inactiveEmployees: Math.max(0, totalEmployees - activeEmployees), presentToday, absentToday: Math.max(0, activeEmployees - presentToday - remoteToday - leaveToday), remoteToday, leaveToday };
    }

    let monthSummary = zeroMonth;
    if (employeeId && companyId) {
      const monthStart = moment().tz(tz).startOf('month');
      const todayM = moment().tz(tz).startOf('day');
      const yesterdayM = todayM.clone().subtract(1, 'day');
      const emp = await Employee.findById(employeeId).populate('shiftId', 'weekendDays workingHours').lean();
      const weekendDays = emp?.shiftId?.weekendDays || [5, 6];
      const shiftWorkingHours = Number(emp?.shiftId?.workingHours) || 8;
      const [companyCal, globalCal] = await Promise.all([
        HolidayCalendar.findOne({ companyId, year: monthStart.year() }).lean(),
        HolidayCalendar.findOne({ companyId: null, year: monthStart.year() }).lean()
      ]);
      const allHolidays = [...(companyCal?.holidays || []), ...(globalCal?.holidays || [])];
      const holidayDates = new Set();
      if (allHolidays.length) {
        allHolidays.forEach(h => {
          const start = moment(h.startDate).tz(tz).startOf('day');
          const end = h.endDate ? moment(h.endDate).tz(tz).startOf('day') : start;
          for (let d = moment(start); d.isSameOrBefore(end, 'day'); d.add(1, 'day')) {
            if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(yesterdayM, 'day')) holidayDates.add(d.format('YYYY-MM-DD'));
          }
        });
      }
      let workingDays = 0;
      for (let d = moment(monthStart); d.isSameOrBefore(yesterdayM, 'day'); d.add(1, 'day')) {
        const dayNum = d.day();
        const isWeekend = weekendDays.includes(dayNum);
        const isHoliday = holidayDates.has(d.format('YYYY-MM-DD'));
        if (!isWeekend && !isHoliday) workingDays++;
      }
      const records = await EmployeesAttendance.find({ employeeId, companyId, date: { $gte: monthStart.toDate(), $lte: yesterdayM.toDate() } }).select('status work_hours').lean();
      const presentDays = records.filter(r => r.status === 'Present').length;
      const incompleteDays = records.filter(r => r.status === 'Incomplete').length;
      const remoteDays = records.filter(r => r.status === 'Remote').length;
      const leaveDays = records.filter(r => r.status === 'Leave').length;
      const attendedDays = presentDays + incompleteDays + remoteDays + leaveDays;
      const punchedDays = presentDays + incompleteDays;
      const actualWorkHours = records.filter(r => r.status === 'Present' || r.status === 'Incomplete').reduce((s, r) => s + (Number(r.work_hours) || 0), 0);
      const expectedWorkHours = punchedDays * shiftWorkingHours;
      const diffMinutes = Math.round((actualWorkHours - expectedWorkHours) * 60);
      const totalLateByMinutes = diffMinutes < 0 ? Math.abs(diffMinutes) : 0;
      const totalOvertimeMinutes = diffMinutes > 0 ? diffMinutes : 0;
      monthSummary = {
        workingDays, presentDays, remoteDays, leaveDays,
        absentDays: Math.max(0, workingDays - attendedDays),
        totalLateByMinutes,
        totalOvertimeMinutes,
        month: moment().tz(tz).format('YYYY-MM')
      };
    }

    res.status(200).json({ success: true, data: { employeeData, stats, monthSummary } });
  } catch (error) {
    console.error('[dashboard] getDashboardAll error:', error);
    res.status(500).json({ success: false, error: 'Server error loading dashboard' });
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