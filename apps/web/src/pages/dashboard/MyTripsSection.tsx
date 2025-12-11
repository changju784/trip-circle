import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { useTripsContext } from "@/contexts/TripsContext";
import { TripCard } from "@/components/trip/TripCard";

export default function MyTripsSection() {
    const navigate = useNavigate();
    const { userTrips: trips, isLoading, error } = useTripsContext();
    const thumbnails = useSplashThumbnails(trips);

    return (
        <section className="space-y-5">
            {/* Header */}
            <div className="text-left">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    My trips
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Build your own private trips.
                </p>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400">
                    Loading your trips...
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="p-8 text-center rounded-xl border bg-red-50 dark:bg-gray-800 border-red-200 dark:border-red-500 shadow-sm text-red-700 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && trips.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-20 text-center shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="text-primary/40 text-5xl">📍</div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        No trips yet
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start planning your next adventure!
                    </p>
                    <Button onClick={() => navigate("/trip-circle/trip/new")}>
                        Create Trip
                    </Button>
                </div>
            )}

            {/* Trips grid */}
            {!isLoading && !error && trips.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {trips.map((trip) => {
                        const thumb = trip.thumbnail || thumbnails[trip._id] || null;

                        return (
                            <TripCard
                                key={trip._id}
                                trip={trip}
                                thumbnailUrl={thumb}
                                onClick={() =>
                                    navigate(`/trip-circle/trip/${trip._id}`)
                                }
                                footer={
                                    <Button
                                        className="self-start"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/trip-circle/trip/${trip._id}`
                                            );
                                        }}
                                    >
                                        View trip
                                    </Button>
                                }
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
