import { bot, configureTelegramMenu } from "./bot/bot.js";
import { registerCommands } from "./handlers/commands.js";
import { registerCallBackHandlers } from "./handlers/callback.handler.js";
import { registerMessageHandler } from "./handlers/message.handler.js";
import { startReminderScheduler } from "./scheduler/reminder.scheduler.js";
import { scheduleCache } from "./services/schedule-cache.service.js";
import { usersService } from "./services/users.service.js";

registerCommands(bot);
registerCallBackHandlers(bot);
registerMessageHandler(bot);

try {
    await scheduleCache.refresh();
    console.log("✅ Расписание загружено в общий кэш");
} catch (error) {
    console.error("[Startup] Не удалось загрузить расписание:", error.message);
}

try {
    await configureTelegramMenu();
    console.log("✅ Команды Telegram зарегистрированы");
} catch (error) {
    console.error("[Startup] Не удалось зарегистрировать меню Telegram:", error.message);
}

startReminderScheduler({ messenger: bot, userService: usersService });

console.log("✅ Schedule Bot запущен");
