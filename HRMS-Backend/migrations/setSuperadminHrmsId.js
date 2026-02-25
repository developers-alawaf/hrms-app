/**
 * One-time migration: Set HRMS ID "00000" for superadmin@example.com employee.
 * Run: node migrations/setSuperadminHrmsId.js
 * (from HRMS-Backend directory, with MONGODB_URI in .env.development or .env.production)
 */
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.development'),
});
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.production'),
});

const mongoose = require('mongoose');
const Employee = require('../models/employee');

async function setSuperadminHrmsId() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI missing. Set it in .env.development or .env.production');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const result = await Employee.findOneAndUpdate(
      { email: 'superadmin@example.com' },
      { $set: { newEmployeeCode: '00000' } },
      { new: true }
    );

    if (result) {
      console.log('✅ Updated superadmin@example.com employee with HRMS ID 00000');
    } else {
      console.log('⚠️ No employee found with email superadmin@example.com');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
}

setSuperadminHrmsId();
