const MeetingReminder = require("../models/MeetingReminder");
const { createNotifications } = require("../services/taskNotificationService");

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const LOOKAHEAD_MS = 2 * 60 * 1000;

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata",
  }).format(date);

async function sendDueReminder(reminder, reminderField, label) {
  await createNotifications({
    userIds: [reminder.createdBy],
    message: `${label} meeting reminder: "${reminder.title}" starts at ${formatTime(reminder.meetingAt)}. Link: ${reminder.meetingLink}`,
    targetPath: "/dashboard",
    type: "meeting_reminder",
  });

  await MeetingReminder.updateOne(
    { _id: reminder._id, [reminderField]: null },
    { $set: { [reminderField]: new Date() } }
  );
}

async function meetingReminderNotifications() {
  try {
    const now = new Date();
    const lookahead = new Date(now.getTime() + LOOKAHEAD_MS);
    const oneHourStart = new Date(now.getTime() + ONE_HOUR_MS);
    const oneHourEnd = new Date(oneHourStart.getTime() + LOOKAHEAD_MS);
    const fifteenStart = new Date(now.getTime() + FIFTEEN_MINUTES_MS);
    const fifteenEnd = new Date(fifteenStart.getTime() + LOOKAHEAD_MS);

    const reminders = await MeetingReminder.find({
      meetingAt: { $gte: lookahead },
      $or: [
        {
          meetingAt: { $gte: oneHourStart, $lte: oneHourEnd },
          oneHourReminderSentAt: null,
        },
        {
          meetingAt: { $gte: fifteenStart, $lte: fifteenEnd },
          fifteenMinuteReminderSentAt: null,
        },
      ],
    })
      .select("_id title meetingLink meetingAt createdBy oneHourReminderSentAt fifteenMinuteReminderSentAt")
      .lean();

    let sentCount = 0;

    for (const reminder of reminders) {
      if (!reminder.oneHourReminderSentAt && reminder.meetingAt >= oneHourStart && reminder.meetingAt <= oneHourEnd) {
        await sendDueReminder(reminder, "oneHourReminderSentAt", "1 hour");
        sentCount += 1;
      }

      if (!reminder.fifteenMinuteReminderSentAt && reminder.meetingAt >= fifteenStart && reminder.meetingAt <= fifteenEnd) {
        await sendDueReminder(reminder, "fifteenMinuteReminderSentAt", "15 minutes");
        sentCount += 1;
      }
    }

    if (sentCount > 0) {
      console.log(`[CRON meetingReminderNotifications] Created ${sentCount} reminder notification(s).`);
    }

    return sentCount;
  } catch (error) {
    console.error("[CRON meetingReminderNotifications] Error:", error.message);
    return 0;
  }
}

module.exports = meetingReminderNotifications;
