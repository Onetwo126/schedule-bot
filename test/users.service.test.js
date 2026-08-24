import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

test("keeps all users during nearly simultaneous registrations", async () => {
    const temporaryDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "schedule-bot-users-")
    );
    const usersFile = path.join(temporaryDirectory, "users.json");
    const previousUsersFile = process.env.USERS_FILE;

    process.env.USERS_FILE = usersFile;

    try {
        const { usersService } = await import(
            `../src/services/users.service.js?test=${Date.now()}`
        );

        await Promise.all(
            Array.from({ length: 20 }, (_, index) =>
                Promise.resolve().then(() =>
                    usersService.saveUser(index, `employee_${index}`)
                )
            )
        );

        const savedUsers = JSON.parse(
            fs.readFileSync(usersFile, "utf-8")
        );

        assert.equal(Object.keys(savedUsers).length, 20);
        assert.equal(savedUsers["0"].staff_login, "employee_0");
        assert.equal(savedUsers["19"].staff_login, "employee_19");
        assert.deepEqual(
            fs.readdirSync(temporaryDirectory),
            ["users.json"]
        );
    } finally {
        if (previousUsersFile === undefined) {
            delete process.env.USERS_FILE;
        } else {
            process.env.USERS_FILE = previousUsersFile;
        }

        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
});
