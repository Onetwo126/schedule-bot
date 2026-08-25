import TelegramBot from "node-telegram-bot-api";
import { config } from "../config/config.js";
import { configureTelegramMenu as configureMenu } from "../transports/telegram/telegram-menu.js";

export const bot = new TelegramBot(config.BOT_TOKEN, {
    polling: true,
});

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error.message);
});

export async function configureTelegramMenu(telegramBot = bot) {
    await configureMenu(telegramBot);
}
