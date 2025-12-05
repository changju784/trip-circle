import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import DashboardTabs from "./DashboardTabs";
import { useNavigate } from "react-router-dom";
import ExploreSection from "./ExploreSection";
import { useAuth } from "@/auth/hook/use-auth";
import { useUsers } from "@/lib/users/use-users";
import { Trip } from "@/lib/trips/trips-api";


function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

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


export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getUserTrips } = useUsers();
    const [userTrips, setUserTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load user trips when user is available
    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;

        async function loadTrips() {
            try {
                setIsLoading(true);
                setError(null);
                const trips = await getUserTrips(user.id);
                if (!cancelled) {
                    setUserTrips(trips);
                }
            } catch (err) {
                if (!cancelled) {
                    const errorMsg = err instanceof Error ? err.message : "Failed to load trips";
                    setError(errorMsg);
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
    }, [user, getUserTrips]);

    const MyTripsSection = (
        <div className="space-y-4">
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

            {!isLoading && userTrips.length === 0 && (
                <div className="bg-white rounded-xl p-20 text-center shadow-sm border space-y-4">
                    <div className="text-primary/40 text-5xl">📍</div>
                    <h2>No trips yet</h2>
                    <p className="text-muted-foreground">Start planning your next adventure!</p>

                    <div className="flex justify-center gap-3">
                        <Button variant="primary" onClick={() => navigate("/trip-circle/trip/new")}>
                            Create Trip
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && userTrips.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {userTrips.map((trip) => (
                        <Card key={trip._id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                        >
                            <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

                            <div className="p-5 flex flex-col justify-between flex-1">
                                <div className="space-y-2 text-left">
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {trip.title}
                                    </h3>

                                    {formatDateRange(trip.startDate, trip.endDate) && (
                                        <p className="text-xs font-medium text-sky-700 bg-sky-50 inline-flex px-2 py-1 rounded-full">
                                            {formatDateRange(trip.startDate, trip.endDate)}
                                        </p>
                                    )}

                                    {trip.description && (
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                            {trip.description}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    className="mt-4 self-start"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/trip-circle/trip/${trip._id}`);
                                    }}
                                >
                                    View trip
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />

            <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">

                <div className="flex items-center justify-between">
                    <DashboardTabs
                        mytrips={MyTripsSection}
                        explore={<ExploreSection />}
                        onNewTrip={() => navigate("/trip-circle/trip/new")}
                    />
                </div>

            </div>
        </div>
    );
}
