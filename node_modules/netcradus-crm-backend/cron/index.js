const cron = require("node-cron");
const autoPunchOut = require("./autoPunchOut");
const markAbsent = require("./markAbsent");
const monthlySummary = require("./monthlySummary");
const leaveAccrual = require("./leaveAccrual");
const taskDueReminder = require("./taskDueReminder");
const meetingReminderNotifications = require("./meetingReminderNotifications");

const cronLastRun = {};
const runningJobs = new Set();

const runJob = async (name, task) => {
  if (runningJobs.has(name)) {
    console.log(`[CRON] Skipping ${name}; previous run still active.`);
    return;
  }

  runningJobs.add(name);
  const startedAt = Date.now();
  try {
    await task();
    cronLastRun[name] = new Date().toISOString();
  } catch (error) {
    console.error(`[CRON ${name}] Error:`, error.message);
  } finally {
    runningJobs.delete(name);
    const durationMs = Date.now() - startedAt;
    if (durationMs > 5000) {
      console.log(`[CRON] ${name} completed in ${durationMs}ms.`);
    }
  }
};

function registerCronJobs() {
  cron.schedule(process.env.CRON_AUTO_PUNCH_OUT || "7 * * * *", async () => {
    await runJob("autoPunchOut", autoPunchOut);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule(process.env.CRON_MARK_ABSENT || "59 23 * * *", async () => {
    await runJob("markAbsent", markAbsent);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule(process.env.CRON_MONTHLY_SUMMARY || "5 0 1 * *", async () => {
    await runJob("monthlySummary", monthlySummary);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule(process.env.CRON_LEAVE_ACCRUAL || "10 0 1 * *", async () => {
    await runJob("leaveAccrual", leaveAccrual);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule(process.env.CRON_TASK_DUE_REMINDER || "17 */2 * * *", async () => {
    await runJob("taskDueReminder", taskDueReminder);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule(process.env.CRON_MEETING_REMINDERS || "* * * * *", async () => {
    await runJob("meetingReminderNotifications", meetingReminderNotifications);
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  console.log(`All cron jobs registered (TZ: ${process.env.COMPANY_TIMEZONE || "Asia/Kolkata"})`);
}

function getCronLastRun() {
  return cronLastRun;
}

module.exports = { registerCronJobs, getCronLastRun };
