/**
 * Centralized Email Service for HRMS
 * Zoho SMTP: smtp.zoho.in / smtppro.zoho.in (Asia), smtp.zoho.com / smtppro.zoho.com (US)
 * 535 fix: MUST use App Password from https://accounts.zoho.com/home#security/app_password
 */
const nodemailer = require('nodemailer');

const _s = (v) => (typeof v === 'string' ? v.trim() : v) || '';

function getMailConfig() {
  const host = _s(process.env.MAIL_HOST || process.env.ZOHO_SMTP_HOST || 'smtppro.zoho.in');
  const port = parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT || '465', 10);
  const user = _s(process.env.MAIL_USERNAME || process.env.MAIL_FROM_ADDRESS || process.env.ZOHO_EMAIL || process.env.EMAIL_USER);
  const pass = _s(process.env.MAIL_PASSWORD || process.env.ZOHO_PASSWORD || process.env.EMAIL_PASS);
  const fromAddr = _s(process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || process.env.ZOHO_EMAIL) || user;
  const fromName = _s(process.env.MAIL_FROM_NAME || process.env.APP_NAME) || 'HRMS';
  return { host, port, user, pass, fromAddr, fromName };
}

let transporter = null;
let transporterConfig = null;

function createTransport(host, port, user, pass) {
  const secure = port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

function getTransporter() {
  const { host, port, user, pass } = getMailConfig();
  if (!user || !pass) {
    console.warn('[EmailService] MAIL_USERNAME and MAIL_PASSWORD required in .env');
    return null;
  }
  const key = `${host}:${port}`;
  if (!transporter || transporterConfig !== key) {
    transporterConfig = key;
    const masked = user.replace(/(.{2}).*(@.*)/, '$1***$2');
    console.log('[EmailService] Using ' + host + ':' + port + ' user=' + masked);
    transporter = createTransport(host, port, user, pass);
  }
  return transporter;
}

function resetTransporter() {
  transporter = null;
  transporterConfig = null;
}

function log535Help() {
  console.error('[EmailService] 535 = wrong password. Use Zoho App Password: https://accounts.zoho.com/home#security/app_password');
}

// Zoho hosts/ports to try on 535 (Asia first for alawaf.com.bd)
const ZOHO_FALLBACKS = [
  { host: 'smtp.zoho.in', port: 587 },
  { host: 'smtp.zoho.in', port: 465 },
  { host: 'smtppro.zoho.in', port: 587 },
  { host: 'smtppro.zoho.in', port: 465 },
  { host: 'smtp.zoho.com', port: 587 },
  { host: 'smtp.zoho.com', port: 465 },
  { host: 'smtppro.zoho.com', port: 587 },
  { host: 'smtppro.zoho.com', port: 465 },
];

async function sendMail(mailOptions) {
  const { fromAddr, fromName, user } = getMailConfig();
  const defaultFrom = `"${fromName}" <${fromAddr || user}>`;
  const opts = { ...mailOptions, from: mailOptions.from || defaultFrom };
  const cfg = getMailConfig();
  if (!cfg.user || !cfg.pass) throw new Error('Email service not configured');
  const configs = [{ host: cfg.host, port: cfg.port }];
  for (const f of ZOHO_FALLBACKS) {
    if (configs.every(c => c.host !== f.host || c.port !== f.port)) configs.push(f);
  }
  let lastErr;
  let idx = 0;
  for (const { host, port } of configs) {
    try {
      const t = createTransport(host, port, cfg.user, cfg.pass);
      const result = await t.sendMail(opts);
      if (idx > 0) console.log('[EmailService] Success with ' + host + ':' + port);
      return result;
    } catch (err) {
      lastErr = err;
      if (err.message && err.message.includes('535')) {
        console.log('[EmailService] 535 on ' + host + ':' + port + ', trying next...');
      } else {
        throw err;
      }
    }
    idx++;
  }
  log535Help();
  throw lastErr;
}

/** Verify SMTP connection on startup (optional - set MAIL_VERIFY_ON_START=true) */
async function verifyConnection() {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.verify();
    console.log('[EmailService] SMTP connection verified successfully');
    return true;
  } catch (err) {
    console.error('[EmailService] SMTP verify failed:', err.message);
    if (err.message && err.message.includes('535')) log535Help();
    return false;
  }
}

/**
 * Send leave/remote request notification to manager (or HR/Admin if no manager)
 * @param {Object} options
 * @param {string|string[]} options.managerEmail - Manager/approver email(s) - single or array
 * @param {string} options.employeeName - Name of employee who requested
 * @param {string} options.type - 'leave' | 'remote' (leave type: casual, sick, remote, etc.)
 * @param {Date} options.startDate - Start date
 * @param {Date} options.endDate - End date
 * @param {boolean} options.isHalfDay - Half day flag
 * @param {string} [options.remarks] - Optional remarks
 */
async function sendLeaveRequestNotificationToManager(options) {
  const { fromName } = getMailConfig();
  const { managerEmail, employeeName, type, startDate, endDate, isHalfDay, remarks } = options;
  const emails = Array.isArray(managerEmail) ? managerEmail : (managerEmail ? [managerEmail] : []);
  const validEmails = emails.map(e => (e || '').trim()).filter(Boolean);
  if (validEmails.length === 0) {
    console.warn('[EmailService] Cannot send notification: no approver email(s) provided.');
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
      This is an automated notification from ${fromName}.
    </div>
  </div>
</body>
</html>
`;

  try {
    await sendMail({
      to: validEmails.join(', '),
      subject,
      text,
      html
    });
    console.log(`[EmailService] Notification sent to ${validEmails.join(', ')} for ${requestType} request from ${employeeName}`);
    return { sent: true };
  } catch (err) {
    console.error('[EmailService] Failed to send manager notification:', err.message);
    if (err.message && err.message.includes('535')) log535Help();
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
    await sendMail({
      to: recipients.join(', '),
      subject: subject || '(No subject)',
      text: text || '',
      html: html || (text ? text.replace(/\n/g, '<br>') : '')
    });
    console.log(`[EmailService] Custom email sent to ${recipients.length} recipient(s), subject: ${subject}`);
    return { sent: true };
  } catch (err) {
    console.error('[EmailService] Failed to send custom email:', err.message);
    if (err.message && err.message.includes('535')) log535Help();
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  getTransporter,
  sendMail,
  verifyConnection,
  sendLeaveRequestNotificationToManager,
  sendCustomEmail
};
