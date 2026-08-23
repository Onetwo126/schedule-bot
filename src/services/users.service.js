import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "../../data/users.json");

function readUsers() {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");

    if (!raw.trim()) {
        return {};
    }

    return JSON.parse(raw);
}

function writeUsers(users) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2),
        "utf-8"
    );
}

function getUser(telegramId) {
    const users = readUsers();

    return users[String(telegramId)] ?? null;
}

function userExists(telegramId) {
    return getUser(telegramId) !== null;
}

function saveUser(telegramId, staffLogin) {
    const users = readUsers();

    users[String(telegramId)] = {
        staff_login: staffLogin,
    };

    writeUsers(users);

    return users[String(telegramId)];
}

function getAllUsers() {
    return readUsers();
}

export const usersService = {
    getUser,
    getAllUsers,
    userExists,
    saveUser,
};