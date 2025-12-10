import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTrips } from "@/lib/trips/use-trips";
import TripForm, { TripFormValues } from "@/components/trip/TripForm";

export default function EditTripPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getTrip, updateTrip, isLoading: apiLoading } = useTrips();

    const [trip, setTrip] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Load initial data
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

    const handleSubmit = async (data: TripFormValues) => {
        if (!id) return;
        try {
            setError(null);
            const thumbnail = (window as any).__trip_thumbnail ?? trip?.thumbnail ?? null;
            const destinations = data.destinations?.map((d) => ({
                id: d.id,
                label: d.label,
            })) ?? [];

            await updateTrip(id, {
                title: data.title,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                isPublic: !!data.isPublic,
                thumbnail,
                destinations,
            });

            navigate(`/trip-circle/trip/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update trip");
        }
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

    // Convert API data to Form Values
    const initialValues: Partial<TripFormValues> = {
        title: trip.title,
        description: trip.description || "",
        startDate: trip.startDate.split("T")[0],
        endDate: trip.endDate.split("T")[0],
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
        </div>
    );
}