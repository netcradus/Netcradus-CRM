const cron = require("node-cron");
const autoPunchOut = require("./autoPunchOut");
const markAbsent = require("./markAbsent");
const monthlySummary = require("./monthlySummary");
const leaveAccrual = require("./leaveAccrual");
const taskDueReminder = require("./taskDueReminder");

const cronLastRun = {};

function registerCronJobs() {
  cron.schedule("*/30 * * * *", async () => {
    console.log("[CRON] Running autoPunchOut...");
    await autoPunchOut();
    cronLastRun.autoPunchOut = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule("59 23 * * *", async () => {
    console.log("[CRON] Running markAbsent...");
    await markAbsent();
    cronLastRun.markAbsent = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule("5 0 1 * *", async () => {
    console.log("[CRON] Running monthlySummary...");
    await monthlySummary();
    cronLastRun.monthlySummary = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule("10 0 1 * *", async () => {
    console.log("[CRON] Running leaveAccrual...");
    await leaveAccrual();
    cronLastRun.leaveAccrual = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Running taskDueReminder...");
    await taskDueReminder();
    cronLastRun.taskDueReminder = new Date().toISOString();
  }, { timezone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata" });

  console.log(`All cron jobs registered (TZ: ${process.env.COMPANY_TIMEZONE || "Asia/Kolkata"})`);
}

function getCronLastRun() {
  return cronLastRun;
}

module.exports = { registerCronJobs, getCronLastRun };
