export const TELEGRAM_COMMANDS = [
    { command: "start", description: "Открыть главное меню" },
    { command: "login", description: "Сменить логин сотрудника" },
];

export async function configureTelegramMenu(telegramBot) {
    await telegramBot.setMyCommands(TELEGRAM_COMMANDS);
    await telegramBot.setChatMenuButton({
        menu_button: JSON.stringify({ type: "commands" }),
    });
}
