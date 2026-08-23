import { sheets } from "./google.sheets.js";

const SHEET_NAME = "Расписание";

const MONTHS = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сент.",
    "окт.",
    "нояб.",
    "дек.",
];

function normalizeLogin(login) {
    return login
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
}

function getTodayLabel() {
    const now = new Date();

    const day = now.getDate();
    const month = MONTHS[now.getMonth()];

    return `${day} ${month}`;
}

function isDateCell(value) {
    const text = String(value ?? "").trim().toLowerCase();

    return /^\d{1,2}\s+(янв\.|фев\.|мар\.|апр\.|мая|июн\.|июл\.|авг\.|сент\.|окт\.|нояб\.|дек\.)$/.test(
        text
    );
}

function isStaffCell(value) {
    return /@[a-zA-Z0-9_]+/.test(String(value ?? ""));
}

function isTimeCell(value) {
    return /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(
        String(value ?? "").trim()
    );
}

function findDateRow(rows, dateLabel) {
    const target = dateLabel.toLowerCase();

    return rows.findIndex((row) =>
        row.some(
            (cell) =>
                String(cell ?? "").trim().toLowerCase() === target
        )
    );
}

function findEmployeeStart(rows, dateRow, dateColumn, login) {
    const target = `@${normalizeLogin(login)}`;

    const headerRow = rows[dateRow] ?? [];

    // Правая граница сегодняшнего блока:
    // идём вправо от даты до первой пустой ячейки.
    let endColumn = dateColumn + 1;

    while (
        endColumn < headerRow.length &&
        String(headerRow[endColumn] ?? "").trim()
    ) {
        endColumn++;
    }

    // 1. Сначала ищем обычного сотрудника в шапке сегодняшнего дня.
    for (
        let columnIndex = dateColumn + 1;
        columnIndex < endColumn;
        columnIndex++
    ) {
        const value = String(headerRow[columnIndex] ?? "").toLowerCase();

        if (value.includes(target)) {
            return {
                rowIndex: dateRow,
                columnIndex,
            };
        }
    }

    // 2. Если в шапке нет — ищем ночника внутри сегодняшнего блока.
    for (
        let rowIndex = dateRow + 1;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex] ?? [];
        const time = row[dateColumn];

        // В столбце сегодняшней даты время закончилось —
        // значит сегодняшний блок закончился.
        if (!isTimeCell(time)) {
            break;
        }

        for (
            let columnIndex = dateColumn + 1;
            columnIndex < endColumn;
            columnIndex++
        ) {
            const value = String(row[columnIndex] ?? "").toLowerCase();

            if (value.includes(target)) {
                return {
                    rowIndex,
                    columnIndex,
                };
            }
        }
    }

    return null;
}

export async function getTodaySchedule(login) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `'${SHEET_NAME}'`,
    });

    const rows = response.data.values ?? [];

    const todayLabel = getTodayLabel();

    const dateRow = findDateRow(rows, todayLabel);

    if (dateRow === -1) {
        return {
            status: "DATE_NOT_FOUND",
            date: todayLabel,
            schedule: [],
        };
    }

    const dateColumn = rows[dateRow].findIndex(
        (cell) =>
            String(cell ?? "").trim().toLowerCase() === todayLabel.toLowerCase()
    );

    const employee = findEmployeeStart(
        rows,
        dateRow,
        dateColumn,
        login
    );

    if (!employee) {
        return {
            status: "EMPLOYEE_NOT_FOUND",
            date: todayLabel,
            schedule: [],
        };
    }

    const schedule = [];

    for (
        let rowIndex = employee.rowIndex + 1;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex];
        const activity = row[employee.columnIndex];

        if (isStaffCell(activity)) {
            break;
        }

        if (!activity || !String(activity).trim()) {
            const time = row[dateColumn];

            if (!time) {
                break;
            }

            continue;
        }

        const time = row[dateColumn];

        if (!time) {
            break;
        }

        schedule.push({
            time: String(time).trim(),
            activity: String(activity).trim(),
        });
    }

    return {
        status: "OK",
        date: todayLabel,
        staffLogin: normalizeLogin(login),
        schedule,
    };
}