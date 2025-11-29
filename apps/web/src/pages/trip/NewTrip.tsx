import React from "react";
import Navbar from "../../components/layout/Navbar";
import FormContainer from "../../components/form/FormContainer";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "../dashboard/BackToDashboardButton";
import { useForm } from "react-hook-form";
import { createTrip } from "../../lib/tripStorage";

type FormValues = {
    title: string;
    city?: string;
    description?: string;
    startDate: string;
    endDate: string;
    isPublic?: boolean;
};

export default function NewTripPage() {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<FormValues>({
        defaultValues: { city: "Paris", title: "", description: "", startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), isPublic: false },
    });

    const onSubmit = (data: FormValues) => {
        const trip = createTrip({
            title: data.title || "Untitled Trip",
            city: data.city,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            isPublic: !!data.isPublic,
        });
        navigate(`/trip-circle/trip/${trip.id}`);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <FormContainer title="Create New Trip" subtitle="Start planning your next adventure">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-1">Trip Title</div>
                            <input {...register("title")} placeholder="e.g., Summer in Europe" className="w-full px-4 py-2 rounded-lg border" />
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Destination City</div>
                            <select {...register("city")} className="w-full px-4 py-2 rounded-lg border bg-white">
                                <option>Paris</option>
                                <option>Tokyo</option>
                                <option>New York</option>
                                <option>Bangkok</option>
                            </select>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Description (Optional)</div>
                            <textarea {...register("description")} className="w-full rounded-lg p-3 border" placeholder="Tell others about your trip..."></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Start Date</div>
                                <input {...register("startDate")} type="date" className="w-full px-4 py-2 rounded-lg border" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">End Date</div>
                                <input {...register("endDate")} type="date" className="w-full px-4 py-2 rounded-lg border" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input id="public" type="checkbox" {...register("isPublic")} />
                                <label htmlFor="public">Make trip public</label>
                            </div>
                            <div className="text-sm text-muted-foreground">Only you can view this trip</div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="muted" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button variant="primary" type="submit">Create Trip</Button>
                        </div>
                    </form>
                </FormContainer>
            </main>
        </div>
    );
}
