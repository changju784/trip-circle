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

// Fetches place details for a single xid
async function fetchPlaceDetail(xid) {
    const url = `${OTM_BASE}/xid/${xid}?apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

/**
 * Returns POI suggestions near a coordinate.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - meters (default 5000)
 * @param {number} limit  - max results (capped at 20)
 * @param {string} kinds  - comma-separated OpenTripMap kinds (optional)
 */
export async function getSuggestions({ lat, lng, radius = 5000, limit = 10, kinds = 'interesting_places' }) {
    if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY is not set');

    const cap = Math.min(Number(limit), 20);

    const listUrl = `${OTM_BASE}/radius?radius=${radius}&lon=${lng}&lat=${lat}&kinds=${kinds}&rate=2&limit=${cap}&format=json&apikey=${API_KEY}`;
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
        const kinds = detail?.kinds || place.kinds || '';
        const category = mapKindsToCategory(kinds);
        const lat = detail?.point?.lat ?? place.point?.lat;
        const lng = detail?.point?.lon ?? place.point?.lon;

        // Build location string from address if available
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
            lat,
            lng,
            description: detail?.wikipedia_extracts?.text?.slice(0, 300) || detail?.info?.descr || '',
            imageUrl: detail?.preview?.source || null,
            rate: place.rate ?? null,
        };
    }).filter(s => s.title && s.lat != null && s.lng != null);
}
