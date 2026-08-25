import { fetchScheduleRows } from "./google.sheets.js";

export class ScheduleCache {
    constructor(loadRows = fetchScheduleRows) {
        this.loadRows = loadRows;
        this.rows = null;
        this.updatedAt = null;
        this.refreshPromise = null;
    }

    async refresh() {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            const rows = await this.loadRows();
            this.rows = rows;
            this.updatedAt = new Date();
            return rows;
        })();

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    getRows() {
        if (!this.rows) {
            throw new Error("Расписание ещё не загружено в кэш");
        }
        return this.rows;
    }

    hasRows() {
        return this.rows !== null;
    }

    setRowsForTest(rows) {
        this.rows = rows;
        this.updatedAt = new Date();
    }
}

export const scheduleCache = new ScheduleCache();
