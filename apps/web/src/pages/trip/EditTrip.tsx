import { useEffect, useState } from "react";
import FormContainer from "@/components/form/FormContainer";
import { Button } from "@/components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useTrips } from "@/lib/trips/use-trips";
import Select from "@/components/ui/Select";
import { searchCities } from "@/lib/citySearch";
import { Toggle } from "@/components/ui/Toggle";

type FormValues = {
    title: string;
    destinations?: { id: string; label: string }[];
    description?: string;
    startDate: string;
    endDate: string;
    isPublic?: boolean;
    thumbnail?: string | null;
};

export default function EditTripPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getTrip: getTripApi, updateTrip: updateTripApi, isLoading } = useTrips();

    const [trip, setTrip] = useState<any>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    const { register, handleSubmit, control, watch, setValue, formState } = useForm<FormValues>({
        defaultValues: {
            title: "",
            description: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            isPublic: false,
            destinations: [],
            thumbnail: null,
        },
    });

    const { errors } = formState;

    // Load trip on mount
    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function loadTrip() {
            try {
                setInitialLoading(true);
                setError(null);
                const data = await getTripApi(id);
                if (!cancelled) {
                    setTrip(data);
                    setPreview(data.thumbnail ?? null);

                    // Set form values
                    setValue("title", data.title);
                    setValue("description", data.description || "");
                    setValue("startDate", data.startDate.split("T")[0]);
                    setValue("endDate", data.endDate.split("T")[0]);
                    setValue("isPublic", data.isPublic ?? false);
                    setValue(
                        "destinations",
                        data.destinations?.map((d: any) => ({ id: d.id, label: d.label })) ?? []
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    const errorMsg = err instanceof Error ? err.message : "Failed to load trip";
                    setError(errorMsg);
                }
            } finally {
                if (!cancelled) {
                    setInitialLoading(false);
                }
            }
        }

        loadTrip();

        return () => {
            cancelled = true;
        };
    }, [id, getTripApi, setValue]);

    const onSubmit = async (data: FormValues) => {
        if (!id) return;

        try {
            setError(null);

            const thumbnail = (window as any).__trip_thumbnail ?? trip?.thumbnail ?? null;
            const destinations = data.destinations?.map((d) => ({
                id: d.id,
                label: d.label,
            })) ?? [];

            await updateTripApi(id, {
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
            const errorMsg = err instanceof Error ? err.message : "Failed to update trip";
            setError(errorMsg);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
                <main className="max-w-screen-md mx-auto p-6">
                    <div className="text-center">Loading trip...</div>
                </main>
            </div>
        );
    }

    if (error && !trip) {
        return (
            <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
                <main className="max-w-screen-md mx-auto p-6">
                    <div className="text-center text-red-600">
                        Error: {error} — <a href="/trip-circle/dashboard" className="underline">Back</a>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <main className="max-w-screen-md mx-auto p-6">
                <FormContainer title="Edit Trip" subtitle="Update your trip details">
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
                                className={`w-full px-4 py-2 rounded-lg border ${errors.title ? "border-red-600" : ""}`}
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
                                    validate: (v) =>
                                        (Array.isArray(v) && v.length >= 1 && v.length <= 3) ||
                                        "Please select 1-3 destinations",
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
                                    {...register("startDate", {
                                        required: "Start date is required",
                                        validate: (value) => {
                                            const end = watch("endDate");
                                            if (end && value > end) return "Start date cannot be after end date";
                                            return true;
                                        },
                                    })}
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
                                    {...register("endDate", {
                                        required: "End date is required",
                                        validate: (value) => {
                                            const start = watch("startDate");
                                            if (start && value < start) return "End date cannot be before start date";
                                            return true;
                                        },
                                    })}
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
                                    if (!f) return;
                                    const data = await new Promise<string | null>((res) => {
                                        const r = new FileReader();
                                        r.onload = () => res(String(r.result));
                                        r.onerror = () => res(null);
                                        r.readAsDataURL(f);
                                    });
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
                                    alt="thumbnail preview"
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
                                    {watch("isPublic")
                                        ? "Anyone can view this trip"
                                        : "Only you can view this trip"}
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
                                {isLoading ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </form>
                </FormContainer>
            </main>
        </div>
    );
}
