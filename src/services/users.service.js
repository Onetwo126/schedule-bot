import path from "path";
import { fileURLToPath } from "url";
import { createSqliteRepositories } from "../repositories/sqlite.repositories.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repositories = createSqliteRepositories({
    databaseFile: process.env.USERS_DB ?? path.join(__dirname, "../../data/schedule-bot.db"),
    legacyUsersFile: process.env.USERS_FILE ?? path.join(__dirname, "../../data/users.json"),
});

if (repositories.importedUsers > 0) {
    console.log(`✅ Из JSON в SQLite перенесено пользователей: ${repositories.importedUsers}`);
}

function normalizeIdentity(identity) {
    return typeof identity === "object"
        ? identity
        : { messenger: "telegram", externalUserId: identity };
}

function getUser(identity) {
    const normalized = normalizeIdentity(identity);
    return repositories.userRepository.getByExternalId(
        normalized.messenger,
        normalized.externalUserId
    );
}

function userExists(telegramId) {
    return getUser(telegramId) !== null;
}

function saveUser(identity, staffLogin, extra = {}) {
    const normalized = normalizeIdentity(identity);
    return repositories.userRepository.save({
        messenger: normalized.messenger,
        external_user_id: String(normalized.externalUserId),
        staff_login: staffLogin,
        knowledge_base: extra.knowledge_base ?? null,
    });
}

function getAllUsers() {
    return repositories.userRepository.getAll();
}

export const usersService = {
    getUser,
    getAllUsers,
    userExists,
    saveUser,
    settings: repositories.settingsRepository,
};
