import { getCurrentActivityMessage } from "../services/activity.service.js";
import { staffLoginExistsInRows } from "../services/google.sheets.js";
import { scheduleCache } from "../services/schedule-cache.service.js";
import { getTodaySchedule } from "../services/schedule.service.js";
import { usersService } from "../services/users.service.js";

export const botApplication = {
    getUser(identity) {
        return usersService.getUser(identity);
    },

    changeStaffLogin(identity, staffLogin) {
        if (!staffLoginExistsInRows(scheduleCache.getRows(), staffLogin)) {
            return null;
        }
        return usersService.saveUser(identity, staffLogin);
    },

    getTodaySchedule(identity) {
        const user = this.getUser(identity);
        return user ? getTodaySchedule(user.staff_login) : null;
    },

    getCurrentActivityMessage(identity) {
        const user = this.getUser(identity);
        return user ? getCurrentActivityMessage(user.staff_login) : null;
    },
};
