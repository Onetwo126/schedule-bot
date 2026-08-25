import test from "node:test";
import assert from "node:assert/strict";
import { ScheduleCache } from "../src/services/schedule-cache.service.js";

test("one refresh serves any number of users from memory", async () => {
    let googleReads = 0;
    const rows = [["Расписание"]];
    const cache = new ScheduleCache(async () => {
        googleReads++;
        return rows;
    });
    await cache.refresh();
    for (let index = 0; index < 30; index++) assert.equal(cache.getRows(), rows);
    assert.equal(googleReads, 1);
    assert.equal(cache.hasRows(), true);
});

test("combines overlapping refreshes into one Google read", async () => {
    let googleReads = 0;
    const cache = new ScheduleCache(async () => {
        googleReads++;
        return [];
    });
    await Promise.all([cache.refresh(), cache.refresh(), cache.refresh()]);
    assert.equal(googleReads, 1);
});
