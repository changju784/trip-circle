import React, { useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useParams, Link } from "react-router-dom";
import { getTripById, Trip, addStopToTrip, updateStop, deleteStop } from "../../lib/tripStorage";
import { useAuth } from "../../auth/hook/use-auth";

import { BackToDashboardButton } from "../dashboard/BackToDashboardButton";
import DayTabs from "../../components/trip/DayTabs";
import DayStopsPanel from "../../components/trip/DayStopsPanel";
import RoutePreview from "../../components/trip/RoutePreview";
import AddStopModal from "../../components/trip/AddStopModal";
import { Tabs, TabsContent } from "../../components/ui/Tabs";

export default function TripDetailPage() {
    const { id } = useParams();

    // All hooks must be called before ANY conditional return
    const [trip, setTrip] = useState<Trip | null>(() =>
        id ? getTripById(id) : null
    );

    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);

    const stopsForSelected = useMemo(() => {
        return trip?.days?.[selectedDay]?.stops ?? [];
    }, [trip, selectedDay]);

    const refresh = () => {
        if (!id) return;
        const updated = getTripById(id);
        setTrip(updated);
    };

    const auth = useAuth();

    const handleAddStop = (
        data: { title: string; time?: string; locationName?: string; lat?: number | null; lng?: number | null; description?: string },
        stopId?: string | null
    ) => {
        if (!id) return;

        if (stopId) {
            // update existing stop
            const dayIndex = trip?.days.findIndex((d) => d.stops.some((s) => s.id === stopId));
            if (dayIndex != null && dayIndex >= 0) {
                updateStop(id, dayIndex, stopId, {
                    title: data.title,
                    time: data.time,
                    locationName: data.locationName,
                    lat: data.lat ?? null,
                    lng: data.lng ?? null,
                    description: data.description,
                });
            }
        } else {
            addStopToTrip(id, selectedDay, {
                title: data.title,
                time: data.time,
                locationName: data.locationName,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
                description: data.description,
            });
        }

        refresh();
        setEditingStop(null);
        setOpenAdd(false);
    };

    const handleDeleteStop = (stopId: string) => {
        if (!id) return;
        deleteStop(id, stopId);
        refresh();
    };

    if (!trip) {
        return (
            <div>
                <Navbar />
                <main className="max-w-screen-lg mx-auto p-6">
                    Trip not found —{" "}
                    <Link to="/trip-circle/dashboard">Back</Link>
                </main>
            </div>
        );
    }
    // find initial stop when editing
    let initialStop = null;
    if (editingStop && trip) {
        for (const d of trip.days) {
            const s = d.stops.find((x) => x.id === editingStop);
            if (s) {
                initialStop = s;
                break;
            }
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-lg mx-auto p-6">
                <BackToDashboardButton />

                {/* Header */}
                <header className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{trip.title}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-2">📍 {trip.city}</div>
                            <div>•</div>
                            <div>{trip.startDate} - {trip.endDate}</div>
                            <div className={`ml-4 px-2 rounded text-sm font-medium`} style={{ background: trip.isPublic ? '#e6ffef' : '#fff3e6' }}>{trip.isPublic ? 'Public' : 'Private'}</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Owned by: {trip.ownerId ? (auth.user?.uid === trip.ownerId ? 'You' : trip.ownerId) : 'Unknown'}</div>
                    </div>
                    <div>
                        <Link to={`/trip-circle/trip/${trip.id}/edit`} className="px-3 py-2 bg-white border rounded">Edit Trip</Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT PANEL */}
                    <div className="col-span-8">

                        <Tabs
                            value={`day-${selectedDay}`}
                            onValueChange={(val) => {
                                const index = Number(val.replace("day-", ""));
                                setSelectedDay(index);
                            }}
                            className="mb-4"
                        >
                            {/* Tab Buttons */}
                            <DayTabs days={trip.days} />

                            {/* Tab Content */}
                            {trip.days.map((d, i) => (
                                <TabsContent key={d.date} value={`day-${i}`}>
                                    <DayStopsPanel
                                        days={trip.days}
                                        selectedDay={i}
                                        onOpenAdd={() => { setEditingStop(null); setOpenAdd(true); }}
                                        onEditStop={(sId: string) => { setEditingStop(sId); setOpenAdd(true); }}
                                        onDeleteStop={(sId: string) => handleDeleteStop(sId)}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>

                    </div>

                    {/* RIGHT PANEL */}
                    <div className="col-span-4">
                        <RoutePreview
                            city={trip.city}
                            stops={stopsForSelected}
                        />
                    </div>
                </div>

                {/* ADD STOP MODAL */}
                <AddStopModal
                    open={openAdd}
                    onClose={() => { setOpenAdd(false); setEditingStop(null); }}
                    onSubmit={handleAddStop}
                    initialStop={initialStop}
                />
            </main>
        </div>
    );
}
