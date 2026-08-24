import { mainKeyboard } from "../keyboards/main.keyboard.js";
import { usersService } from "../services/users.service.js";
import { waitForStaffLogin } from "../utils/user-state.js";

export function registerCommands(bot) {
    bot.onText(/^\/start$/, async (msg) => {
        try {
        const chatId = msg.chat.id;

        const user = usersService.getUser(chatId);

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
}
