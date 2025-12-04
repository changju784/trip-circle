import React from "react";
import Navbar from "@/components/layout/Navbar";
import FormContainer from "@/components/form/FormContainer";
import { Button } from "@/components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { getTripById, updateTrip } from "@/lib/tripStorage";
import Select from "@/components/ui/Select";
import { searchCities } from "@/lib/citySearch";
import { Toggle } from "@/components/ui/Toggle";

export default function EditTripPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const trip = id ? getTripById(id) : null;
    const [preview, setPreview] = React.useState<string | null>(trip?.thumbnail ?? null);

    const { register, handleSubmit, control, watch, setValue } = useForm<any>({
        defaultValues: trip
            ? {
                title: trip.title,
                description: trip.description,
                startDate: trip.startDate,
                endDate: trip.endDate,
                isPublic: trip.isPublic,
                destinations: (trip as any).destinations
                    ? (trip as any).destinations.map((d: string) => ({ id: d, label: d }))
                    : trip.city
                        ? [{ id: trip.city, label: trip.city }]
                        : [],
            }
            : undefined,
    });

    const onSubmit = (data: any) => {
        if (!id) return;
        updateTrip(id, {
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            isPublic: !!data.isPublic,
            thumbnail: (window as any).__trip_thumbnail ?? trip.thumbnail ?? null,
        });
        navigate(`/trip-circle/trip/${id}`);
    };

    if (!trip)
        return (
            <div>
                <Navbar />
                <main className="max-w-screen-md mx-auto p-6">Trip not found</main>
            </div>
        );

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-md mx-auto p-6">
                <FormContainer title="Edit Trip" subtitle="Update your trip details">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-1">Trip Title</div>
                            <input
                                {...register("title", { required: true })}
                                placeholder="e.g., Summer in Europe"
                                className="w-full px-4 py-2 rounded-lg border"
                            />
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Destinations</div>
                            <Controller
                                control={control}
                                name="destinations"
                                rules={{
                                    validate: (v) => (Array.isArray(v) ? (v.length <= 3 && v.length >= 1) : true) || "Please select 1-3 destinations",
                                }}
                                render={({ field }) => (
                                    <Select
                                        multiple
                                        maxSelection={3}
                                        value={field.value ?? []}
                                        onChange={(v) => field.onChange(v)}
                                        fetchOptions={async (q) => (await searchCities(q)).slice(0, 10)}
                                    />
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Start Date</div>
                                <input
                                    {...register("startDate")}
                                    type="date"
                                    className="w-full px-4 py-2 rounded-lg border"
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">End Date</div>
                                <input
                                    {...register("endDate")}
                                    type="date"
                                    className="w-full px-4 py-2 rounded-lg border"
                                />
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
                                    {
                                        watch("isPublic") ? "Public Trip" : "Private Trip"
                                    }

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
                            <Button variant="primary" type="submit">
                                Save
                            </Button>
                        </div>
                    </form>
                </FormContainer>
            </main>
        </div>
    );
}
