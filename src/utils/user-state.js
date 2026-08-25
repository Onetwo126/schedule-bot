const waitingUsers = new Set();

export function waitForStaffLogin(telegramId) {
    waitingUsers.add(telegramId);
}

export function isWaitingForStaffLogin(telegramId) {
    return waitingUsers.has(telegramId);
}

export function stopWaitingForStaffLogin(telegramId) {
    waitingUsers.delete(telegramId);
}
