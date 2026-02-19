/**
 * Centralized Email Service for HRMS
 * Supports Laravel-style MAIL_* vars and ZOHO_* vars for backward compatibility.
 * Uses Zoho SMTP (smtp.zoho.com or smtppro.zoho.com for Mail Pro).
 */
const nodemailer = require('nodemailer');

const mailHost = process.env.MAIL_HOST || process.env.EMAIL_HOST || 'smtppro.zoho.com';
const mailPort = parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT || '465', 10);
const mailUser = process.env.MAIL_USERNAME || process.env.MAIL_FROM_ADDRESS || process.env.ZOHO_EMAIL || process.env.EMAIL_USER;
const mailPass = process.env.MAIL_PASSWORD || process.env.ZOHO_PASSWORD || process.env.EMAIL_PASS;
const mailFrom = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || process.env.ZOHO_EMAIL || mailUser;
const mailFromName = process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'HRMS';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!mailUser || !mailPass) {
      console.warn('[EmailService] Mail not configured: MAIL_USERNAME/MAIL_PASSWORD or ZOHO_EMAIL/ZOHO_PASSWORD required.');
      return null;
    }
    // Port 465 = implicit SSL (secure: true)
    // Port 587 = STARTTLS (secure: false, requireTLS: true) - use this if 465 gives "wrong version number"
    const useImplicitSSL = mailPort === 465;
    transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: useImplicitSSL,
      requireTLS: !useImplicitSSL && mailPort === 587,
      auth: {
        user: mailUser,
        pass: mailPass
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }
  return transporter;
}

/**
 * Send leave/remote request notification to manager
 * @param {Object} options
 * @param {string} options.managerEmail - Manager's email address
 * @param {string} options.employeeName - Name of employee who requested
 * @param {string} options.type - 'leave' | 'remote' (leave type: casual, sick, remote, etc.)
 * @param {Date} options.startDate - Start date
 * @param {Date} options.endDate - End date
 * @param {boolean} options.isHalfDay - Half day flag
 * @param {string} [options.remarks] - Optional remarks
 */
async function sendLeaveRequestNotificationToManager(options) {
  const { managerEmail, employeeName, type, startDate, endDate, isHalfDay, remarks } = options;
  if (!managerEmail || !managerEmail.trim()) {
    console.warn('[EmailService] Cannot send notification: manager email is empty.');
    return { sent: false, reason: 'no_manager_email' };
  }

  const transport = getTransporter();
  if (!transport) {
    console.warn('[EmailService] Mail transporter not configured. Skipping notification.');
    return { sent: false, reason: 'mail_not_configured' };
  }

  const requestType = type === 'remote' ? 'Remote Work' : `${type.charAt(0).toUpperCase() + type.slice(1)} Leave`;
  const dateRange = `${new Date(startDate).toISOString().split('T')[0]} to ${new Date(endDate).toISOString().split('T')[0]}`;
  const halfDayNote = isHalfDay ? ' (Half Day)' : '';

  const subject = `${requestType} Request from ${employeeName} – Action Required`;
  const text = [
    `Dear Manager,`,
    ``,
    `${employeeName} has submitted a new ${requestType.toLowerCase()} request that requires your approval.`,
    ``,
    `Request Details:`,
    `- Type: ${requestType}${halfDayNote}`,
    `- Date Range: ${dateRange}`,
    `- Employee: ${employeeName}`,
    remarks ? `- Remarks: ${remarks}` : '',
    ``,
    `Please log in to the HRMS portal to review and approve or deny this request.`,
    ``,
    `This is an automated notification from HRMS.`
  ].filter(Boolean).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .detail-row { margin: 8px 0; }
    .label { font-weight: bold; color: #475569; }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New ${requestType} Request</h2>
    </div>
    <div class="content">
      <p>Dear Manager,</p>
      <p><strong>${employeeName}</strong> has submitted a new ${requestType.toLowerCase()} request that requires your approval.</p>
      <p><strong>Request Details:</strong></p>
      <div class="detail-row"><span class="label">Type:</span> ${requestType}${halfDayNote}</div>
      <div class="detail-row"><span class="label">Date Range:</span> ${dateRange}</div>
      <div class="detail-row"><span class="label">Employee:</span> ${employeeName}</div>
      ${remarks ? `<div class="detail-row"><span class="label">Remarks:</span> ${remarks}</div>` : ''}
      <p>Please log in to the HRMS portal to review and approve or deny this request.</p>
    </div>
    <div class="footer">
      This is an automated notification from ${mailFromName}.
    </div>
  </div>
</body>
</html>
`;

  try {
    await transport.sendMail({
      from: `"${mailFromName}" <${mailFrom}>`,
      to: managerEmail,
      subject,
      text,
      html
    });
    console.log(`[EmailService] Notification sent to manager ${managerEmail} for ${requestType} request from ${employeeName}`);
    return { sent: true };
  } catch (err) {
    console.error('[EmailService] Failed to send manager notification:', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send custom email (e.g. admin-to-employee message)
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - Optional HTML body
 */
async function sendCustomEmail(options) {
  const { to, subject, text, html } = options;
  if (!to || (!subject && subject !== '')) {
    return { sent: false, reason: 'Missing to or subject' };
  }

  const transport = getTransporter();
  if (!transport) {
    return { sent: false, reason: 'mail_not_configured' };
  }

  const recipients = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipients.length === 0) {
    return { sent: false, reason: 'no_recipients' };
  }

  try {
    await transport.sendMail({
      from: `"${mailFromName}" <${mailFrom}>`,
      to: recipients.join(', '),
      subject: subject || '(No subject)',
      text: text || '',
      html: html || (text ? text.replace(/\n/g, '<br>') : '')
    });
    console.log(`[EmailService] Custom email sent to ${recipients.length} recipient(s), subject: ${subject}`);
    return { sent: true };
  } catch (err) {
    console.error('[EmailService] Failed to send custom email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  getTransporter,
  sendLeaveRequestNotificationToManager,
  sendCustomEmail
};
