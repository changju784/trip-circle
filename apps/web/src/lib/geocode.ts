export async function geocodeLocation(query: string) {
    if (!query.trim()) return null;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}`,
        {
            headers: {
                "User-Agent": "TripCircle Demo (your-email@example.com)"
            },
            referrerPolicy: "no-referrer"
        }
    );

    const data = await res.json();
    if (!data[0]) return null;

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
    };
}

export async function geocodeSearch(query: string) {
    if (!query.trim()) return [];

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}`,
        {
            headers: {
                "User-Agent": "TripCircle Demo (your-email@example.com)"
            },
            referrerPolicy: "no-referrer"
        }
    );

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((d: any) => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        displayName: d.display_name
    }));
}
