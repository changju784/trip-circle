import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { geocodeLocation, geocodeSearch } from "@/lib/geocode";
import { Stop } from "@/lib/tripStorage";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        time?: string;
        locationName?: string;
        lat?: number | null;
        lng?: number | null;
        description?: string;
    }, stopId?: string | null) => void;
    initialStop?: Stop | null;
};

type FormData = {
    title: string;
    time?: string;
    locationName?: string;
    description?: string;
};

export default function AddStopModal({ open, onClose, onSubmit, initialStop = null }: Props) {
    const { register, handleSubmit, reset, formState, setValue, watch } = useForm<FormData>({
        defaultValues: {
            title: "",
            time: "",
            locationName: "",
            description: "",
        },
    });

    const { errors } = formState;
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState("");
    const [suggestions, setSuggestions] = useState<{ lat: number; lng: number; displayName: string }[]>([]);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; displayName?: string } | null>(null);

    const locationValue = watch("locationName");

    // fetch suggestions as user types (debounced)
    useEffect(() => {
        let mounted = true;
        if (!locationValue || locationValue.length < 2) {
            setSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            const res = await geocodeSearch(locationValue);
            if (mounted) setSuggestions(res);
        }, 350);
        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, [locationValue]);

    useEffect(() => {
        if (initialStop) {
            setValue("title", initialStop.title || "");
            setValue("time", initialStop.time || "");
            setValue("locationName", initialStop.locationName || "");
            setValue("description", initialStop.description || "");
            if (initialStop.lat != null && initialStop.lng != null) {
                setSelectedCoords({ lat: initialStop.lat, lng: initialStop.lng, displayName: initialStop.locationName });
            } else {
                setSelectedCoords(null);
            }
        } else {
            reset();
        }
    }, [initialStop, setValue, reset]);

    const submit = async (data: FormData) => {
        setLoading(true);
        setGeoError("");

        let lat = null as number | null;
        let lng = null as number | null;

        // Prefer selected suggestion coords
        if (selectedCoords) {
            lat = selectedCoords.lat;
            lng = selectedCoords.lng;
        } else if (data.locationName) {
            const result = await geocodeLocation(data.locationName);

            if (result) {
                lat = result.lat;
                lng = result.lng;
            } else {
                setGeoError("Couldn't find this location. Coordinates saved as null.");
            }
        }

        onSubmit({
            title: data.title,
            time: data.time,
            locationName: data.locationName,
            lat,
            lng,
            description: data.description,
        }, initialStop?.id ?? null);

        setLoading(false);
        reset();
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={initialStop ? "Edit Stop" : "Add Stop"}>
            <form onSubmit={handleSubmit(submit)} className="space-y-4">

                {/* Smart Fill */}
                <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium">Smart Fill</div>
                    <div className="text-sm text-muted-foreground">Upload a receipt, ticket, or booking confirmation to automatically extract details (mock)</div>
                    <button type="button" className="mt-3 bg-white px-3 py-2 rounded border">Upload Image/PDF</button>
                </div>

                {/* Title */}
                <div>
                    <label className="text-sm font-medium">Title *</label>
                    <input {...register("title", { required: "This field is required" })} className={`w-full mt-1 px-3 py-2 rounded-lg border ${errors.title ? "border-red-600" : ""}`} placeholder="e.g., Eiffel Tower" />
                    {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title.message}</div>}
                </div>

                {/* Time */}
                <div>
                    <label className="text-sm font-medium">Time *</label>
                    <input {...register("time", { required: "This field is required" })} type="time" className={`w-full mt-1 px-3 py-2 rounded-lg border ${errors.time ? "border-red-600" : ""}`} />
                    {errors.time && <div className="text-red-600 text-xs mt-1">{errors.time.message}</div>}
                </div>

                {/* Location */}
                <div>
                    <label className="text-sm font-medium">Location *</label>
                    <input {...register("locationName", { required: "This field is required" })} className={`w-full mt-1 px-3 py-2 rounded-lg border ${errors.locationName ? "border-red-600" : ""}`} placeholder="e.g., Champ de Mars, Paris" />
                    {errors.locationName && <div className="text-red-600 text-xs mt-1">{errors.locationName.message}</div>}
                    {geoError && (<div className="text-red-600 text-xs mt-1">{geoError}</div>)}

                    {suggestions.length > 0 && (
                        <div className="border rounded bg-white mt-2 max-h-40 overflow-auto">
                            {suggestions.map((s, i) => (
                                <div key={`${s.lat}-${s.lng}-${i}`} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => {
                                    setValue("locationName", s.displayName);
                                    setSelectedCoords({ lat: s.lat, lng: s.lng, displayName: s.displayName });
                                    setSuggestions([]);
                                }}>{s.displayName}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea {...register("description")} className="w-full mt-1 px-3 py-2 rounded-lg border" placeholder="Notes, activities, or details about this stop..." />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-700 text-white disabled:opacity-50">{loading ? "Saving..." : initialStop ? "Save" : "Add Stop"}</button>
                </div>
            </form>
        </Modal>
    );
}
