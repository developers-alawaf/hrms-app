/**
 * Test email configuration. Run: node scripts/test-email.js
 * Loads .env.development or .env.production based on NODE_ENV
 */
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`),
});
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const nodemailer = require('nodemailer');

const user = (process.env.MAIL_USERNAME || process.env.MAIL_FROM_ADDRESS || '').trim();
const pass = (process.env.MAIL_PASSWORD || process.env.ZOHO_PASSWORD || '').trim();
const host = (process.env.MAIL_HOST || 'smtppro.zoho.in').trim();

console.log('Testing email config...');
console.log('Host:', host);
console.log('User:', user ? user.replace(/(.{2}).*(@.*)/, '$1***$2') : '(empty)');
console.log('');

if (!user || !pass) {
  console.error('ERROR: Set MAIL_USERNAME and MAIL_PASSWORD in .env');
  process.exit(1);
}

async function test(host, port) {
  const secure = port === 465;
  const t = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
  try {
    await t.verify();
    console.log('OK: ' + host + ':' + port + ' - connection successful');
    return true;
  } catch (err) {
    console.log('FAIL: ' + host + ':' + port + ' - ' + err.message);
    return false;
  }
}

async function main() {
  const configs = [
    [host, parseInt(process.env.MAIL_PORT || '465', 10)],
    ['smtp.zoho.in', 587],
    ['smtp.zoho.in', 465],
    ['smtppro.zoho.in', 587],
    ['smtppro.zoho.in', 465],
    ['smtp.zoho.com', 587],
    ['smtppro.zoho.com', 587],
  ];
  let ok = false;
  for (const [h, p] of configs) {
    if (await test(h, p)) ok = true;
  }
  if (!ok) {
    console.log('');
    console.log('535 fix: Use Zoho App Password (not regular password)');
    console.log('Generate at: https://accounts.zoho.com/home#security/app_password');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
