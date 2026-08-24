import test from "node:test";
import assert from "node:assert/strict";

import { getMoscowTime } from "../src/utils/time.util.js";

test("returns Moscow date and time regardless of the server timezone", () => {
    const moscowTime = getMoscowTime(
        new Date("2026-08-23T21:30:00.000Z")
    );

    assert.equal(moscowTime.getFullYear(), 2026);
    assert.equal(moscowTime.getMonth(), 7);
    assert.equal(moscowTime.getDate(), 24);
    assert.equal(moscowTime.getHours(), 0);
    assert.equal(moscowTime.getMinutes(), 30);
});
