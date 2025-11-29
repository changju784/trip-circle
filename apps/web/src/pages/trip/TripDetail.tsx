import React, { useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useParams, Link } from "react-router-dom";
import { getTripById, Trip, addStopToTrip } from "../../lib/tripStorage";

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

    const stopsForSelected = useMemo(() => {
        return trip?.days?.[selectedDay]?.stops ?? [];
    }, [trip, selectedDay]);

    const refresh = () => {
        if (!id) return;
        const updated = getTripById(id);
        setTrip(updated);
    };

    const handleAddStop = (
        title: string,
        time: string | undefined,
        locationName: string | undefined,
        lat: number | null,
        lng: number | null,
        description: string | undefined
    ) => {
        if (!id) return;

        addStopToTrip(id, selectedDay, {
            title,
            time,
            locationName,
            lat,
            lng,
            description,
        });

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

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-lg mx-auto p-6">
                <BackToDashboardButton />

                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold">{trip.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-2">📍 {trip.city}</div>
                        <div>•</div>
                        <div>
                            {trip.startDate} - {trip.endDate}
                        </div>
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
                                        onOpenAdd={() => setOpenAdd(true)}
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
                    onClose={() => setOpenAdd(false)}
                    onSubmit={handleAddStop}
                />
            </main>
        </div>
    );
}
