import { usersService } from "../services/users.service.js";
import { getTodaySchedule } from "../services/schedule.service.js";
import { getMoscowTime } from "../utils/time.util.js";
import { bot } from "../bot/bot.js";
import { getCurrentAndNextActivity } from "../services/activity.service.js";

const sentReminders = new Set();

export function startReminderScheduler() {
    console.log("⏰ Reminder Scheduler запущен");

    setInterval(async () => {
        const now = getMoscowTime();

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const users = usersService.getAllUsers();

        for (const [telegramId, user] of Object.entries(users)) {
            try {
                const scheduleResult = await getTodaySchedule(user.staff_login);

                if (scheduleResult.status !== "OK") {
                    console.log(
                        "Расписание не получено:",
                        scheduleResult.status
                    );

                    continue;
                }

                const {
                    currentActivity,
                    nextActivity,
                    reminderActivity,
                } = getCurrentAndNextActivity(
                    scheduleResult.schedule,
                    currentHour,
                    currentMinute,
                    3
                );

                const lastActivity =
                    scheduleResult.schedule[scheduleResult.schedule.length - 1];

                const isLastCurrentActivity =
                    currentActivity &&
                    lastActivity &&
                    currentActivity.time === lastActivity.time;

                let sendEndOfDayMessage = false;

                if (isLastCurrentActivity) {
                    const [, end] = currentActivity.time.split("-");
                    const [endHour, endMinute] = end.split(":").map(Number);

                    const currentTime = currentHour * 60 + currentMinute;
                    const endTime = endHour * 60 + endMinute;

                    sendEndOfDayMessage = endTime - currentTime === 3;
                }

                if (!reminderActivity && !sendEndOfDayMessage) {
                    continue;
                }

                const dateKey = [
                    now.getFullYear(),
                    String(now.getMonth() + 1).padStart(2, "0"),
                    String(now.getDate()).padStart(2, "0"),
                ].join("-");

                const reminderKey = sendEndOfDayMessage
                    ? `${dateKey}:${telegramId}:END_OF_DAY`
                    : `${dateKey}:${telegramId}:${reminderActivity.time}`;

                if (sentReminders.has(reminderKey)) {
                    continue;
                }

                const message = sendEndOfDayMessage
                    ? `⏰ <b>ТЫК. До свободы 3 минуты.</b>\nСворачиваем хлебную лавочку и заполняем табличку 🍞`
                    : `🔔 Через 3 минуты начинается:\n\n${reminderActivity.time}\n${reminderActivity.activity}`;

                await bot.sendMessage(
                    telegramId,
                    message,
                    {
                        parse_mode: "HTML",
                    }
                );

                sentReminders.add(reminderKey);

                console.log("✅ Напоминание отправлено.");
            } catch (error) {
                console.error(
                    `[Scheduler] Ошибка для ${user.staff_login}:`,
                    error.message
                );
            }
        }
    }, 60 * 1000);
}