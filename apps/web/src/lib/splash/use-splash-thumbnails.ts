import { useEffect, useState } from "react";
import { Trip } from "@/lib/trips/trips-api";
import { fetchSplashImage } from "@/lib/splashClient";

// Build best text query for Splash API
function buildSplashQuery(trip: Trip): string | null {
    const destinations = trip.destinations || [];

    if (destinations.length > 0 && destinations[0]?.label) {
        return destinations[0].label;
    }
    if (trip.title) return trip.title;

    return null;
}

/**
 * useSplashThumbnails
 * Auto-loads and caches Splash-generated thumbnails for a list of trips.
 */
export function useSplashThumbnails(trips: Trip[]) {
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;

        async function loadMissing() {
            const missing = trips.filter((trip) => {
                const hasOwnThumb = !!trip.thumbnail;
                const hasGeneratedThumb = !!thumbnails[trip._id];
                return !hasOwnThumb && !hasGeneratedThumb;
            });

            if (missing.length === 0) return;

            for (const trip of missing) {
                const query = buildSplashQuery(trip);
                if (!query) continue;

                const url = await fetchSplashImage(query);
                if (cancelled || !url) continue;

                setThumbnails((prev) => {
                    if (prev[trip._id]) return prev; // avoid overwrite
                    return { ...prev, [trip._id]: url };
                });
            }
        }

        if (trips.length > 0) loadMissing();

        return () => {
            cancelled = true;
        };
    }, [trips, thumbnails]);

    return thumbnails;
}
