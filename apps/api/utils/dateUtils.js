export function generateDays(startDate, endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = [];

    const current = new Date(s);
    while (current <= e) {
        days.push({
            date: current.toISOString(),
            stops: []
        });
        current.setDate(current.getDate() + 1);
    }

    return days;
}