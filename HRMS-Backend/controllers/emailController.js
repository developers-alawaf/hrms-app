const Employee = require('../models/employee');
const User = require('../models/user');
const emailService = require('../services/emailService');

/**
 * Send email to one or more employees (Super Admin only)
 * Body: { employeeIds: string[], subject: string, message: string }
 */
exports.sendEmailToEmployees = async (req, res) => {
  try {
    const { employeeIds, subject, message } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one employee must be selected.' });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required.' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const emails = [];
    const noEmail = [];

    for (const empId of employeeIds) {
      const managerUser = await User.findOne({ employeeId: empId }).select('email').lean();
      const employee = await Employee.findById(empId).select('fullName email').lean();
      const email = managerUser?.email || employee?.email;
      if (email) {
        emails.push(email);
      } else {
        noEmail.push(employee?.fullName || empId);
      }
    }

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'None of the selected employees have an email address on file.',
        noEmail
      });
    }

    const result = await emailService.sendCustomEmail({
      to: emails,
      subject: subject.trim(),
      text: message.trim(),
      html: message.trim().replace(/\n/g, '<br>')
    });

    if (!result.sent) {
      return res.status(500).json({
        success: false,
        error: result.reason || 'Failed to send email.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Email sent to ${emails.length} recipient(s) successfully.`,
      sentCount: emails.length,
      noEmailCount: noEmail.length,
      noEmail: noEmail.length > 0 ? noEmail : undefined
    });
  } catch (error) {
    console.error('[EmailController] sendEmailToEmployees error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
