const cron = require('node-cron');
const autoPunchOut = require('./autoPunchOut');
const markAbsent = require('./markAbsent');
const monthlySummary = require('./monthlySummary');
const leaveAccrual = require('./leaveAccrual');

const cronLastRun = {};

function registerCronJobs() {
  // 1. AUTO PUNCH-OUT — every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running autoPunchOut...');
    await autoPunchOut();
    cronLastRun.autoPunchOut = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata' });

  // 2. MARK ABSENT — every day at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    console.log('[CRON] Running markAbsent...');
    await markAbsent();
    cronLastRun.markAbsent = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata' });

  // 3. MONTHLY SUMMARY — 1st of every month at 00:05 AM
  cron.schedule('5 0 1 * *', async () => {
    console.log('[CRON] Running monthlySummary...');
    await monthlySummary();
    cronLastRun.monthlySummary = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata' });

  // 4. LEAVE ACCRUAL (EL monthly + yearly reset) — 1st of every month at 00:10 AM
  cron.schedule('10 0 1 * *', async () => {
    console.log('[CRON] Running leaveAccrual...');
    await leaveAccrual();
    cronLastRun.leaveAccrual = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata' });

  console.log('✅ All attendance cron jobs registered (TZ: ' + (process.env.COMPANY_TIMEZONE || 'Asia/Kolkata') + ')');
}

function getCronLastRun() {
  return cronLastRun;
}

module.exports = { registerCronJobs, getCronLastRun };
