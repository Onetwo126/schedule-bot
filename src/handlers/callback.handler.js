import { botApplication } from "../application/bot.application.js";

export function registerCallBackHandlers(bot) {
    bot.on("callback_query", async (query) => {
        try {
        const chatId = query.message.chat.id;
        const identity = { messenger: "telegram", externalUserId: chatId };

        await bot.answerCallbackQuery(query.id);

        switch (query.data) {
            case "current_activity": {
                const user = botApplication.getUser(identity);

                if (!user) {
                    await bot.sendMessage(
                        chatId,
                        "Сначала отправьте /start и укажите логин Telegram."
                    );
                    break;
                }

                const message = await botApplication.getCurrentActivityMessage(identity);

                await bot.sendMessage(chatId, message, {
                    parse_mode: "HTML",
                });

                break;
            }

            case "today_schedule": {
                const user = botApplication.getUser(identity);

                if (!user) {
                    await bot.sendMessage(
                        chatId,
                        "Сначала отправьте /start и укажите логин Telegram."
                    );
                    break;
                }

                const result = botApplication.getTodaySchedule(identity);

                if (result.status === "DATE_NOT_FOUND") {
                    await bot.sendMessage(
                        chatId,
                        `📅 Расписание на ${result.date} не найдено.`
                    );
                    break;
                }

                if (result.status === "EMPLOYEE_NOT_FOUND") {
                    await bot.sendMessage(
                        chatId,
                        `🤔 Сегодня не нашёл твой логин <b>@${user.staff_login}</b> в расписании.\n\nЕсли сегодня должен быть рабочий день — стоит проверить таблицу 🫶🍞`,
                        {
                            parse_mode: "HTML",
                        }
                    );
                    break;
                }

                if (result.schedule.length === 0) {
                    await bot.sendMessage(
                        chatId,
                        `😴 А теперь у тебя выходные.\n\nОтдыхай, хлебушек 🫶🍞`
                    );
                    break;
                }

                const scheduleText = result.schedule
                    .map(
                        (item) =>
                            `${item.time} — ${item.activity}`
                    )
                    .join("\n");

                const message =
                    `🍞 <b>План хлебных дел на ${result.date}</b>\n\n` +
                    `${scheduleText}\n\n` +
                    `Хлебудильник всё запомнил. Тебе осталось только работать 🫡🍞`;

                await bot.sendMessage(chatId, message, {
                    parse_mode: "HTML",
                });

                break;
            }
        }
        } catch (error) {
            console.error("[CallbackHandler] Ошибка обработки кнопки:", error.message);
        }
    });
}
