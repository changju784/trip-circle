/**
 * Geo API module
 * Handles all location and city search API calls via the backend proxy
 */

import { apiGet, apiPost } from "../api";

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

export interface RouteData {
    geometry: any;      // GeoJSON for the map
    time: number;       // Travel time in minutes
    distance: string;   // Distance in km
    mode: string;       // 'walk', 'drive', or 'transit'
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

/**
 * Reverse geocode a location from coordinates
 * Converts [lat, lng] into a human-readable address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
    try {
        return await apiGet<GeoLocation>(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
    } catch (error) {
        console.error("Reverse Geocode Error:", error);
        return null;
    }
}

/**
 * Fetch routing data between stops
 * @param stops - Array of lat/lng coordinates
 * @param mode - 'walk', 'drive', or 'transit'
 */
export async function getMapRoute(stops: { lat: number, lng: number }[], mode: string = 'walk'): Promise<RouteData | null> {
    if (stops.length < 2) return null;

    try {
        return await apiPost<RouteData>('/api/geo/route', { stops, mode });
    } catch (error) {
        console.error("Route Fetch Error:", error);
        return null;
    }
}