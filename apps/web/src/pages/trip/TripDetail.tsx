import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import AddStopModal from "@/components/trip/AddStopModal";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { useTrips } from "@/lib/trips/use-trips";
import { useAuth } from "@/auth/hook/use-auth";

export default function TripDetailPage() {
    const { id } = useParams();
    const { getTrip, updateTrip, isLoading } = useTrips();
    const { user } = useAuth();

    const [trip, setTrip] = useState<any | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load trip
    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function load() {
            try {
                setError(null);
                const data = await getTrip(id);
                if (!cancelled) setTrip(data);
            } catch (err) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Failed to load trip");
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id, getTrip]);

    // Permission check
    const canEdit = Boolean(
        user &&
        trip?.members &&
        Array.isArray(trip.members) &&
        trip.members.some((m: any) => String(m) === String(user.id))
    );

    // Find stop for editing
    const initialStop = useMemo(() => {
        if (!editingStop || !trip) return null;
        for (const d of trip.days || []) {
            const s = (d.stops || []).find((x: any) => x.id === editingStop);
            if (s) return s;
        }
        return null;
    }, [editingStop, trip]);

    // Refresh trip data
    const refresh = async () => {
        if (!id) return;
        try {
            const updated = await getTrip(id);
            setTrip(updated);
        } catch {
            /* ignore */
        }
    };

    // Add or Edit stop
    const handleAddStop = async (
        data: {
            title: string;
            time?: string;
            locationName?: string;
            lat?: number | null;
            lng?: number | null;
            description?: string;
        },
        stopId?: string | null
    ) => {
        if (!id || !trip) return;

        const days = JSON.parse(JSON.stringify(trip.days || []));

        if (stopId) {
            // UPDATE existing stop
            for (const d of days) {
                const idx = (d.stops || []).findIndex((s: any) => s.id === stopId);
                if (idx >= 0) {
                    d.stops[idx] = {
                        ...d.stops[idx],
                        title: data.title,
                        time: data.time,
                        locationName: data.locationName,
                        lat: data.lat ?? null,
                        lng: data.lng ?? null,
                        description: data.description,
                    };
                    break;
                }
            }
        } else {
            // ADD new stop
            if (!days[selectedDay]) {
                days[selectedDay] = { date: new Date().toISOString(), stops: [] };
            }

            const newStop = {
                id: Math.random().toString(36).slice(2, 9),
                title: data.title,
                time: data.time,
                locationName: data.locationName,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
                description: data.description,
            };

            days[selectedDay].stops = days[selectedDay].stops || [];
            days[selectedDay].stops.push(newStop);
        }

        try {
            await updateTrip(id, { days });
            await refresh();
            setEditingStop(null);
            setOpenAdd(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save stop");
        }
    };

    // Delete stop
    const handleDeleteStop = async (stopId: string) => {
        if (!id || !trip) return;

        const days = JSON.parse(JSON.stringify(trip.days || []));
        for (const d of days) {
            d.stops = (d.stops || []).filter((s: any) => s.id !== stopId);
        }

        try {
            await updateTrip(id, { days });
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete stop");
        }
    };

    // LOADING STATE
    if (isLoading) {
        return (
            <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
                <Navbar />
                <main className="max-w-screen-lg mx-auto p-6 text-center">
                    Loading trip...
                </main>
            </div>
        );
    }

    // ERROR OR NO TRIP
    if (error || !trip) {
        return (
            <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
                <Navbar />
                <main className="max-w-screen-lg mx-auto p-6 text-center text-red-600">
                    {error ? `Error: ${error}` : "Trip not found"} —{" "}
                    <Link to="/trip-circle/dashboard">Back</Link>
                </main>
            </div>
        );
    }

    // Destinations
    const destinationLabels =
        trip.destinations?.map((d: any) => d.label).slice(0, 3).join(", ") || "Unknown";
    const hasMoreDestinations =
        trip.destinations && trip.destinations.length > 3
            ? `(+${trip.destinations.length - 3} more)`
            : "";

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />

            <main className="max-w-screen-lg mx-auto p-6">
                <BackToDashboardButton />

                {/* HEADER */}
                <header className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{trip.title}</h1>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-2">
                                📍 {destinationLabels} {hasMoreDestinations}
                            </div>
                            <div>•</div>

                            <div>
                                {new Date(trip.startDate).toLocaleDateString()} —{" "}
                                {new Date(trip.endDate).toLocaleDateString()}
                            </div>

                            <div
                                className="ml-4 px-2 rounded text-sm font-medium flex items-center gap-1"
                                style={{ background: trip.isPublic ? "#e6ffef" : "#fff3e6" }}
                            >
                                <span>{trip.isPublic ? "🌍" : "🔒"}</span>
                                {trip.isPublic ? "Public" : "Private"}
                            </div>
                        </div>

                        {trip.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                                {trip.description}
                            </p>
                        )}
                    </div>

                    {canEdit && (
                        <Link
                            to={`/trip-circle/trip/${trip._id}/edit`}
                            className="px-3 py-2 bg-white border rounded"
                        >
                            Edit Trip
                        </Link>
                    )}
                </header>

                {/* DAYS + STOPS */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                        <Tabs
                            value={`day-${selectedDay}`}
                            onValueChange={(v) => {
                                const index = Number(v.replace("day-", ""));
                                setSelectedDay(index);
                            }}
                            className="mb-4"
                        >
                            <DayTabs days={trip.days} />

                            {trip.days.map((d: any, i: number) => (
                                <TabsContent key={d.date} value={`day-${i}`}>
                                    <DayStopsPanel
                                        days={trip.days}
                                        selectedDay={i}
                                        onOpenAdd={() => {
                                            setEditingStop(null);
                                            setOpenAdd(true);
                                        }}
                                        onEditStop={(sId: string) => {
                                            setEditingStop(sId);
                                            setOpenAdd(true);
                                        }}
                                        onDeleteStop={(sId: string) =>
                                            handleDeleteStop(sId)
                                        }
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>

                {/* ADD / EDIT STOP MODAL */}
                <AddStopModal
                    open={openAdd}
                    onClose={() => {
                        setOpenAdd(false);
                        setEditingStop(null);
                    }}
                    onSubmit={handleAddStop}
                    initialStop={initialStop}
                />
            </main>
        </div>
    );
}
