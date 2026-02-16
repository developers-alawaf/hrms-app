const mongoose = require('mongoose');
const Employee = require('../models/employee');
const EmployeesAttendance = require('../models/employeesAttendance');
const Payslip = require('../models/payslip');
const LeaveRequest = require('../models/leaveRequest');
const HolidayCalendar = require('../models/holidayCalendar');
const moment = require('moment-timezone');

exports.getEmployeeDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { employeeId, companyId } = req.user;
    if (!employeeId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'User is not linked to an employee. Dashboard is available for users with an employee record.',
      });
    }

    const employee = await Employee.findOne({ _id: employeeId, companyId }).select(
      'fullName newEmployeeCode designation assignedDepartment joiningDate email personalPhoneNumber'
    );
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
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

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// 🔹 Admin/company-level dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day');

    const totalEmployees = await Employee.countDocuments();

    const presentToday = await EmployeesAttendance.countDocuments({
      date: today.toDate(),
      status: 'Present'
    });

    const remoteToday = await EmployeesAttendance.countDocuments({
      date: today.toDate(),
      status: 'Remote'
    });

    const leaveToday = await LeaveRequest.countDocuments({
      status: 'Approved',
      startDate: { $lte: today.toDate() },
      endDate: { $gte: today.toDate() }
    });

    // Absent = total employees minus (present + remote + on leave) from attendance/leave data
    const absentToday = Math.max(0, totalEmployees - presentToday - remoteToday - leaveToday);

    res.json({
      totalEmployees,
      presentToday,
      absentToday,
      remoteToday,
      leaveToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List of employees absent today (not present, not remote, not on leave)
exports.getAbsentToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();

    const presentRecords = await EmployeesAttendance.find({
      date: today,
      status: 'Present'
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

// List of employees present today (for dashboard)
exports.getPresentToday = async (req, res) => {
  try {
    const today = moment().tz('Asia/Dhaka').startOf('day').toDate();
    const list = await EmployeesAttendance.find({
      date: today,
      status: 'Present'
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