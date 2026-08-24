const LOGIN_CHARACTER_CLASS = "a-zA-Z0-9_-";

export function normalizeStaffLogin(staffLogin) {
    return String(staffLogin ?? "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
}

export function staffCellContainsLogin(value, staffLogin) {
    const login = normalizeStaffLogin(staffLogin);

    if (!login) {
        return false;
    }

    const escapedLogin = login.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
    const pattern = new RegExp(
        `(^|[^${LOGIN_CHARACTER_CLASS}])@?${escapedLogin}(?![${LOGIN_CHARACTER_CLASS}])`,
        "i"
    );

    return pattern.test(String(value ?? ""));
}

export function isStaffCell(value) {
    const text = String(value ?? "").trim();

    return (
        /@[a-zA-Z0-9_-]+/.test(text) ||
        /^[А-ЯЁA-Z][^()]*\(\s*[a-zA-Z0-9_-]+\s*\)$/.test(text)
    );
}
