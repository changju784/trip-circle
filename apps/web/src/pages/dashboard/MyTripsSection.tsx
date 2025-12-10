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
        <div className="space-y-4">
            <div className="text-left text-muted-foreground">
                <h2 className="text-2xl font-semibold ">My trips</h2>
                <p className="mt-1">Build your own private trips.</p>
            </div>
            {isLoading && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    Loading your trips...
                </div>
            )}

            {error && (
                <div className="p-8 text-center text-red-600 bg-white rounded-xl border shadow-sm">
                    Error: {error}
                </div>
            )}

            {!isLoading && trips.length === 0 && (
                <div className="bg-white rounded-xl p-20 text-center shadow-sm border space-y-4">
                    <div className="text-primary/40 text-5xl">📍</div>
                    <h2>No trips yet</h2>
                    <p className="text-muted-foreground">Start planning your next adventure!</p>
                    <Button onClick={() => navigate("/trip-circle/trip/new")}>
                        Create Trip
                    </Button>
                </div>
            )}

            {!isLoading && trips.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {trips.map((trip) => {
                        const thumb = trip.thumbnail || thumbnails[trip._id] || null;

                        return (
                            <TripCard
                                key={trip._id}
                                trip={trip}
                                thumbnailUrl={thumb}
                                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                                footer={
                                    <Button
                                        className="self-start"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/trip-circle/trip/${trip._id}`);
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
        </div>
    );
}