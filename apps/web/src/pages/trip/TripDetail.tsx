import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import AddStopModal from "@/components/trip/AddStopModal";
import ShareTripModal from "@/components/ui/ShareTripModal";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { useTrips } from "@/lib/trips/use-trips";
import { useAuth } from "@/auth/hook/use-auth";
import { useGetUsernameById } from "@/lib/auth/use-get-username-by-id";

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTrip, updateTrip, deleteTrip, shareTrip, isLoading } = useTrips();
    const { user } = useAuth();

    const [trip, setTrip] = useState<any | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);

    const ownerId = trip?.members?.[0];
    const { name: ownerName } = useGetUsernameById(ownerId);

    const [openDeleteModal, setOpenDeleteModal] = useState(false);

    // ---------------- LOAD TRIP ----------------
    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function load() {
            try {
                setError(null);
                const data = await getTrip(id);
                if (!cancelled) setTrip(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load trip");
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id, getTrip]);

    // ---------------- OWNER CHECK ----------------
    const isOwner = Boolean(
        user &&
        trip?.members &&
        Array.isArray(trip.members) &&
        trip.members.some((m: any) => String(m) === String(user.id))
    );

    const initialStop = useMemo(() => {
        if (!editingStop || !trip) return null;
        for (const d of trip.days || []) {
            const s = (d.stops || []).find((x: any) => x.id === editingStop);
            if (s) return s;
        }
        return null;
    }, [editingStop, trip]);

    const refresh = async () => {
        if (!id) return;
        const updated = await getTrip(id);
        setTrip(updated);
    };

    // ---------------- ADD / EDIT STOP ----------------
    const handleAddStop = async (data: any, stopId?: string | null) => {
        if (!id || !trip) return;

        const days = JSON.parse(JSON.stringify(trip.days || []));

        if (stopId) {
            // Editing
            for (const d of days) {
                const idx = (d.stops || []).findIndex((s: any) => s.id === stopId);
                if (idx >= 0) {
                    d.stops[idx] = { ...d.stops[idx], ...data, lat: data.lat ?? null, lng: data.lng ?? null };
                    break;
                }
            }
        } else {
            // Adding
            if (!days[selectedDay]) {
                days[selectedDay] = { date: new Date().toISOString(), stops: [] };
            }

            days[selectedDay].stops.push({
                id: Math.random().toString(36).slice(2, 9),
                ...data,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
            });
        }

        await updateTrip(id, { days });
        await refresh();
        setEditingStop(null);
        setOpenAdd(false);
    };

    // ---------------- DELETE STOP ----------------
    const handleDeleteStop = async (stopId: string) => {
        if (!id || !trip) return;
        const days = trip.days.map((d: any) => ({
            ...d,
            stops: d.stops.filter((s: any) => s.id !== stopId),
        }));
        await updateTrip(id, { days });
        refresh();
    };

    // ---------------- DELETE TRIP ----------------
    const confirmDeleteTrip = async () => {
        await deleteTrip(trip._id);
        navigate("/trip-circle/dashboard");
    };

    // ---------------- RENDER ----------------
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#eaf6ff]">
                <Navbar />
                <main className="max-w-screen-lg mx-auto p-6 text-center">Loading trip...</main>
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="min-h-screen bg-[#eaf6ff]">
                <Navbar />
                <main className="max-w-screen-lg mx-auto p-6 text-center text-red-600">
                    {error ? `Error: ${error}` : "Trip not found"} —{" "}
                    <Link to="/trip-circle/dashboard">Back</Link>
                </main>
            </div>
        );
    }

    const destinationLabels = trip.destinations?.map((d: any) => d.label).slice(0, 3).join(", ") || "Unknown";
    const hasMoreDestinations =
        trip.destinations && trip.destinations.length > 3
            ? `(+${trip.destinations.length - 3} more)`
            : "";

    return (
        <div className="min-h-screen bg-[#eaf6ff]">
            <Navbar />

            <main className="max-w-screen-lg mx-auto p-6">
                <BackToDashboardButton />

                {/* ---------------- HEADER ---------------- */}
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
                            <p className="text-sm text-muted-foreground mt-2">{trip.description}</p>
                        )}

                        <p className="text-sm text-gray-600 mt-1">
                            Owned by <span className="font-medium">{ownerName}</span>
                        </p>
                    </div>

                    {isOwner && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShareOpen(true)}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                            >
                                Share
                            </button>

                            <Link
                                to={`/trip-circle/trip/${trip._id}/edit`}
                                className="px-3 py-2 bg-white border rounded hover:bg-gray-50"
                            >
                                Edit Trip
                            </Link>

                            <button
                                onClick={() => setOpenDeleteModal(true)}
                                className="px-3 py-2 border border-red-500 text-red-500 bg-white rounded hover:bg-red-50"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </header>

                {/* ---------------- TABS / DAYS ---------------- */}
                <Tabs
                    value={`day-${selectedDay}`}
                    onValueChange={(v) => setSelectedDay(Number(v.replace("day-", "")))}
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
                                onDeleteStop={handleDeleteStop}
                            />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* ---------------- ADD / EDIT STOP MODAL ---------------- */}
                <AddStopModal
                    open={openAdd}
                    onClose={() => {
                        setOpenAdd(false);
                        setEditingStop(null);
                    }}
                    onSubmit={handleAddStop}
                    initialStop={initialStop}
                />

                {/* ---------------- DELETE TRIP MODAL ---------------- */}
                {openDeleteModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-[320px]">
                            <h2 className="text-lg font-semibold mb-3">Delete Trip?</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                This action cannot be undone. Are you sure you want to delete this trip?
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                    onClick={() => setOpenDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                                    onClick={confirmDeleteTrip}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- SHARE TRIP MODAL ---------------- */}
                <ShareTripModal
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    onShare={async (email: string) => {
                        await shareTrip(trip._id, email);
                        setShareOpen(false);
                        refresh();
                    }}
                />
            </main>
        </div>
    );
}
