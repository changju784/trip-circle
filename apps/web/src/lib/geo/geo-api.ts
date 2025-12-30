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
    lat?: number;
    lng?: number;
}

/**
 * Search for specific locations/addresses (OSM)
 * Now accepts optional destinations to provide search context
 */
export async function geocodeSearch(query: string, destinations: any[] = []): Promise<GeoLocation[]> {
    if (!query.trim()) return [];

    const destContext = destinations.length > 0
        ? `&destinations=${encodeURIComponent(JSON.stringify(destinations))}`
        : '';

    return apiGet<GeoLocation[]>(`/api/geo/search?q=${encodeURIComponent(query)}${destContext}`);
}

/**
 * Get the top result for a specific location
 */
export async function geocodeLocation(query: string, destinations: any[] = []): Promise<GeoLocation | null> {
    const results = await geocodeSearch(query, destinations);
    return results.length > 0 ? results[0] : null;
}

/**
 * Search for cities specifically (GeoDB)
 */
export async function searchCities(query: string): Promise<CityOption[]> {
    if (!query.trim()) return [];

    return apiGet<CityOption[]>(`/api/geo/search?q=${encodeURIComponent(query)}&type=city`);
}