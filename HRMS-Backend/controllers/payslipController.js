const Payslip = require('../models/payslip');
const Salary = require('../models/salary');
const EmployeesAttendance = require('../models/employeesAttendance');
const LeaveRequest = require('../models/leaveRequest');
const HolidayCalendar = require('../models/holidayCalendar');
const Employee = require('../models/employee');
const moment = require('moment-timezone');

const TZ = 'Asia/Dhaka';

exports.generatePayslip = async (req, res) => {
  try {
    const { employeeId, month } = req.body;
    if (!employeeId || !month) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const companyId = req.user.companyId;
    const salary = await Salary.findOne({ employeeId, companyId, effectiveDate: { $lte: moment(month, 'YYYY-MM').endOf('month').toDate() } }).sort({ effectiveDate: -1 });
    if (!salary) {
      return res.status(404).json({ success: false, error: 'Salary not found' });
    }

    const startDate = moment(month, 'YYYY-MM').tz(TZ).startOf('month').toDate();
    const endDate = moment(month, 'YYYY-MM').tz(TZ).endOf('month').toDate();
    const attendance = await EmployeesAttendance.find({ employeeId, companyId, date: { $gte: startDate, $lte: endDate } });
    const leaveRequests = await LeaveRequest.find({ employeeId, companyId, status: 'approved', startDate: { $lte: endDate }, endDate: { $gte: startDate } });

    // Working days = non-weekend, non-holiday days (holidays must NOT be counted)
    const employee = await Employee.findById(employeeId).populate('shiftId', 'weekendDays').lean();
    const weekendDays = employee?.shiftId?.weekendDays ?? [5, 6]; // Default Fri, Sat
    const monthStart = moment(month, 'YYYY-MM').tz(TZ).startOf('month');
    const monthEnd = moment(month, 'YYYY-MM').tz(TZ).endOf('month');
    const companyIdForCal = companyId ?? null;
    const [companyCal, globalCal] = await Promise.all([
      HolidayCalendar.findOne({ companyId: companyIdForCal, year: monthStart.year() }).lean(),
      HolidayCalendar.findOne({ companyId: null, year: monthStart.year() }).lean()
    ]);
    const allHolidays = [...(companyCal?.holidays || []), ...(globalCal?.holidays || [])];
    const holidayDates = new Set();
    allHolidays.forEach((h) => {
      const start = moment(h.startDate).tz(TZ).startOf('day');
      const end = h.endDate ? moment(h.endDate).tz(TZ).startOf('day') : start;
      for (let d = moment(start); d.isSameOrBefore(end, 'day'); d.add(1, 'day')) {
        if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(monthEnd, 'day')) {
          holidayDates.add(d.format('YYYY-MM-DD'));
        }
      }
    });
    let workDays = 0;
    for (let d = moment(monthStart); d.isSameOrBefore(monthEnd, 'day'); d.add(1, 'day')) {
      const dayNum = d.day();
      const isWeekend = weekendDays.includes(dayNum);
      const isHoliday = holidayDates.has(d.format('YYYY-MM-DD'));
      if (!isWeekend && !isHoliday) workDays++;
    }

    const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Incomplete').length;
    const leaveDays = leaveRequests.reduce((sum, lr) => sum + moment(lr.endDate).diff(moment(lr.startDate), 'days') + 1, 0);
    const absentDays = Math.max(0, workDays - presentDays - leaveDays);

    const netPay = salary.basicSalary + salary.allowances.reduce((sum, a) => sum + a.amount, 0) - salary.deductions.reduce((sum, d) => sum + d.amount, 0);

    const payslip = new Payslip({
      companyId,
      employeeId,
      month,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netPay,
      workDays,
      presentDays,
      leaveDays,
      absentDays,
      status: 'generated',
      generatedDate: new Date()
    });
    await payslip.save();
    res.status(201).json({ success: true, data: payslip });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getPayslips = async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const query = req.user.role === 'Employee' ? { employeeId: req.user.employeeId, companyId: req.user.companyId } : 
                 req.user.role === 'Manager' ? { companyId: req.user.companyId } : {};
    if (employeeId) {
      query.employeeId = employeeId;
      if (req.user.role === 'Employee' && req.user.employeeId.toString() !== employeeId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }
    if (month) {
      query.month = month;
    }
    const payslips = await Payslip.find(query).populate('employeeId', 'fullName newEmployeeCode');
    res.status(200).json({ success: true, data: payslips });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};