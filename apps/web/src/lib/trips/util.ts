import { Trip } from "@/lib/trips/trips-api";

export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

    const sameYear = start.getFullYear() === end.getFullYear();

    const startStr = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    });

    const endStr = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${startStr} – ${endStr}`;
}

export function buildDestinationSummary(trip: Trip): string {
    const pieces: string[] = [];

    if (Array.isArray(trip.destinations) && trip.destinations.length > 0) {
        trip.destinations.forEach((dest) => {
            if (dest.label) {
                pieces.push(dest.label);
            }
        });
    }

    if (pieces.length === 0) return "Flexible destination";
    return pieces.join(" • ");
}

/**
 * Normalizes a date string or object to midnight UTC.
 */
export const normalizeToUTC = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

/**
 * Generates a clean array of day objects for the new range.
 */
export const generateNewDaysArray = (startDate: string, endDate: string) => {
    const start = normalizeToUTC(startDate);
    const end = normalizeToUTC(endDate);

    const days = [];
    let current = new Date(start);

    while (current <= end) {
        days.push({
            date: new Date(current).toISOString(),
            stops: [],
            pricePerDay: 0
        });
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
};

/**
 * Identifies any stops that fall outside the newly selected [start, end] range.
 */
export const getMismatchedStops = (tripDays: any[], newStart: string, newEnd: string) => {
    const startStr = normalizeToUTC(newStart).toISOString().split('T')[0];
    const endStr = normalizeToUTC(newEnd).toISOString().split('T')[0];

    return tripDays.flatMap((day: any) => {
        const dayDateStr = day.date.split("T")[0];

        if (dayDateStr < startStr || dayDateStr > endStr) {
            return (day.stops || []).map((stop: any) => ({
                ...stop,
                originalDate: day.date
            }));
        }
        return [];
    });
};