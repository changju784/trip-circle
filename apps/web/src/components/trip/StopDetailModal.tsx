import React, { useEffect, useState } from "react";
// Ensure this path matches where you saved the new Modal wrapper
import { Modal } from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { Button } from "../ui/Button";
import { Stop } from "@/lib/trips/trips-api";
import { geocodeLocation, geocodeSearch } from "@/lib/geo/geo-api";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        time?: string;
        locationName?: string;
        lat?: number | null;
        lng?: number | null;
        price?: number | null;
        description?: string;
    }, stopId?: string | null) => void;
    initialStop?: Stop | null;
    readOnly?: boolean;
};

type FormData = {
    title: string;
    time?: string;
    locationName?: string;
    price?: number;
    description?: string;
};

export default function StopDetailModal({ open, onClose, onSubmit, initialStop = null, readOnly = false }: Props) {
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
            setValue("price", initialStop.price ?? undefined);

            if (initialStop.lat != null && initialStop.lng != null) {
                setSelectedCoords({
                    lat: initialStop.lat,
                    lng: initialStop.lng,
                    displayName: initialStop.locationName,
                });
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
            price: data.price,
            description: data.description,
        }, initialStop?.id ?? null);

        setLoading(false);
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={initialStop ? "Edit Stop" : "Add Stop"}
        >
            <form onSubmit={handleSubmit(submit)} className="space-y-4">

                {/* Title */}
                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Title *</label>
                    <input {...register("title", { required: "This field is required" })} className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.title ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`} placeholder="e.g., Eiffel Tower" disabled={readOnly} />
                    {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title.message}</div>}
                </div>

                {/* Time */}
                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Time *</label>
                    <input {...register("time", { required: "This field is required" })} type="time" className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.time ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`} disabled={readOnly} />
                    {errors.time && <div className="text-red-600 text-xs mt-1">{errors.time.message}</div>}
                </div>

                {/* Location */}
                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Location *</label>
                    <input {...register("locationName", { required: "This field is required" })} className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.locationName ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`} placeholder="e.g., Champ de Mars, Paris" disabled={readOnly} />
                    {errors.locationName && <div className="text-red-600 text-xs mt-1">{errors.locationName.message}</div>}
                    {geoError && (<div className="text-red-600 text-xs mt-1">{geoError}</div>)}

                    {suggestions.length > 0 && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mt-2 max-h-40 overflow-auto shadow-sm">
                            {suggestions.map((s, i) => (
                                <div key={`${s.lat}-${s.lng}-${i}`} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100" onClick={() => {
                                    setValue("locationName", s.displayName);
                                    setSelectedCoords({ lat: s.lat, lng: s.lng, displayName: s.displayName });
                                    setSuggestions([]);
                                }}>{s.displayName}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price (USD) */}
                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Price (USD, Optional)
                    </label>

                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            $
                        </span>

                        <input
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            disabled={readOnly}
                            placeholder="e.g., 25"
                            {...register("price", {
                                min: { value: 0, message: "Price cannot be negative" },
                                valueAsNumber: true,
                            })}
                            className={`w-full pl-7 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.price
                                ? "border-red-600 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                                }`}
                        />
                    </div>

                    {errors.price && (
                        <div className="text-red-600 text-xs mt-1">
                            {errors.price.message}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Description</label>
                    <textarea {...register("description")} className="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600" placeholder="Notes, activities, or details about this stop..." disabled={readOnly} />
                </div>

                {/* Buttons */}
                {readOnly ? null : (
                    <div className="flex justify-end gap-3">

                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : initialStop ? "Save" : "Add Stop"}
                        </Button>
                    </div>
                )}
            </form>
        </Modal>
    );
}
