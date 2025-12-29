/**
 * Trips API module
 * Handles all trip-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../api";

export interface Stop {
    id: string;
    title: string;
    time?: string;
    locationName?: string;
    lat?: number | null;
    lng?: number | null;
    price?: number | null;
    description?: string;
}

export interface DayWithStops {
    date: string;
    stops: Stop[];
}

export interface Destination {
    id: string;
    label: string;
}

export interface Receipt {
    id: string;
    name: string;
    url: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    dayDate?: string;
}

export interface Trip {
    _id: string;
    id?: string;
    title: string;
    description: string;
    destinations: Destination[];
    isPublic: boolean;
    totalPrice: number | null;
    budget: number | null;
    thumbnail: string | null;
    receipts: Receipt[];
    startDate: string;
    endDate: string;
    days: DayWithStops[];
    members: string[];
    dateCreated: string;
}

export interface CreateTripInput {
    title: string;
    description?: string;
    destinations?: Destination[];
    startDate: string;
    endDate: string;
    days?: DayWithStops[];
    isPublic?: boolean;
    thumbnail?: string | null;
    members?: string[];
}

/**
 * Create a new trip
 */
export async function createTrip(input: CreateTripInput): Promise<Trip> {
    return apiPost<Trip>("/api/trips", input);
}

/**
 * Get a single trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip> {
    return apiGet<Trip>(`/api/trips/${tripId}`);
}

/**
 * Update a trip
 */
export async function updateTrip(
    tripId: string,
    updates: Partial<CreateTripInput>
): Promise<Trip> {
    return apiPut<Trip>(`/api/trips/${tripId}`, updates);
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripId: string): Promise<{ message: string; id: string }> {
    return apiDelete(`/api/trips/${tripId}`);
}

/**
 * Fork a trip (create a copy with current user as member)
 */
export async function forkTrip(tripId: string, userId: string): Promise<{ message: string; trip: Trip }> {
    return apiPost(`/api/trips/fork`, { tripId, userId });
}

/**
 * Get public trips with optional search
 */
export async function exploreTrips(
    query?: string,
    limit: number = 20,
    skip: number = 0
): Promise<Trip[]> {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    params.append("limit", limit.toString());
    params.append("skip", skip.toString());

    return apiGet<Trip[]>(`/api/trips/explore?${params.toString()}`);
}

/**
 * Get trips for the currently authenticated user
 */
export async function getMyTrips(): Promise<Trip[]> {
    return apiGet<Trip[]>(`/api/trips`);
}

/**
 * Share a trip with another user via email
 */
export async function shareTrip(tripId: string, email: string): Promise<{ message: string }> {
    return apiPost(`/api/trips/share`, { tripId, email });
}
