import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { createSqliteRepositories } from "../src/repositories/sqlite.repositories.js";

test("migrates legacy users and restores them after reopening SQLite", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "schedule-bot-users-"));
    const databaseFile = path.join(directory, "users.db");
    const legacyUsersFile = path.join(directory, "users.json");
    fs.writeFileSync(legacyUsersFile, JSON.stringify({ "123": { staff_login: "tanya" } }));

    const first = createSqliteRepositories({ databaseFile, legacyUsersFile });
    assert.equal(first.importedUsers, 1);
    assert.equal(first.userRepository.getByExternalId("telegram", "123").staff_login, "tanya");
    first.database.close();

    const second = createSqliteRepositories({ databaseFile, legacyUsersFile });
    assert.equal(second.importedUsers, 0);
    assert.equal(second.userRepository.getByExternalId("telegram", "123").staff_login, "tanya");
    second.database.close();
    fs.rmSync(directory, { recursive: true, force: true });
});

test("stores knowledge base and settings behind repository interfaces", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "schedule-bot-settings-"));
    const repositories = createSqliteRepositories({ databaseFile: path.join(directory, "users.db") });
    const user = repositories.userRepository.save({
        messenger: "telegram",
        external_user_id: "456",
        staff_login: "employee",
        knowledge_base: "support",
    });
    repositories.settingsRepository.set(user.id, "reminder_minutes", 3);

    assert.equal(user.knowledge_base, "support");
    assert.equal(repositories.settingsRepository.get(user.id, "reminder_minutes"), 3);
    repositories.database.close();
    fs.rmSync(directory, { recursive: true, force: true });
});
