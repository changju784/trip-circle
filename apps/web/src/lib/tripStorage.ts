import { TripAccess } from "./roles";

export type Stop = {
    id: string;
    title: string;
    time?: string; // HH:MM
    locationName?: string;
    lat?: number | null;
    lng?: number | null;
    price?: number;
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
    thumbnail?: string | null;
    ownerId?: string | null;
    collaborators?: TripAccess[];
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
    destinations?: string[];
    description?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isPublic?: boolean;
    thumbnail?: string | null;
    ownerId?: string | null;
}): Trip {
    const id = generateId("trip");
    const dates = dateRange(payload.startDate, payload.endDate);
    const days: Day[] = dates.map((d) => ({ date: d, stops: [] }));
    const trip: Trip = {
        id,
        title: payload.title,
        city: payload.city ?? (payload.destinations && payload.destinations[0]) ?? undefined,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        isPublic: !!payload.isPublic,
        thumbnail: payload.thumbnail ?? null,
        ownerId: payload.ownerId ?? null,
        days,
        createdAt: Date.now(),
    };
    // attach destinations as a cities-style property on the trip for now
    if (payload.destinations) {
        (trip as any).destinations = payload.destinations;
    }
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

export function updateStop(tripId: string, dayIndex: number, stopId: string, patch: Partial<Stop>) {
    const trip = getTripById(tripId);
    if (!trip) return null;
    const day = trip.days[dayIndex];
    if (!day) return null;
    const idx = day.stops.findIndex((s) => s.id === stopId);
    if (idx === -1) return null;
    day.stops[idx] = { ...day.stops[idx], ...patch };
    saveTrip(trip);
    return day.stops[idx];
}

export function deleteStop(tripId: string, stopId: string) {
    const trip = getTripById(tripId);
    if (!trip) return false;
    for (let i = 0; i < trip.days.length; i++) {
        const day = trip.days[i];
        const idx = day.stops.findIndex((s) => s.id === stopId);
        if (idx !== -1) {
            day.stops.splice(idx, 1);
            saveTrip(trip);
            return true;
        }
    }
    return false;
}

export function updateTrip(tripId: string, patch: Partial<Trip>) {
    const trip = getTripById(tripId);
    if (!trip) return null;
    const updated = { ...trip, ...patch };
    // ensure days are present if dates changed
    if (patch.startDate || patch.endDate) {
        const start = patch.startDate ?? trip.startDate;
        const end = patch.endDate ?? trip.endDate;
        const dates = dateRange(start, end);
        const newDays = dates.map((d) => {
            const existing = trip.days.find((x) => x.date === d);
            return existing ? existing : { date: d, stops: [] };
        });
        updated.days = newDays;
    }
    saveTrip(updated as Trip);
    return updated as Trip;
}

export function getAllTrips(): Trip[] {
    return readAll();
}

export function addCollaborator(tripId: string, userId: string, email?: string, role: "editor" | "reader" = "editor") {
    const trip = getTripById(tripId);
    if (!trip) return null;
    if (!trip.collaborators) trip.collaborators = [];

    // check if already exists
    const exists = trip.collaborators.find((c) => c.userId === userId);
    if (exists) {
        exists.role = role;
    } else {
        trip.collaborators.push({ userId, email, role });
    }
    saveTrip(trip);
    return trip;
}

export function removeCollaborator(tripId: string, userId: string) {
    const trip = getTripById(tripId);
    if (!trip) return null;
    if (!trip.collaborators) return trip;

    trip.collaborators = trip.collaborators.filter((c) => c.userId !== userId);
    saveTrip(trip);
    return trip;
}
