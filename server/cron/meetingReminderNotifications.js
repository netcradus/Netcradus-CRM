const MeetingReminder = require("../models/MeetingReminder");
const { createNotifications } = require("../services/taskNotificationService");

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.COMPANY_TIMEZONE || "Asia/Kolkata",
  }).format(date);

async function meetingReminderNotifications() {
  try {
    const now = new Date();

    // 1. Auto-complete past meetings older than 30 minutes
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const completedResult = await MeetingReminder.updateMany(
      {
        status: "scheduled",
        $or: [
          { meetingDateTime: { $lte: thirtyMinutesAgo } },
          { meetingDateTime: { $exists: false }, meetingAt: { $lte: thirtyMinutesAgo } },
        ],
      },
      {
        $set: {
          status: "completed",
          completedAt: now,
        },
      }
    );

    if (completedResult.modifiedCount > 0) {
      console.log(`[CRON meetingReminderNotifications] Auto-completed ${completedResult.modifiedCount} past meeting(s).`);
    }

    // 2. Query active reminders within lookup ranges that have unsent notifications
    const sixtyMinutesLater = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    const reminders = await MeetingReminder.find({
      status: "scheduled",
      $or: [
        {
          meetingDateTime: { $gt: now },
          $or: [
            {
              meetingDateTime: { $lte: sixtyMinutesLater, $gt: fifteenMinutesLater },
              $or: [
                { "notificationDelivery.oneHourSentAt": null },
                { notificationDelivery: { $size: 0 }, oneHourReminderSentAt: null },
              ],
            },
            {
              meetingDateTime: { $lte: fifteenMinutesLater },
              $or: [
                { "notificationDelivery.fifteenMinuteSentAt": null },
                { notificationDelivery: { $size: 0 }, fifteenMinuteReminderSentAt: null },
              ],
            },
          ],
        },
        {
          meetingDateTime: { $exists: false },
          meetingAt: { $gt: now },
          $or: [
            {
              meetingAt: { $lte: sixtyMinutesLater, $gt: fifteenMinutesLater },
              $or: [
                { "notificationDelivery.oneHourSentAt": null },
                { notificationDelivery: { $size: 0 }, oneHourReminderSentAt: null },
              ],
            },
            {
              meetingAt: { $lte: fifteenMinutesLater },
              $or: [
                { "notificationDelivery.fifteenMinuteSentAt": null },
                { notificationDelivery: { $size: 0 }, fifteenMinuteReminderSentAt: null },
              ],
            },
          ],
        },
      ],
    }).populate("createdBy", "name");

    let sentCount = 0;

    for (const reminder of reminders) {
      const mTime = reminder.meetingDateTime || reminder.meetingAt;
      if (!mTime) continue;

      const timeRemainingMs = mTime.getTime() - now.getTime();
      const timeRemainingMins = timeRemainingMs / (60 * 1000);
      const organizerName = reminder.createdBy?.name || "Super User";

      // Case A: Multi-participant delivery tracking
      if (reminder.notificationDelivery && reminder.notificationDelivery.length > 0) {
        for (const delivery of reminder.notificationDelivery) {
          const participantId = String(delivery.user);

          // One-hour reminder
          if (
            !delivery.oneHourSentAt &&
            timeRemainingMins <= 60 &&
            timeRemainingMins > 15
          ) {
            const result = await MeetingReminder.updateOne(
              {
                _id: reminder._id,
                "notificationDelivery": {
                  $elemMatch: {
                    user: delivery.user,
                    oneHourSentAt: null,
                  },
                },
              },
              {
                $set: {
                  "notificationDelivery.$.oneHourSentAt": new Date(),
                },
              }
            );

            if (result.modifiedCount > 0) {
              try {
                await createNotifications({
                  userIds: [participantId],
                  message: `${reminder.title} starts in 1 hour. Organized by ${organizerName}.`,
                  targetPath: "/dashboard",
                  type: "meeting_reminder",
                  taskId: reminder._id,
                });
                sentCount += 1;
              } catch (err) {
                console.error(`[CRON] Failed to send 1h notification to participant ${participantId}:`, err.message);
              }
            }
          }

          // Fifteen-minute reminder
          if (
            !delivery.fifteenMinuteSentAt &&
            timeRemainingMins <= 15 &&
            timeRemainingMins > 0
          ) {
            const result = await MeetingReminder.updateOne(
              {
                _id: reminder._id,
                "notificationDelivery": {
                  $elemMatch: {
                    user: delivery.user,
                    fifteenMinuteSentAt: null,
                  },
                },
              },
              {
                $set: {
                  "notificationDelivery.$.fifteenMinuteSentAt": new Date(),
                },
              }
            );

            if (result.modifiedCount > 0) {
              try {
                await createNotifications({
                  userIds: [participantId],
                  message: `${reminder.title} starts in 15 minutes. Join the meeting on time.`,
                  targetPath: "/dashboard",
                  type: "meeting_reminder",
                  taskId: reminder._id,
                });
                sentCount += 1;
              } catch (err) {
                console.error(`[CRON] Failed to send 15m notification to participant ${participantId}:`, err.message);
              }
            }
          }
        }
      } else {
        // Case B: Backward compatibility for legacy meeting reminders (no participants list)
        const creatorId = String(reminder.createdBy?._id || reminder.createdBy);

        if (
          !reminder.oneHourReminderSentAt &&
          timeRemainingMins <= 60 &&
          timeRemainingMins > 15
        ) {
          const updated = await MeetingReminder.updateOne(
            { _id: reminder._id, oneHourReminderSentAt: null },
            { $set: { oneHourReminderSentAt: new Date() } }
          );
          if (updated.modifiedCount > 0) {
            try {
              await createNotifications({
                userIds: [creatorId],
                message: `1 hour meeting reminder: "${reminder.title}" starts at ${formatTime(mTime)}. Link: ${reminder.meetingLink || "No link provided."}`,
                targetPath: "/dashboard",
                type: "meeting_reminder",
                taskId: reminder._id,
              });
              sentCount += 1;
            } catch (err) {
              console.error(`[CRON] Failed to send 1h notification to legacy creator ${creatorId}:`, err.message);
            }
          }
        }

        if (
          !reminder.fifteenMinuteReminderSentAt &&
          timeRemainingMins <= 15 &&
          timeRemainingMins > 0
        ) {
          const updated = await MeetingReminder.updateOne(
            { _id: reminder._id, fifteenMinuteReminderSentAt: null },
            { $set: { fifteenMinuteReminderSentAt: new Date() } }
          );
          if (updated.modifiedCount > 0) {
            try {
              await createNotifications({
                userIds: [creatorId],
                message: `15 minutes meeting reminder: "${reminder.title}" starts at ${formatTime(mTime)}. Link: ${reminder.meetingLink || "No link provided."}`,
                targetPath: "/dashboard",
                type: "meeting_reminder",
                taskId: reminder._id,
              });
              sentCount += 1;
            } catch (err) {
              console.error(`[CRON] Failed to send 15m notification to legacy creator ${creatorId}:`, err.message);
            }
          }
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[CRON meetingReminderNotifications] Created ${sentCount} individual reminder notification(s).`);
    }

    return sentCount;
  } catch (error) {
    console.error("[CRON meetingReminderNotifications] Error:", error.message);
    return 0;
  }
}

module.exports = meetingReminderNotifications;
