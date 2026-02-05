import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import { useAuth } from "@/auth/hook/use-auth";
import { useTripsContext } from "@/contexts/TripsContext";
import { useToast } from "@/components/hooks/use-toast";
import TripForm, { TripFormValues } from "@/components/trip/TripForm";

export default function NewTripPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createTrip: createTripApi, isLoading } = useTripsContext();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: TripFormValues) => {
        try {
            setError(null);
            if (!user?.id) {
                setError("You must be logged in to create a trip");
                return;
            }

            const thumbnail = (window as any).__trip_thumbnail ?? null;
            const destinations = data.destinations?.map((d) => ({
                id: d.id,
                label: d.label,
            })) ?? [];

            const trip = await createTripApi({
                title: data.title || "Untitled Trip",
                destinations,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                budget: data.budget || null,
                tags: data.tags || [],
                isPublic: !!data.isPublic,
                thumbnail,
                members: [user.id],
            });

            toast({
                title: "Trip created",
                description: "Your trip has been successfully created.",
            });

            navigate(`/trip-circle/trip/${trip._id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create trip");
            toast({
                title: "Error",
                description: "There was an error creating your trip.",
                variant: "destructive",
            })
        }
    };

    return (
        <div className="min-h-screen">
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <TripForm
                    title="Create New Trip"
                    subtitle="Start planning your next adventure"
                    submitLabel="Create Trip"
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/dashboard")}
                />
            </main>
        </div>
    );
}