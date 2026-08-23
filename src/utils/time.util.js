export function getMoscowTime() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Europe/Moscow",
        })
    );
}