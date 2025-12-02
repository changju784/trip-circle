export type CityOption = { id: string; label: string };

// Use GeoDB Cities API (CORS-friendly)
export async function searchCities(q: string): Promise<CityOption[]> {
    if (!q || q.trim().length === 0) return [];

    try {
        const res = await fetch(
            `https://geodb-free-service.wirefreethought.com/v1/geo/cities?limit=10&namePrefix=${encodeURIComponent(q)}`
        );

        const data = await res.json();
        if (!data.data) return [];

        return data.data.map((city: any) => ({
            id: city.id, // stable city ID
            label: `${city.city}, ${city.region ? city.region + ", " : ""}${city.country}`
        }));
    } catch (err) {
        console.error("City search error:", err);
        return [];
    }
}
