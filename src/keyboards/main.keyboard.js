export const mainKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: "🔎 Что сейчас?",
                    callback_data: "current_activity",
                },
            ],
            [
                {
                    text: "📅 Расписание на сегодня",
                    callback_data: "today_schedule",
                },
            ],
        ],
    },
};