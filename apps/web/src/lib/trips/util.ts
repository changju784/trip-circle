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