import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import AddStopModal from "@/components/trip/AddStopModal";
import ShareTripModal from "@/components/trip/ShareTripModal";
import Receipts from "@/components/trip/Receipts";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { useTrips } from "@/lib/trips/use-trips";
import { useTripsContext } from "@/contexts/TripsContext";
import { useAuth } from "@/auth/hook/use-auth";
import { getUser } from "@/lib/users/users-api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTrip, updateTrip, shareTrip, isLoading } = useTrips();
    const { deleteTrip, forkTrip } = useTripsContext();
    const { user } = useAuth();

    const [trip, setTrip] = useState<any | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [ownerName, setOwnerName] = useState<string | null>(null);
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
        return () => { cancelled = true; };
    }, [id, getTrip, refreshKey]);

    // ---------------- LOAD OWNER ----------------
    useEffect(() => {
        if (!trip || !trip.members || !trip.members.length) {
            setOwnerName(null);
            return;
        }
        const ownerId = trip?.members?.[0];
        let cancelled = false;
        (async () => {
            try {
                const user = await getUser(ownerId);
                if (!cancelled) setOwnerName(user.username);
            } catch (err) {
                if (!cancelled) setOwnerName(null);
            }
        })();
        return () => { cancelled = true; };
    }, [trip]);

    // ---------------- HELPER VARS ----------------
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

    const refresh = () => {
        // Increment refreshKey to trigger useEffect reload
        setRefreshKey(prev => prev + 1);
    };

    const handleReceiptsChange = (updatedTrip: any) => {
        // Directly update trip state with the updated trip from backend
        setTrip(updatedTrip);
    };

    // ---------------- HANDLERS ----------------
    const handleAddStop = async (data: any, stopId?: string | null) => {
        if (!id || !trip) return;
        const days = JSON.parse(JSON.stringify(trip.days || []));

        if (stopId) {
            for (const d of days) {
                const idx = (d.stops || []).findIndex((s: any) => s.id === stopId);
                if (idx >= 0) {
                    d.stops[idx] = { ...d.stops[idx], ...data, lat: data.lat ?? null, lng: data.lng ?? null };
                    break;
                }
            }
        } else {
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
        refresh();
        setEditingStop(null);
        setOpenAdd(false);
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!id || !trip) return;
        const days = trip.days.map((d: any) => ({
            ...d,
            stops: d.stops.filter((s: any) => s.id !== stopId),
        }));
        await updateTrip(id, { days });
        refresh();
    };

    const handleReorderStops = async (dayIndex: number, reorderedStops: any[]) => {
        if (!id || !trip) return;
        
        // Update local state immediately
        const updatedTrip = { ...trip };
        updatedTrip.days = [...trip.days];
        updatedTrip.days[dayIndex] = {
            ...updatedTrip.days[dayIndex],
            stops: reorderedStops
        };
        setTrip(updatedTrip);
        
        // Save to backend and update cache
        updateTrip(id, { days: updatedTrip.days }).catch(err => {
            console.error('Failed to save reorder:', err);
        });
    };

    const confirmDeleteTrip = async () => {
        await deleteTrip(trip._id);
        navigate("/trip-circle/dashboard");
    };

    // ---------------- LOADING / ERROR STATE ----------------
    if (isLoading && !trip) {
        return <div className="min-h-screen p-10 text-center text-muted-foreground">Loading trip...</div>;
    }
    if (error || !trip) {
        return (
            <div className="min-h-screen p-10 text-center text-red-600">
                {error ? `Error: ${error}` : "Trip not found"} — <Link to="/trip-circle/dashboard" className="underline">Back</Link>
            </div>
        );
    }

    const destinationLabels = trip.destinations?.map((d: any) => d.label).slice(0, 3).join(", ") || "Unknown";
    const hasMoreDestinations = trip.destinations && trip.destinations.length > 3;

    return (
        <div className="min-h-screen pb-20">

            {/* 🟢 TOP SECTION: BACK BUTTON (Aligned with Navbar) */}
            <div className="max-w-screen-xl mx-auto px-6 pt-6">
                <BackToDashboardButton />
            </div>

            {/* 🟢 MAIN CONTENT */}
            <main className="max-w-screen-xl mx-auto px-6 mt-4">

                {/* HEADER */}
                <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{trip.title}</h1>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                            {/* Destinations */}
                            <div className="flex flex-col gap-1">
                                {trip.destinations?.slice(0, 3).map((d: any) => (
                                    <div key={d.id} className="flex items-center gap-1">
                                        <span>📍</span>
                                        <span className="text-slate-700">{d.label}</span>
                                    </div>
                                ))}
                                {hasMoreDestinations && (
                                    <span className="text-xs text-muted-foreground pl-5">+ {trip.destinations.length - 3} more</span>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="hidden md:block w-px h-8 bg-slate-300 mx-2"></div>

                            {/* Date */}
                            <div className="flex items-center gap-2">
                                📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                            </div>

                            {/* Badge */}
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${trip.isPublic
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                <span>{trip.isPublic ? "🌍" : "🔒"}</span>
                                {trip.isPublic ? "Public" : "Private"}
                            </div>
                        </div>

                        {trip.description && (
                            <p className="text-sm text-slate-600 mt-3 max-w-2xl leading-relaxed">
                                {trip.description}
                            </p>
                        )}

                        <p className="text-sm text-muted-foreground mt-2">
                            Owned by <span className="font-medium text-slate-900">{ownerName || "Unknown"}</span>
                        </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2">
                        {isOwner ? (
                            <>
                                <Button variant="secondary" onClick={() => setShareOpen(true)}>
                                    Share
                                </Button>
                                <Link to={`/trip-circle/trip/${trip._id}/edit`}>
                                    <Button variant="outline">Edit Trip</Button>
                                </Link>
                                <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>
                                    Delete
                                </Button>
                            </>
                        ) : (
                            trip.isPublic && user && (
                                <Button
                                    variant="dark"
                                    onClick={async () => {
                                        try {
                                            const newTrip = await forkTrip(trip._id, user.id);
                                            navigate(`/trip-circle/trip/${newTrip._id}`);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to copy trip.");
                                        }
                                    }}
                                >
                                    Copy Trip
                                </Button>
                            )
                        )}
                    </div>
                </header>

                {/* TABS & STOPS */}
                <Tabs
                    value={`day-${selectedDay}`}
                    onValueChange={(v) => setSelectedDay(Number(v.replace("day-", "")))}
                    className="mb-4"
                >
                    <DayTabs days={trip.days} />

                    {trip.days.map((d: any, i: number) => (
                        <TabsContent key={d.date || i} value={`day-${i}`}>
                            <DayStopsPanel
                                days={trip.days}
                                selectedDay={i}
                                onOpenAdd={(dayIndex) => {
                                    setSelectedDay(dayIndex);
                                    setEditingStop(null);
                                    setOpenAdd(true);
                                }}
                                onEditStop={(sId: string) => {
                                    setSelectedDay(i);
                                    setEditingStop(sId);
                                    setOpenAdd(true);
                                }}
                                onDeleteStop={handleDeleteStop}
                                onReorderStops={handleReorderStops}
                            />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* RECEIPTS SECTION */}
                {isOwner && (
                    <Receipts
                        tripId={trip._id}
                        receipts={trip.receipts || []}
                        onReceiptsChange={handleReceiptsChange}
                    />
                )}

                {/* MODALS */}
                <AddStopModal
                    open={openAdd}
                    onClose={() => {
                        setOpenAdd(false);
                        setEditingStop(null);
                    }}
                    onSubmit={handleAddStop}
                    initialStop={initialStop}
                />

                <ShareTripModal
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    onShare={async (email: string) => {
                        await shareTrip(trip._id, email);
                        setShareOpen(false);
                        refresh();
                    }}
                />

                <Modal
                    title="Delete Trip?"
                    isOpen={openDeleteModal}
                    onClose={() => setOpenDeleteModal(false)}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            This action cannot be undone. Are you sure you want to delete this trip?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDeleteTrip}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>

            </main>
        </div>
    );
}