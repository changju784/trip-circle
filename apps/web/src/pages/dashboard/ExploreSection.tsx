import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useTrips } from "@/lib/trips/use-trips";
import { Trip } from "@/lib/trips/trips-api";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";

function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

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

function buildDestinationSummary(trip: Trip): string {
    const pieces: string[] = [];

    if (Array.isArray(trip.destinations) && trip.destinations.length > 0) {
        trip.destinations.forEach((dest) => {
            if (dest.label) {
                pieces.push(dest.label);
            }
        });
    }

    if (pieces.length === 0) return "Flexible destination";
    return pieces.join(" • ");
}

export default function ExploreSection() {
    const navigate = useNavigate();
    const { exploreTrips } = useTrips();

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    // debounced search (300ms delay after user stops typing)
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setDebouncedQuery(value);
        }, 300),
        []
    );

    // update query and trigger debounced search
    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    // fetch trips from backend when debounced query changes
    useEffect(() => {
        let cancelled = false;

        async function loadTrips() {
            try {
                setIsLoading(true);
                setError(null);
                const result = await exploreTrips(debouncedQuery || undefined);
                if (!cancelled) {
                    setTrips(result);
                }
            } catch (err) {
                if (!cancelled) {
                    const msg =
                        err instanceof Error ? err.message : "Failed to load trips";
                    setError(msg);
                    setTrips([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadTrips();
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, exploreTrips]);

    // Thumbnail generation via reusable hook
    const thumbnails = useSplashThumbnails(trips);

    const filteredTrips = useMemo(() => trips, [trips]);

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
                        onChange={handleQueryChange}
                    />
                </div>
            </div>

            {/* Loading */}
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

                        const explicitThumb = trip.thumbnail ?? null;
                        const generatedThumb = thumbnails[trip._id] ?? null;
                        const thumbnailUrl = explicitThumb || generatedThumb || null;

                        return (
                            <Card
                                key={trip._id}
                                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                            >
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
                                            navigate(`/trip-circle/trip/${trip._id}`);
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

            {/* Empty state */}
            {!isLoading && filteredTrips.length === 0 && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    No trips match{" "}
                    <span className="font-medium text-gray-900">“{query}”</span>. Try another search term.
                </div>
            )}
        </div>
    );
}
