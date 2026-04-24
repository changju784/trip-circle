/**
 * Trips API module
 * Handles all trip-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../api";

export type StopCategory =
    | 'dining'
    | 'lodging'
    | 'sightseeing'
    | 'activity'
    | 'shopping'
    | 'transit'
    | 'nightlife'
    | 'other'
    | 'none';

export interface Stop {
    id: string;
    title: string;
    category?: StopCategory;
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
    lat?: number;
    lng?: number;
}

export interface PlaceSuggestion {
    xid: string;
    title: string;
    category: StopCategory;
    locationName: string;
    lat: number;
    lng: number;
    description: string;
    imageUrl: string | null;
    rate: number | null;
}

export interface TripDocument {
    _id: string;
    name: string;
    url: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    status: 'uploaded' | 'processing' | 'parsed' | 'failed';
    isApplied: boolean;
    extractedData?: {
        category: StopCategory;
        vendor?: string;
        amount?: number;
        currency?: string;
        date?: string;
        time?: string;
        location?: {
            name: string;
            address: string;
        };
        description?: string;
        aiInsights?: {
            matchScore: number;
            reasoning: string;
        };
        metadata?: any;
    };
}

export const TripTagsEnum = [
    'spring', 'summer', 'fall', 'winter',
    'solo', 'couple', 'family', 'friends',
    'budget', 'luxury', 'adventure',
    'nature', 'city break', 'beach', 'foodie',
    'relaxing', 'photography', 'hiking', 'historic'
] as const;

export type TripTag = (typeof TripTagsEnum)[number];

export interface Trip {
    _id: string;
    id?: string;
    title: string;
    description: string;
    destinations: Destination[];
    tags: TripTag[];
    isPublic: boolean;
    totalPrice: number | null;
    budget: number | null;
    thumbnail: string | null;
    documents: TripDocument[];
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
    budget?: number | null;
    days?: DayWithStops[];
    isPublic?: boolean;
    tags?: TripTag[];
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
export async function forkTrip(
    tripId: string,
    userId: string,
    payload?: any // New parameter for dates/decisions
): Promise<{ message: string; trip: Trip }> {
    return apiPost(`/api/trips/fork`, { tripId, userId, ...payload }); //
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

/**
 * Upload a document
 */
export async function uploadDocument(tripId: string, file: File): Promise<Trip> {
    const formData = new FormData();
    formData.append("file", file);
    return apiPost<Trip>(`/api/trips/${tripId}/documents`, formData);
}

/**
 * Delete a document
 */
export async function deleteDocument(tripId: string, documentId: string): Promise<Trip> {
    return apiDelete<Trip>(`/api/trips/${tripId}/documents/${documentId}`);
}

/**
 * Trigger AI Parsing
 */
export async function parseDocument(tripId: string, documentId: string): Promise<TripDocument> {
    return apiPost<TripDocument>(`/api/trips/${tripId}/documents/${documentId}/parse`, {});
}

/**
 * Get place suggestions near coordinates
 */
export async function getSuggestions(
    lat: number | null,
    lng: number | null,
    options?: { radius?: number; limit?: number; kinds?: string; city?: string }
): Promise<PlaceSuggestion[]> {
    const params = new URLSearchParams();
    if (lat != null) params.set("lat", lat.toString());
    if (lng != null) params.set("lng", lng.toString());
    if (options?.city) params.set("city", options.city);
    if (options?.radius != null) params.set("radius", options.radius.toString());
    if (options?.limit != null) params.set("limit", options.limit.toString());
    if (options?.kinds) params.set("kinds", options.kinds);
    const res = await apiGet<{ suggestions: PlaceSuggestion[] }>(`/api/suggestions?${params}`);
    return res.suggestions;
}