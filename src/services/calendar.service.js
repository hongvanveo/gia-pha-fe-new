import { api, unwrap } from "../lib/api.js";

/**
 * Spec:
 * GET /api/calendar/convert/solar-to-lunar?date=...
 * GET /api/calendar/anniversaries?month=...
 * GET /api/calendar/birthdays?month=...
 */
export const calendarService = {
    async solarToLunar(date) {
        const res = await api.get("/calendar/convert/solar-to-lunar", { params: { date } });
        return unwrap(res);
    },
    async anniversaries(month) {
        const res = await api.get("/calendar/anniversaries", { params: { month } });
        return unwrap(res);
    },
    async birthdays(month) {
        const res = await api.get("/calendar/birthdays", { params: { month } });
        return unwrap(res);
    },
};
