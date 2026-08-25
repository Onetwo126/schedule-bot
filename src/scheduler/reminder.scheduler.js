import { getTodaySchedule } from "../services/schedule.service.js";
import { getMoscowTime } from "../utils/time.util.js";
import { getCurrentAndNextActivity } from "../services/activity.service.js";
import { scheduleCache } from "../services/schedule-cache.service.js";

const sentReminders = new Set();

export function startReminderScheduler(options) {
    console.log("⏰ Reminder Scheduler запущен");

    return setInterval(() => runReminderCycle(options), 60 * 1000);
}

export async function runReminderCycle({
    cache = scheduleCache,
    userService,
    messenger,
    scheduleProvider = getTodaySchedule,
} = {}) {
    try {
        try {
            await cache.refresh();
        } catch (error) {
            if (!cache.hasRows()) {
                throw error;
            }
            console.error("[Scheduler] Google Sheets недоступен, используется последний кэш:", error.message);
        }
        const now = getMoscowTime();

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const users = userService.getAllUsers();

        for (const user of users) {
            if (user.messenger !== "telegram") {
                continue;
            }
            const telegramId = user.external_user_id;
            try {
                const scheduleResult = await scheduleProvider(user.staff_login);

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

                await messenger.sendMessage(
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
    } catch (error) {
        console.error("[Scheduler] Ошибка цикла напоминаний:", error.message);
    }
}
