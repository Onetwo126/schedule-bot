import TelegramBot from "node-telegram-bot-api";
import { config } from "../config/config.js";

export const bot = new TelegramBot(config.BOT_TOKEN, {
    polling: true,
});

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error.message);
});