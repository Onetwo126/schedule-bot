import { getTodaySchedule } from "./schedule.service.js";
import { getMoscowTime } from "../utils/time.util.js";

export function getCurrentAndNextActivity(
    schedule,
    currentHour,
    currentMinute,
    reminderBeforeMinutes = null
) {
    let currentActivity = null;
    let nextActivity = null;
    let reminderActivity = null;

    const currentTime = currentHour * 60 + currentMinute;

    for (const item of schedule) {
        const [start, end] = item.time.split("-");

        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime < endTime) {
            currentActivity = item;
        }

        if (!nextActivity && startTime > currentTime) {
            nextActivity = item;
        }

        if (
            reminderBeforeMinutes !== null &&
            !reminderActivity &&
            startTime - currentTime === reminderBeforeMinutes
        ) {
            reminderActivity = item;
        }
    }

    return {
        currentActivity,
        nextActivity,
        reminderActivity,
    };
}

export async function getCurrentActivityMessage(staffLogin) {
    const scheduleResult = await getTodaySchedule(staffLogin);

    if (scheduleResult.status !== "OK") {
        return "🤔 Что-то я не смог найти расписание на сегодня.\n\nВозможно, тебя сегодня нет в расписании. Если это не так — попробуй ещё раз через минутку 🫶🍞";
    }

    const now = getMoscowTime();

    const {
        currentActivity,
        nextActivity,
    } = getCurrentAndNextActivity(
        scheduleResult.schedule,
        now.getHours(),
        now.getMinutes()
    );

    const currentTime = now.getHours() * 60 + now.getMinutes();

    let minutesToNext = null;

    if (nextActivity) {
        const [startHour, startMinute] = nextActivity.time
            .split("-")[0]
            .split(":")
            .map(Number);

        const nextStartTime = startHour * 60 + startMinute;

        minutesToNext = nextStartTime - currentTime;
    }

    let message = "🍞 <b>Хлебудильник докладывает</b>\n\n";

    if (currentActivity) {
        message +=
            `🟢 <b>СЕЙЧАС</b>\n` +
            `💬 ${currentActivity.time} — ${currentActivity.activity}`;
    } else {
        message +=
            `🟢 <b>СЕЙЧАС</b>\n` +
            `💬 Сейчас активностей нет`;
    }

    message += "\n\n";

    if (nextActivity) {
        message +=
            `⏭ <b>ПОТОМ</b>\n` +
            `💬 ${nextActivity.time} — ${nextActivity.activity}`;

        if (minutesToNext !== null) {
            message +=
                `\n\nДо следующей активки — <b>${minutesToNext} мин.</b> Работаем, хлебушек 🫡`;
        }
    } else {
        message +=
            `⏭ <b>ПОТОМ</b>\n` +
            `🎉 А потом всё!\nМожно будет отдыхать, хлебушек 🫶🍞`;
    }

    return message;
}