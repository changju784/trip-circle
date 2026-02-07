import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTrips } from "@/lib/trips/use-trips";
import { useToast } from "@/components/hooks/use-toast";
import TripForm, { TripFormValues } from "@/components/trip/TripForm";
import ReconcileStopsModal from "@/components/trip/ReconcileStopsModal";
import { generateNewDaysArray, getMismatchedStops } from "@/lib/trips/util";

export default function EditTripPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getTrip, updateTrip, isLoading: apiLoading } = useTrips();
    const { toast } = useToast();

    const [trip, setTrip] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    const [showReconcile, setShowReconcile] = useState(false);
    const [orphanedStops, setOrphanedStops] = useState<any[]>([]);
    const [pendingFormData, setPendingFormData] = useState<TripFormValues | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        async function loadTrip() {
            try {
                setLoadingData(true);
                setError(null);
                const data = await getTrip(id!);
                if (!cancelled) setTrip(data);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load trip");
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        }
        loadTrip();
        return () => { cancelled = true; };
    }, [id, getTrip]);

    const validDateOptions = useMemo(() => {
        if (!pendingFormData) return [];
        const start = new Date(pendingFormData.startDate);
        const end = new Date(pendingFormData.endDate);

        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);

        const options = [];
        let current = new Date(start);

        while (current <= end) {
            options.push({
                date: current.toISOString(),
                label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return options;
    }, [pendingFormData]);

    const executeUpdate = async (data: TripFormValues, finalDays?: any[]) => {
        try {
            setError(null);
            const thumbnail = (window as any).__trip_thumbnail ?? trip?.thumbnail ?? null;
            const destinations = data.destinations?.map((d) => ({
                id: d.id,
                label: d.label,
            })) ?? [];

            await updateTrip(id!, {
                title: data.title,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                isPublic: !!data.isPublic,
                budget: data.budget || null,
                tags: data.tags,
                thumbnail,
                destinations,
                ...(finalDays && { days: finalDays })
            });
            toast({
                title: "Trip updated",
                description: "Your trip has been successfully updated.",
            });

            navigate(`/trip-circle/trip/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update trip");
            toast({
                title: "Error",
                description: "There was an error updating your trip.",
                variant: "destructive",
            })
        }
    };

    const handleSubmit = async (data: TripFormValues) => {
        if (!id || !trip) return;

        // 1. Detect any stops that are now mismatched with the new dates
        const orphaned = getMismatchedStops(trip.days, data.startDate, data.endDate);

        // 2. If orphans exist, stop and show modal
        if (orphaned.length > 0) {
            setOrphanedStops(orphaned);
            setPendingFormData(data);
            setShowReconcile(true);
            return;
        }

        // 3. Otherwise, just save
        await executeUpdate(data);
    };

    const handleReconcileConfirm = async (decisions: Record<string, string | "delete">) => {
        if (!pendingFormData) return;

        // Create the blank itinerary for the new range (Jan 25 - Jan 27)
        const newSkeleton = generateNewDaysArray(pendingFormData.startDate, pendingFormData.endDate);

        // Map decisions into the new skeleton
        Object.entries(decisions).forEach(([stopId, action]) => {
            if (action === "delete") return;

            const stop = orphanedStops.find(s => s.id === stopId);
            const targetDay = newSkeleton.find(d => d.date === action);

            if (targetDay && stop) {
                const { originalDate, ...cleanStop } = stop;
                targetDay.stops.push(cleanStop);
            }
        });

        setShowReconcile(false);
        await executeUpdate(pendingFormData, newSkeleton);
    };

    if (loadingData) {
        return (
            <div className="min-h-screen">
                <main className="max-w-screen-md mx-auto p-6">
                    <div className="text-center text-muted-foreground">Loading trip...</div>
                </main>
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="min-h-screen">
                <main className="max-w-screen-md mx-auto p-6">
                    <div className="text-center text-destructive">
                        Error: {error || "Trip not found"} — <span onClick={() => navigate(-1)} className="underline cursor-pointer">Back</span>
                    </div>
                </main>
            </div>
        );
    }

    const initialValues: Partial<TripFormValues> = {
        title: trip.title,
        description: trip.description || "",
        startDate: trip.startDate.split("T")[0],
        endDate: trip.endDate.split("T")[0],
        budget: trip.budget || 0,
        tags: trip.tags || [],
        isPublic: trip.isPublic ?? false,
        destinations: trip.destinations?.map((d: any) => ({ id: d.id, label: d.label })) ?? [],
        thumbnail: trip.thumbnail
    };

    return (
        <div className="min-h-screen">
            <main className="max-w-screen-md mx-auto p-6">
                <TripForm
                    title="Edit Trip"
                    subtitle="Update your trip details"
                    submitLabel="Save"
                    defaultValues={initialValues}
                    isLoading={apiLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(-1)}
                />
            </main>

            {showReconcile && (
                <ReconcileStopsModal
                    isOpen={showReconcile}
                    orphanedStops={orphanedStops}
                    validDates={validDateOptions}
                    onConfirm={handleReconcileConfirm}
                    onCancel={() => setShowReconcile(false)}
                />
            )}
        </div>
    );
}