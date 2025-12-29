/**
 * Geo API module
 * Handles all location and city search API calls via the backend proxy
 */

import { apiGet } from "../api";

export interface GeoLocation {
    lat: number;
    lng: number;
    displayName: string;
}

export interface CityOption {
    id: string;
    label: string;
}

/**
 * Search for specific locations/addresses (OSM)
 * Replaces the old frontend geocodeSearch
 */
export async function geocodeSearch(query: string): Promise<GeoLocation[]> {
    if (!query.trim()) return [];

    // Calls your new backend route: /api/geo/search?q=...
    return apiGet<GeoLocation[]>(`/api/geo/search?q=${encodeURIComponent(query)}`);
}

/**
 * Get the top result for a specific location
 * Replaces the old frontend geocodeLocation
 */
export async function geocodeLocation(query: string): Promise<GeoLocation | null> {
    const results = await geocodeSearch(query);
    return results.length > 0 ? results[0] : null;
}

/**
 * Search for cities specifically (GeoDB)
 * Replaces the old frontend citySearch
 */
export async function searchCities(query: string): Promise<CityOption[]> {
    if (!query.trim()) return [];

    // Calls your new backend route with type=city: /api/geo/search?q=...&type=city
    return apiGet<CityOption[]>(`/api/geo/search?q=${encodeURIComponent(query)}&type=city`);
}