import test from "node:test";
import assert from "node:assert/strict";

import { getTodayScheduleFromRows } from "../src/services/schedule.service.js";
import { getMoscowTime } from "../src/utils/time.util.js";

const MONTHS = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сент.",
    "окт.",
    "нояб.",
    "дек.",
];

test("skips an invalid time row and keeps valid schedule rows", async () => {
    const now = getMoscowTime();
    const todayLabel = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
    const originalWarn = console.warn;
    const warnings = [];

    const rows = [
                [todayLabel, "Сотрудник (@test_login)"],
                ["10:00-11:00", "Первая активность"],
                ["25:10-26:10", "Повреждённая строка"],
                ["11:00-12:00", "Вторая активность"],
                [],
            ];
    console.warn = (message) => warnings.push(message);

    try {
        const result = getTodayScheduleFromRows(rows, "test_login");

        assert.equal(result.status, "OK");
        assert.deepEqual(result.schedule, [
            { time: "10:00-11:00", activity: "Первая активность" },
            { time: "11:00-12:00", activity: "Вторая активность" },
        ]);
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], /некорректное время/);
    } finally {
        console.warn = originalWarn;
    }
});
