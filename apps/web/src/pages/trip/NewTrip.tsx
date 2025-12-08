import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import FormContainer from "@/components/form/FormContainer";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import { useForm, Controller } from "react-hook-form";
import { useTrips } from "@/lib/trips/use-trips";
import { useAuth } from "@/auth/hook/use-auth";
import Select from "@/components/ui/Select";
import { searchCities } from "@/lib/citySearch";
import { Toggle } from "@/components/ui/Toggle";
import { fetchSplashImage } from "@/lib/splashClient";


type FormValues = {
    title: string;
    destinations?: { id: string; label: string }[];
    description?: string;
    startDate: string;
    endDate: string;
    isPublic?: boolean;
    thumbnail?: string | null;
};


function buildSplashQuery(data: FormValues): string | null {
    const destinations = data.destinations || [];

    if (destinations.length > 0 && destinations[0]?.label) {
        return destinations[0].label;
    }
    if (data.title) return data.title;

    return null;
}


export default function NewTripPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createTrip: createTripApi, isLoading } = useTrips();
    const { register, handleSubmit, control, formState, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            destinations: [],
            title: "",
            description: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            isPublic: false,
            thumbnail: null,
        },
    });

    const [preview, setPreview] = React.useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { errors } = formState;

    const onSubmit = async (data: FormValues) => {
        try {
            setError(null);

            if (!user?.id) {
                setError("You must be logged in to create a trip");
                return;
            }

            let thumbnail = (window as any).__trip_thumbnail ?? null;

            // Add splash if trip thumbnail is null
            if (!thumbnail) {
                const splashQuery = buildSplashQuery(data);
                thumbnail = await fetchSplashImage(splashQuery);
            }
            

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
                isPublic: !!data.isPublic,
                thumbnail,
                members: [user.id],
            });

            navigate(`/trip-circle/trip/${trip._id}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to create trip";
            setError(errorMsg);
        }
    };

    const handleFile = async (f?: File | null) => {
        if (!f) return null;
        return await new Promise<string | null>((res) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result));
            reader.onerror = () => res(null);
            reader.readAsDataURL(f);
        });
    };

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <FormContainer title="Create New Trip" subtitle="Start planning your next adventure">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="text-sm font-medium mb-1">Trip Title</div>
                            <input
                                {...register("title", { required: "This field is required" })}
                                placeholder="e.g., Summer in Europe"
                                className={`w-full px-4 py-2 rounded-lg border ${errors.title ? "border-red-600" : ""
                                    }`}
                            />
                            {errors.title && (
                                <div className="text-red-600 text-xs mt-1">{errors.title.message}</div>
                            )}
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Destinations</div>
                            <Controller
                                control={control}
                                name="destinations"
                                rules={{
                                    validate: (v) => (Array.isArray(v) && v.length >= 1 && v.length <= 3) || "Please select 1-3 destinations",
                                }}
                                render={({ field }) => (
                                    <Select
                                        multiple
                                        maxSelection={3}
                                        value={field.value ?? []}
                                        onChange={(v) => field.onChange(v)}
                                        placeholder="Search cities..."
                                        fetchOptions={async (q) => (await searchCities(q)).slice(0, 10)}
                                    />
                                )}
                            />
                            {errors.destinations && (
                                <div className="text-red-600 text-xs mt-1">{errors.destinations.message}</div>
                            )}
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Description (Optional)</div>
                            <textarea
                                {...register("description")}
                                className="w-full rounded-lg p-3 border"
                                placeholder="Tell others about your trip..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Start Date</div>
                                <input
                                    {...register("startDate", { required: "Start date is required" })}
                                    type="date"
                                    className={`w-full px-4 py-2 rounded-lg border ${errors.startDate ? "border-red-600" : ""
                                        }`}
                                />
                                {errors.startDate && (
                                    <div className="text-red-600 text-xs mt-1">{errors.startDate.message}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">End Date</div>
                                <input
                                    {...register("endDate", { required: "End date is required" })}
                                    type="date"
                                    className={`w-full px-4 py-2 rounded-lg border ${errors.endDate ? "border-red-600" : ""
                                        }`}
                                />
                                {errors.endDate && (
                                    <div className="text-red-600 text-xs mt-1">{errors.endDate.message}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Thumbnail (optional)</div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    const data = await handleFile(f ?? undefined);
                                    (window as any).__trip_thumbnail = data;
                                    setPreview(data);
                                }}
                            />
                        </div>

                        {preview && (
                            <div className="mt-3">
                                <div className="text-sm font-medium mb-1">Preview</div>
                                <img
                                    src={preview}
                                    alt="trip thumbnail preview"
                                    className="w-40 h-28 object-cover rounded-lg border shadow"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 font-medium text-gray-800">
                                    <span className="text-lg">{watch("isPublic") ? "🌍" : "🔒"}</span>
                                    {watch("isPublic") ? "Public Trip" : "Private Trip"}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {watch("isPublic") ? "Anyone can view this trip" : "Only you can view this trip"}
                                </div>
                            </div>

                            <Toggle
                                checked={watch("isPublic") ?? false}
                                onChange={() => setValue("isPublic", !watch("isPublic"))}
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="muted" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Trip"}
                            </Button>
                        </div>
                    </form>
                </FormContainer>
            </main>
        </div>
    );
}
