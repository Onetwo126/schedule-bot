import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = process.env.USERS_FILE
    ? path.resolve(process.env.USERS_FILE)
    : path.join(__dirname, "../../data/users.json");

function readUsers() {
    let raw;

    try {
        raw = fs.readFileSync(USERS_FILE, "utf-8");
    } catch (error) {
        if (error.code === "ENOENT") {
            return {};
        }

        throw error;
    }

    if (!raw.trim()) {
        return {};
    }

    return JSON.parse(raw);
}

function writeUsers(users) {
    const usersDirectory = path.dirname(USERS_FILE);
    const temporaryFile = `${USERS_FILE}.${process.pid}.${Date.now()}.tmp`;

    fs.mkdirSync(usersDirectory, { recursive: true });

    try {
        fs.writeFileSync(
            temporaryFile,
            JSON.stringify(users, null, 2),
            {
                encoding: "utf-8",
                mode: 0o600,
            }
        );
        fs.renameSync(temporaryFile, USERS_FILE);
    } finally {
        if (fs.existsSync(temporaryFile)) {
            fs.unlinkSync(temporaryFile);
        }
    }
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
