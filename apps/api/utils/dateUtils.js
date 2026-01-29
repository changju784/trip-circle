export function generateDays(startDate, endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);

    s.setUTCHours(0, 0, 0, 0);
    e.setUTCHours(0, 0, 0, 0);

    const days = [];
    const current = new Date(s);

    while (current <= e) {
        days.push({
            date: new Date(current).toISOString(),
            stops: []
        });
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
}