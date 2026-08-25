import test from "node:test";
import assert from "node:assert/strict";
import { runReminderCycle } from "../src/scheduler/reminder.scheduler.js";

test("scheduler refreshes Google cache once before checking 30 users", async () => {
    let refreshes = 0;
    let scheduleChecks = 0;
    const users = Array.from({ length: 30 }, (_, index) => ({
        messenger: "telegram",
        external_user_id: String(index),
        staff_login: `employee_${index}`,
    }));

    await runReminderCycle({
        cache: { async refresh() { refreshes++; }, hasRows() { return true; } },
        userService: { getAllUsers() { return users; } },
        scheduleProvider() {
            scheduleChecks++;
            return { status: "OK", schedule: [] };
        },
        messenger: { async sendMessage() { throw new Error("unexpected reminder"); } },
    });

    assert.equal(refreshes, 1);
    assert.equal(scheduleChecks, 30);
});
