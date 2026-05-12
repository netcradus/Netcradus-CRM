/**
 * Seed script for the Attendance Management System
 * Seeds: AttendanceSettings, LeaveTypes (CL, SL, EL, UL, CO), Indian National Holidays
 * Run: node seeds/attendanceSeed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AttendanceSettings = require('../models/AttendanceSettings');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const User = require('../models/User');

const CURRENT_YEAR = new Date().getFullYear();

const leaveTypes = [
  {
    name: 'Casual Leave',
    code: 'CL',
    defaultDaysPerYear: 12,
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    defaultDaysPerYear: 12,
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Earned Leave',
    code: 'EL',
    defaultDaysPerYear: 15,
    noticePeriodDays: 3,
    allowHalfDay: false,
    isCarryForward: true,
    maxCarryForwardDays: 30,
    isActive: true,
  },
  {
    name: 'Unpaid Leave',
    code: 'UL',
    defaultDaysPerYear: 365, // unlimited
    noticePeriodDays: 0,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Compensatory Off',
    code: 'CO',
    defaultDaysPerYear: 0, // earned by working on holidays
    noticePeriodDays: 0,
    allowHalfDay: true,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    defaultDaysPerYear: 182, // 26 weeks
    noticePeriodDays: 7,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
  {
    name: 'Paternity Leave',
    code: 'PL',
    defaultDaysPerYear: 15,
    noticePeriodDays: 3,
    allowHalfDay: false,
    isCarryForward: false,
    maxCarryForwardDays: 0,
    isActive: true,
  },
];

// Indian national holidays for the current year (standard gazetted holidays)
const indianHolidays = [
  { name: 'Republic Day', date: `${CURRENT_YEAR}-01-26`, type: 'national' },
  { name: 'Maha Shivaratri', date: `${CURRENT_YEAR}-02-26`, type: 'national' },
  { name: 'Holi', date: `${CURRENT_YEAR}-03-14`, type: 'national' },
  { name: 'Good Friday', date: `${CURRENT_YEAR}-03-29`, type: 'national' },
  { name: 'Id-ul-Fitr (Eid)', date: `${CURRENT_YEAR}-03-31`, type: 'national' },
  { name: 'Ram Navami', date: `${CURRENT_YEAR}-04-06`, type: 'national' },
  { name: 'Mahavir Jayanti', date: `${CURRENT_YEAR}-04-10`, type: 'national' },
  { name: 'Dr. Ambedkar Jayanti', date: `${CURRENT_YEAR}-04-14`, type: 'national' },
  { name: 'Buddha Purnima', date: `${CURRENT_YEAR}-05-12`, type: 'national' },
  { name: 'Id-ul-Zuha (Bakrid)', date: `${CURRENT_YEAR}-06-07`, type: 'national' },
  { name: 'Muharram', date: `${CURRENT_YEAR}-07-06`, type: 'national' },
  { name: 'Independence Day', date: `${CURRENT_YEAR}-08-15`, type: 'national' },
  { name: 'Milad-un-Nabi (Prophet\'s Birthday)', date: `${CURRENT_YEAR}-09-05`, type: 'national' },
  { name: 'Mahatma Gandhi Jayanti', date: `${CURRENT_YEAR}-10-02`, type: 'national' },
  { name: 'Dussehra', date: `${CURRENT_YEAR}-10-02`, type: 'national' },
  { name: 'Diwali', date: `${CURRENT_YEAR}-10-20`, type: 'national' },
  { name: 'Guru Nanak Jayanti', date: `${CURRENT_YEAR}-11-05`, type: 'national' },
  { name: 'Christmas Day', date: `${CURRENT_YEAR}-12-25`, type: 'national' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding.');

    // 1. Seed Attendance Settings
    const existingSettings = await AttendanceSettings.findOne();
    if (!existingSettings) {
      await AttendanceSettings.create({
        officeStartTime: process.env.OFFICE_START_TIME || '10:00',
        officeEndTime: process.env.OFFICE_END_TIME || '19:00',
        standardHours: Number(process.env.STANDARD_HOURS) || 8,
        minHoursForPresent: Number(process.env.MIN_HOURS_FOR_PRESENT) || 4,
        maxShiftHours: Number(process.env.MAX_SHIFT_HOURS) || 12,
        weekends: (process.env.WEEKEND_DAYS || '0,6').split(',').map(Number),
        timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata',
      });
      console.log('✅ AttendanceSettings seeded.');
    } else {
      console.log('⏭️  AttendanceSettings already exist. Skipping.');
    }

    // 2. Seed Leave Types
    for (const lt of leaveTypes) {
      await LeaveType.findOneAndUpdate(
        { code: lt.code },
        { $setOnInsert: lt },
        { upsert: true }
      );
    }
    console.log('✅ LeaveTypes seeded (CL, SL, EL, UL, CO, ML, PL).');

    // 3. Seed Indian National Holidays
    for (const h of indianHolidays) {
      const d = new Date(h.date);
      await Holiday.findOneAndUpdate(
        { date: d, year: CURRENT_YEAR },
        { $setOnInsert: { name: h.name, date: d, year: CURRENT_YEAR, type: h.type, isActive: true } },
        { upsert: true }
      );
    }
    console.log(`✅ Indian National Holidays seeded for ${CURRENT_YEAR}.`);

    // 4. Seed Leave Balances for existing users
    const users = await User.find({}).select('_id').lean();
    const allTypes = await LeaveType.find({ isActive: true }).lean();

    for (const user of users) {
      for (const lt of allTypes) {
        // Skip UL (unlimited), ML, PL for default allocation
        const allocated = lt.code === 'EL' ? 0 : lt.defaultDaysPerYear; // EL accrues monthly
        await LeaveBalance.findOneAndUpdate(
          { userId: user._id, year: CURRENT_YEAR, leaveTypeId: lt._id },
          {
            $setOnInsert: {
              userId: user._id,
              year: CURRENT_YEAR,
              leaveTypeId: lt._id,
              allocated,
              used: 0,
              pending: 0,
              remaining: allocated,
              carried: 0,
            }
          },
          { upsert: true }
        );
      }
    }
    console.log(`✅ LeaveBalances seeded for ${users.length} user(s) in ${CURRENT_YEAR}.`);

    console.log('\n🎉 Attendance seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
