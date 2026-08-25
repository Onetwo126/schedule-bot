import { mainKeyboard } from "../keyboards/main.keyboard.js";
import { botApplication } from "../application/bot.application.js";
import { waitForStaffLogin } from "../utils/user-state.js";

export function registerCommands(bot) {
    bot.onText(/^\/start$/, async (msg) => {
        try {
        const chatId = msg.chat.id;

        const user = botApplication.getUser({ messenger: "telegram", externalUserId: chatId });

        if (!user) {
            waitForStaffLogin(chatId);

            await bot.sendMessage(
                chatId,
                "👋 Привет!\n\nВведи свой логин Telegram"
            );

            return;
        }

        await bot.sendMessage(
            chatId,
        `🍞 <b>Хлебудильник на связи!</b>
Я твой личный секретарь по активкам 🫡 

Ну что, посмотрим, куда тебя сегодня определили?`,
            {
            ...mainKeyboard,
            parse_mode: "HTML"
            }
        );
        } catch (error) {
            console.error("[Commands] Ошибка обработки /start:", error.message);
        }
    });

    bot.onText(/^\/login$/, async (msg) => {
        const chatId = msg.chat.id;
        waitForStaffLogin(chatId);
        await bot.sendMessage(chatId, "Введи новый логин сотрудника. Текущий логин останется сохранён, пока новый не пройдёт проверку.");
    });
}
