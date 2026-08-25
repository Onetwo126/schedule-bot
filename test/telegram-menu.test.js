import test from "node:test";
import assert from "node:assert/strict";
import { configureTelegramMenu, TELEGRAM_COMMANDS } from "../src/transports/telegram/telegram-menu.js";

test("registers Telegram commands and the standard commands menu button", async () => {
    const calls = [];
    const telegramBot = {
        async setMyCommands(commands) { calls.push(["commands", commands]); },
        async setChatMenuButton(options) { calls.push(["menu", options]); },
    };
    await configureTelegramMenu(telegramBot);

    assert.deepEqual(calls[0], ["commands", TELEGRAM_COMMANDS]);
    assert.deepEqual(JSON.parse(calls[1][1].menu_button), { type: "commands" });
});
