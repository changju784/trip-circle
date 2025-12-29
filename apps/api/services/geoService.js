const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const GEODB_BASE_URL = 'https://geodb-free-service.wirefreethought.com/v1/geo/cities';
const USER_AGENT = 'TripCircle-Backend/1.0 (your-email@example.com)';

/**
 * 1. Geocoding
 * Best for specific locations/addresses
 */
export async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&limit=10`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        const data = await res.json();

        return data.map(item => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name
        }));
    } catch (err) {
        console.error("OSM Search Error:", err);
        return [];
    }
}

/**
 * 2. City Search
 * Best for finding specific cities with stable IDs
 */
export async function searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const url = `${GEODB_BASE_URL}?limit=10&namePrefix=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.data) return [];
        return data.data.map(city => ({
            id: city.id,
            label: `${city.city}, ${city.region ? city.region + ", " : ""}${city.country}`
        }));
    } catch (err) {
        console.error("GeoDB Search Error:", err);
        return [];
    }
}