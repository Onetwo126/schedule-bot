import { botApplication } from "../application/bot.application.js";
import { mainKeyboard } from "../keyboards/main.keyboard.js";
import {
    isWaitingForStaffLogin,
    stopWaitingForStaffLogin,
} from "../utils/user-state.js";

export function registerMessageHandler(bot) {
    bot.on("message", async (msg) => {
        try {
        const chatId = msg.chat.id;

        if (!msg.text) {
            return;
        }

        if (msg.text.startsWith("/")) {
            return;
        }

        if (!isWaitingForStaffLogin(chatId)) {
            return;
        }

        const staffLogin = msg.text.trim();

        const savedUser = botApplication.changeStaffLogin(
            { messenger: "telegram", externalUserId: chatId },
            staffLogin
        );

        if (!savedUser) {
            await bot.sendMessage(
                chatId,
                "❌ Такой логин не найден.\n\nПопробуй ввести ещё раз"
            );

            return;
        }

        stopWaitingForStaffLogin(chatId);

        await bot.sendMessage(
            chatId,
            "✅ Логин успешно сохранён!"
        );

        await bot.sendMessage(
            chatId,
        `🍞 <b>Хлебудильник на связи!</b>
Я твой личный секретарь по активкам 🫡 

Ну что, посмотрим, куда тебя сегодня определили?`,
            {
                ...mainKeyboard,
                parse_mode: "HTML",
            }
        );
        } catch (error) {
            console.error("[MessageHandler] Ошибка обработки сообщения:", error.message);
        }
    });
}
