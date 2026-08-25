import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { UserRepository } from "./user.repository.js";
import { SettingsRepository } from "./settings.repository.js";

function mapUser(row) {
    return row ? {
        id: row.id,
        messenger: row.messenger,
        external_user_id: row.external_user_id,
        staff_login: row.staff_login,
        knowledge_base: row.knowledge_base,
    } : null;
}

export class SqliteUserRepository extends UserRepository {
    constructor(database) {
        super();
        this.database = database;
    }

    getByExternalId(messenger, externalUserId) {
        return mapUser(this.database.prepare(`
            SELECT id, messenger, external_user_id, staff_login, knowledge_base
            FROM users WHERE messenger = ? AND external_user_id = ?
        `).get(messenger, String(externalUserId)));
    }

    getAll() {
        return this.database.prepare(`
            SELECT id, messenger, external_user_id, staff_login, knowledge_base
            FROM users ORDER BY id
        `).all().map(mapUser);
    }

    save(user) {
        this.database.prepare(`
            INSERT INTO users (messenger, external_user_id, staff_login, knowledge_base, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(messenger, external_user_id) DO UPDATE SET
                staff_login = excluded.staff_login,
                knowledge_base = COALESCE(excluded.knowledge_base, users.knowledge_base),
                updated_at = CURRENT_TIMESTAMP
        `).run(user.messenger, String(user.external_user_id), user.staff_login, user.knowledge_base ?? null);

        return this.getByExternalId(user.messenger, user.external_user_id);
    }
}

export class SqliteSettingsRepository extends SettingsRepository {
    constructor(database) {
        super();
        this.database = database;
    }

    get(userId, key) {
        const row = this.database.prepare(
            "SELECT value FROM user_settings WHERE user_id = ? AND key = ?"
        ).get(userId, key);
        return row ? JSON.parse(row.value) : null;
    }

    set(userId, key, value) {
        this.database.prepare(`
            INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
            ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
        `).run(userId, key, JSON.stringify(value));
    }
}

function initializeSchema(database) {
    database.exec(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            messenger TEXT NOT NULL,
            external_user_id TEXT NOT NULL,
            staff_login TEXT NOT NULL,
            knowledge_base TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(messenger, external_user_id)
        );
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY(user_id, key),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS migrations (
            name TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
}

function importLegacyUsers(database, legacyUsersFile) {
    if (!legacyUsersFile || !fs.existsSync(legacyUsersFile)) return 0;
    if (database.prepare("SELECT value FROM migrations WHERE name = ?").get("legacy_users_json")) return 0;

    const raw = fs.readFileSync(legacyUsersFile, "utf-8");
    const users = raw.trim() ? JSON.parse(raw) : {};
    const insert = database.prepare(`
        INSERT INTO users (messenger, external_user_id, staff_login) VALUES ('telegram', ?, ?)
        ON CONFLICT(messenger, external_user_id) DO NOTHING
    `);
    let imported = 0;

    database.exec("BEGIN");
    try {
        for (const [telegramId, user] of Object.entries(users)) {
            if (!user?.staff_login) continue;
            imported += Number(insert.run(String(telegramId), user.staff_login).changes);
        }
        database.prepare("INSERT INTO migrations (name, value) VALUES (?, ?)")
            .run("legacy_users_json", new Date().toISOString());
        database.exec("COMMIT");
    } catch (error) {
        database.exec("ROLLBACK");
        throw error;
    }
    return imported;
}

export function createSqliteRepositories({ databaseFile, legacyUsersFile } = {}) {
    const resolvedDatabaseFile = path.resolve(databaseFile ?? process.env.USERS_DB ?? "data/schedule-bot.db");
    fs.mkdirSync(path.dirname(resolvedDatabaseFile), { recursive: true });
    const database = new DatabaseSync(resolvedDatabaseFile);
    initializeSchema(database);

    return {
        database,
        importedUsers: importLegacyUsers(database, legacyUsersFile ?? process.env.USERS_FILE),
        userRepository: new SqliteUserRepository(database),
        settingsRepository: new SqliteSettingsRepository(database),
    };
}
