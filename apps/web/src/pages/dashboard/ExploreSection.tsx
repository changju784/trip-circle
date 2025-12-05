import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

// TODO
// replace when hooking up backend routes for Posts
import { getAllTrips, Trip as StoredTrip } from "@/lib/tripStorage";

// replace null imaging for desintaitons
import { fetchSplashImage } from "@/lib/splashClient"


function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fallback in case of invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "";
    }

    const sameYear = start.getFullYear() === end.getFullYear();

    const startStr = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    });
    const endStr = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${startStr} – ${endStr}`;
}

function buildDestinationSummary(trip: StoredTrip): string {
    // `city` is a single string
    const pieces: string[] = [];

    if (trip.city) {
        pieces.push(trip.city);
    }

    // `destinations` is attached as a string[] via `createTrip`
    const asAny = trip as any;
    if (Array.isArray(asAny.destinations) && asAny.destinations.length > 0) {
        // avoid duplicating city if it's the same as first destination
        const dests = asAny.destinations as string[];
        for (const d of dests) {
            if (!pieces.includes(d)) {
                pieces.push(d);
            }
        }
    }

    if (pieces.length === 0) return "Flexible destination";
    return pieces.join(" • ");
}

// Splash helper
// Pick the best text query to send to Splash for a given trip
function buildSplashQuery(trip: StoredTrip): string | null {
    const asAny = trip as any;
    const destinations: string[] = Array.isArray(asAny.destinations)
        ? asAny.destinations
        : [];

    if (trip.city) return trip.city;
    if (destinations.length > 0) return destinations[0];
    if (trip.title) return trip.title;

    return null;
}


export default function ExploreSection() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [trips, setTrips] = useState<StoredTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Splash-generated thumbnails: trip.id -> image URL
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});   

    // Simulate fetching from an API using mock JSON
    useEffect(() => {
        // TODO
        // In the future, this becomes something like:
        // fetch("/api/explore")
        //   .then((res) => res.json())
        //   .then(setTrips)
        
        const all = getAllTrips();
        // Simulate only retrieving public trips by definition of GET Posts
        const publicTrips = all.filter((t) => t.isPublic);
        setTrips(publicTrips);
        setIsLoading(false);
    }, []);

    // Fetch Splash thumbnails for trips that have no explicit thumbnail
    useEffect(() => {
        let cancelled = false;

        async function loadMissingThumbnails() {
            const missing = trips.filter((trip) => {
                const hasOwnThumb = !!trip.thumbnail;
                const hasGeneratedThumb = !!thumbnails[trip.id];
                return !hasOwnThumb && !hasGeneratedThumb;
            });

            if (missing.length === 0) return;

            for (const trip of missing) {
                const q = buildSplashQuery(trip);
                if (!q) continue;

                const url = await fetchSplashImage(q);
                if (cancelled || !url) continue;

                setThumbnails((prev) => {
                    // avoid overwriting if something else wrote it meanwhile
                    if (prev[trip.id]) return prev;
                    return { ...prev, [trip.id]: url };
                });
            }
        }

        if (trips.length > 0) {
            loadMissingThumbnails();
        }

        return () => {
            cancelled = true;
        };
    }, [trips, thumbnails]);

    const filteredTrips = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return trips;

        return trips.filter((trip) => {
            const inTitle = trip.title.toLowerCase().includes(q);
            const inDesc = (trip.description ?? "").toLowerCase().includes(q);
            const inCity = (trip.city ?? "").toLowerCase().includes(q);
            

            const asAny = trip as any;
            const destinations: string[] = Array.isArray(asAny.destinations)
                ? asAny.destinations
                : [];
            const inDestinations = destinations.some((d) => d.toLowerCase().includes(q));

            return inTitle || inDesc || inCity || inDestinations;
        });
    }, [query, trips]);

    

    return (
        <div className="space-y-6">
            {/* Header + search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-semibold text-gray-900">Explore trips</h2>
                    <p className="text-muted-foreground mt-1">
                        Browse public trip ideas and adapt them for your own plans.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                        placeholder="Search by city, destination, or trip title"
                        className="md:w-80"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>
            


            {/* Loading state */}
            {isLoading && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    Loading trips...
                </div>
            )}

            {/* Results */}
            {!isLoading && filteredTrips.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {filteredTrips.map((trip) => {
                        const dateRange = formatDateRange(trip.startDate, trip.endDate);
                        const destinationSummary = buildDestinationSummary(trip);
        

                        const splashThumb = thumbnails[trip.id];
                        const explicitThumb = trip.thumbnail ?? null;
                        const thumbnailUrl = explicitThumb || splashThumb || null;

                        return (
                            <Card
                                key={trip.id}
                                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Thumbnail / header */}
                                {thumbnailUrl ? (
                                    <div className="h-32 w-full bg-gray-100">
                                        <div
                                            className="h-full w-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${thumbnailUrl})` }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
                                )}

                                <div className="p-5 flex flex-col justify-between flex-1">
                                    <div className="space-y-2 text-left">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {trip.title}
                                        </h3>

                                        {dateRange && (
                                            <p className="text-xs font-medium text-sky-700 bg-sky-50 inline-flex px-2 py-1 rounded-full">
                                                {dateRange}
                                            </p>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-1">
                                            {destinationSummary}
                                        </p>

                                        {trip.description && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                                {trip.description}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        className="mt-4 self-start"
                                        onClick={() => {
                                            navigate(`/trip-circle/trip/${trip.id}`);
                                        }}
                                    >
                                        View this trip
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Empty state when search has no matches */}
            {!isLoading && filteredTrips.length === 0 && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    No trips match{" "}
                    <span className="font-medium text-gray-900">“{query}”</span>. Try another search
                    term or clear your search.
                </div>
            )}
            

            
            {/* 
            TODO: get rid of this for end product
            Developer page context 
            */}
            <p className="text-xs text-muted-foreground text-left">
                These trips are currently loaded from a local frontend storage.
            </p>
        </div>
    );
}
