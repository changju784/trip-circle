const PHOTON_BASE_URL = 'https://photon.komoot.io/api';
const GEODB_BASE_URL = 'https://geodb-free-service.wirefreethought.com/v1/geo/cities';

/**
 * 1. Geocoding with Trip Context (Photon API)
 * Uses trip destinations to bias search results toward the trip area.
 */
export async function searchLocations(query, destinations = []) {
    if (!query || query.trim().length < 3) return []; // Photon recommends 3+ chars

    try {
        // Base Photon URL with limit
        let url = `${PHOTON_BASE_URL}/?q=${encodeURIComponent(query)}&limit=10`;

        // Apply Location Bias if destinations exist
        if (destinations && destinations.length > 0) {
            const validDestinations = destinations.filter(d => d.lat != null && d.lng != null);

            if (validDestinations.length > 0) {
                // Calculate geographic centroid (average) of all destinations
                const avgLat = validDestinations.reduce((sum, d) => sum + d.lat, 0) / validDestinations.length;
                const avgLng = validDestinations.reduce((sum, d) => sum + d.lng, 0) / validDestinations.length;

                // Bias results toward the trip center
                url += `&lat=${avgLat}&lon=${avgLng}`;
            }
        }

        const res = await fetch(url);

        if (!res.ok) {
            console.error("Photon API error:", res.statusText);
            return [];
        }

        const data = await res.json();

        // Photon returns GeoJSON features
        return (data.features || []).map(feature => {
            const { coordinates } = feature.geometry;
            const p = feature.properties;

            // Construct a clean display name from structured properties
            const labelParts = [
                p.name,
                p.street ? `${p.housenumber || ''} ${p.street}`.trim() : null,
                p.city,
                p.state,
                p.country
            ].filter(Boolean);

            return {
                // GeoJSON coordinates are [longitude, latitude]
                lat: coordinates[1],
                lng: coordinates[0],
                displayName: labelParts.join(', '),
                rawAddress: p // Keep raw properties if needed for debugging
            };
        });
    } catch (err) {
        console.error("Photon Search Error:", err);
        return [];
    }
}

/**
 * 2. City Search (GeoDB)
 * Stays the same, ensuring lat/lng are captured for trip destinations.
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
            label: `${city.city}, ${city.region ? city.region + ", " : ""}${city.country}`,
            lat: city.latitude,
            lng: city.longitude
        }));
    } catch (err) {
        console.error("GeoDB Search Error:", err);
        return [];
    }
}