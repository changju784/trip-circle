export type Stop = {
    id: string;
    title: string;
    time?: string; // HH:MM
    locationName?: string;
    lat?: number | null;
    lng?: number | null;
    description?: string;
};

export type Day = {
    date: string; // ISO date YYYY-MM-DD
    stops: Stop[];
};

export type Trip = {
    id: string;
    title: string;
    city?: string;
    description?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isPublic?: boolean;
    days: Day[];
    createdAt: number;
};

const STORAGE_KEY = "trip-circle-trips";

function readAll(): Trip[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function writeAll(trips: Trip[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function generateId(prefix = "t") {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function dateRange(startIso: string, endIso: string): string[] {
    const result: string[] = [];
    const start = new Date(startIso + "T00:00:00");
    const end = new Date(endIso + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        result.push(iso);
    }
    return result;
}

export function createTrip(payload: {
    title: string;
    city?: string;
    description?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isPublic?: boolean;
}): Trip {
    const id = generateId("trip");
    const dates = dateRange(payload.startDate, payload.endDate);
    const days: Day[] = dates.map((d) => ({ date: d, stops: [] }));
    const trip: Trip = {
        id,
        title: payload.title,
        city: payload.city,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        isPublic: !!payload.isPublic,
        days,
        createdAt: Date.now(),
    };
    const all = readAll();
    all.unshift(trip);
    writeAll(all);
    return trip;
}

export function getTripById(id: string): Trip | null {
    const all = readAll();
    return all.find((t) => t.id === id) ?? null;
}

export function saveTrip(updated: Trip) {
    const all = readAll();
    const idx = all.findIndex((t) => t.id === updated.id);
    if (idx >= 0) {
        all[idx] = updated;
    } else {
        all.unshift(updated);
    }
    writeAll(all);
}

export function addStopToTrip(tripId: string, dayIndex: number, stop: Omit<Stop, "id">) {
    const trip = getTripById(tripId);
    if (!trip) return null;
    const s: Stop = { id: generateId("stop"), ...stop };
    if (!trip.days[dayIndex]) {
        // ensure day exists
        trip.days[dayIndex] = { date: trip.startDate, stops: [] };
    }
    trip.days[dayIndex].stops.push(s);
    saveTrip(trip);
    return s;
}

export function getAllTrips(): Trip[] {
    return readAll();
}
