import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/config.js";
import {
    normalizeStaffLogin,
    staffCellContainsLogin,
} from "../utils/staff-login.util.js";

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

export async function fetchScheduleRows() {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.GOOGLE_SHEET_ID,
        range: `'${SHEET_NAME}'`,
    });

    return response.data.values ?? [];
}

export function staffLoginExistsInRows(rows, staffLogin) {
    const login = normalizeStaffLogin(staffLogin);

    return rows.some((row) =>
        row.some((cell) =>
            staffCellContainsLogin(cell, login)
        )
    );
}
