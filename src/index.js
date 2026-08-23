import { bot } from "./bot/bot.js";
import { registerCommands } from "./handlers/commands.js";
import { registerCallBackHandlers } from "./handlers/callback.handler.js";
import { registerMessageHandler } from "./handlers/message.handler.js";
import { startReminderScheduler } from "./scheduler/reminder.scheduler.js";

registerCommands(bot);
registerCallBackHandlers(bot);
registerMessageHandler(bot);

startReminderScheduler();

console.log("✅ Schedule Bot запущен");