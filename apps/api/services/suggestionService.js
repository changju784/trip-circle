import dotenv from 'dotenv';
dotenv.config();

const OTM_BASE = 'https://api.opentripmap.com/0.1/en/places';
const API_KEY = process.env.OPENTRIPMAP_API_KEY;

// Maps OpenTripMap kinds string to our StopCategoryEnum
function mapKindsToCategory(kinds) {
    if (!kinds) return 'other';
    const k = kinds.toLowerCase();
    if (k.includes('foods') || k.includes('restaurant') || k.includes('cafe') || k.includes('bar')) return 'dining';
    if (k.includes('accomodation') || k.includes('hotel') || k.includes('hostel') || k.includes('motel')) return 'lodging';
    if (k.includes('shops') || k.includes('market')) return 'shopping';
    if (k.includes('sport') || k.includes('amusement') || k.includes('recreation')) return 'activity';
    if (k.includes('transport') || k.includes('railway') || k.includes('airport')) return 'transit';
    if (k.includes('adult') || k.includes('nightlife') || k.includes('casino')) return 'nightlife';
    if (
        k.includes('historic') || k.includes('architecture') || k.includes('cultural') ||
        k.includes('tourist') || k.includes('natural') || k.includes('museum') ||
        k.includes('park') || k.includes('interesting_places')
    ) return 'sightseeing';
    return 'other';
}

// Geocodes a city label to lat/lng using Photon (same service as geoService)
async function geocodeCityLabel(label) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(label)}&limit=1`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;
        return {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
        };
    } catch {
        return null;
    }
}

// Fetches place details for a single xid
async function fetchPlaceDetail(xid) {
    const url = `${OTM_BASE}/xid/${xid}?apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

/**
 * Returns POI suggestions near a coordinate or city name.
 * @param {number|null} lat
 * @param {number|null} lng
 * @param {string|null} city  - fallback city label when no lat/lng
 * @param {number} radius - meters (default 5000)
 * @param {number} limit  - max results (capped at 20)
 * @param {string} kinds  - comma-separated OpenTripMap kinds
 */
export async function getSuggestions({ lat, lng, city, radius = 5000, limit = 10, kinds = 'interesting_places' }) {
    if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY is not set');

    let resolvedLat = lat != null ? Number(lat) : null;
    let resolvedLng = lng != null ? Number(lng) : null;

    // Fallback: geocode from city label if no coordinates provided
    if (resolvedLat == null || resolvedLng == null || isNaN(resolvedLat) || isNaN(resolvedLng)) {
        if (!city) throw new Error('Either lat/lng or city is required');
        const coords = await geocodeCityLabel(city);
        if (!coords) throw new Error(`Could not geocode city: ${city}`);
        resolvedLat = coords.lat;
        resolvedLng = coords.lng;
    }

    const cap = Math.min(Number(limit), 20);

    const listUrl = `${OTM_BASE}/radius?radius=${radius}&lon=${resolvedLng}&lat=${resolvedLat}&kinds=${kinds}&rate=2&limit=${cap}&format=json&apikey=${API_KEY}`;
    const listRes = await fetch(listUrl);

    if (!listRes.ok) {
        const msg = await listRes.text();
        throw new Error(`OpenTripMap list error ${listRes.status}: ${msg}`);
    }

    const places = await listRes.json();

    if (!Array.isArray(places) || places.length === 0) return [];

    // Fetch details in parallel (batch)
    const details = await Promise.allSettled(
        places.map(p => fetchPlaceDetail(p.xid))
    );

    return places.map((place, i) => {
        const detail = details[i].status === 'fulfilled' ? details[i].value : null;

        const name = detail?.name || place.name || '';
        const placeKinds = detail?.kinds || place.kinds || '';
        const category = mapKindsToCategory(placeKinds);
        const placeLat = detail?.point?.lat ?? place.point?.lat;
        const placeLng = detail?.point?.lon ?? place.point?.lon;

        const addressParts = detail?.address
            ? [
                detail.address.road,
                detail.address.city || detail.address.town || detail.address.village,
                detail.address.country,
              ].filter(Boolean)
            : [];
        const locationName = addressParts.length > 0 ? addressParts.join(', ') : name;

        return {
            xid: place.xid,
            title: name,
            category,
            locationName,
            lat: placeLat,
            lng: placeLng,
            description: detail?.wikipedia_extracts?.text?.slice(0, 300) || detail?.info?.descr || '',
            imageUrl: detail?.preview?.source || null,
            rate: place.rate ?? null,
        };
    }).filter(s => s.title && s.lat != null && s.lng != null);
}
