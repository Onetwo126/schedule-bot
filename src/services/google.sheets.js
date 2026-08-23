import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_NAME = "Расписание";

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "../../credentials/service-account.json"
    ),
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
});

export const sheets = google.sheets({
    version: "v4",
    auth,
});

function normalizeStaffLogin(staffLogin) {
    return staffLogin
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
}

export async function staffLoginExists(staffLogin) {
    const login = normalizeStaffLogin(staffLogin);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.GOOGLE_SHEET_ID,
        range: `'${SHEET_NAME}'`,
    });

    const rows = response.data.values ?? [];

    const loginPattern = new RegExp(
        `@${login.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zA-Z0-9_])`,
        "i"
    );

    return rows.some((row) =>
        row.some((cell) =>
            loginPattern.test(String(cell))
        )
    );
}