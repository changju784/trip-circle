import { useEffect, useState } from "react";
import { Destination, PlaceSuggestion, getSuggestions } from "./trips-api";
import { fetchSplashImage } from "@/lib/splashClient";

export function useSuggestions(destinations: Destination[]) {
    const [allSuggestions, setAllSuggestions] = useState<PlaceSuggestion[]>([]);
    const [images, setImages] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const dest = destinations[0];

    useEffect(() => {
        if (!dest?.label) return;

        let cancelled = false;
        setLoading(true);
        setAllSuggestions([]);
        setImages({});

        async function load() {
            try {
                const raw = await getSuggestions(
                    dest.lat ?? null,
                    dest.lng ?? null,
                    { limit: 20, city: dest.label }
                );
                if (cancelled) return;
                setAllSuggestions(raw);

                // OTM returns Wikipedia URLs which Wikimedia blocks cross-origin — use Unsplash instead
                for (const s of raw.slice(0, 5)) {
                    if (cancelled) return;
                    const url = await fetchSplashImage(s.title);
                    if (url && !cancelled) {
                        setImages(prev => ({ ...prev, [s.xid]: url }));
                    }
                }
            } catch {
                // Fail silently — suggestions are optional
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dest?.lat, dest?.lng, dest?.label]);

    return { allSuggestions, images, loading };
}
