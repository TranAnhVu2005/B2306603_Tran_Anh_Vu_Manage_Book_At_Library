const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidParts(year, month, day) {
    const check = new Date(Date.UTC(year, month - 1, day));
    return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

function dateFromCalendarKey(value) {
    if (value instanceof Date) {
        if (!Number.isFinite(value.getTime())) throw new Error("Ngày không hợp lệ.");
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    const text = String(value ?? "").trim();
    const match = text.match(DATE_ONLY_PATTERN);
    if (match) {
        const [, yearText, monthText, dayText] = match;
        const year = Number(yearText), month = Number(monthText), day = Number(dayText);
        if (!isValidParts(year, month, day)) throw new Error("Ngày không hợp lệ.");
        return new Date(Date.UTC(year, month - 1, day));
    }
    // Accept ISO values returned by this API as well as date-only form values.
    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
        const instant = new Date(text);
        if (!Number.isFinite(instant.getTime())) throw new Error("Ngày không hợp lệ.");
        return new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()));
    }
    throw new Error("Ngày phải theo định dạng YYYY-MM-DD.");
}

function calendarKey(value) {
    if (value instanceof Date) {
        if (!Number.isFinite(value.getTime())) return "";
        return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
    }
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/);
    return match ? match[1] : "";
}

function localCalendarKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function addCalendarDays(value, days) {
    const result = dateFromCalendarKey(value);
    result.setUTCDate(result.getUTCDate() + Number(days));
    return result;
}

module.exports = { dateFromCalendarKey, calendarKey, localCalendarKey, addCalendarDays };
