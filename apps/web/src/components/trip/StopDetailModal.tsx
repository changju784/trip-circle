import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useForm, Controller } from "react-hook-form"; // Added Controller
import { Button } from "../ui/Button";
import { Destination, Stop, StopCategory } from "@/lib/trips/trips-api";
import { geocodeLocation, geocodeSearch } from "@/lib/geo/geo-api";
import Select from "../ui/Select";
import { STOP_CATEGORIES } from "@/lib/const/stop-categories";
import { DatePicker } from "../ui/DatePicker"; // Added DatePicker import
import { parseISO, format as formatDF } from "date-fns"; // Added date utilities

type StopDetailModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        category?: StopCategory;
        date?: string;
        time?: string;
        locationName?: string;
        lat?: number | null;
        lng?: number | null;
        price?: number | null;
        description?: string;
    }, stopId?: string | null) => void;
    cityContexts?: Destination[];
    initialStop?: Stop | null;
    initialDate?: string;
    startDate: Date;
    endDate: Date;
    readOnly?: boolean;
};

type FormData = {
    title: string;
    category: StopCategory;
    date: Date; // Form state uses Date object for the DatePicker
    time?: string;
    locationName?: string;
    price?: number;
    description?: string;
};

export default function StopDetailModal({
    open,
    onClose,
    onSubmit,
    cityContexts = [],
    initialStop = null,
    initialDate = "",
    startDate,
    endDate,
    readOnly = false
}: StopDetailModalProps) {
    const { register, handleSubmit, reset, formState, setValue, watch, control } = useForm<FormData>({
        defaultValues: {
            title: "",
            time: "",
            locationName: "",
            description: "",
        },
    });

    const { errors, dirtyFields } = formState;
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState("");
    const [suggestions, setSuggestions] = useState<{ lat: number; lng: number; displayName: string }[]>([]);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; displayName?: string } | null>(null);

    const locationValue = watch("locationName");
    const categoryValue = watch("category");

    useEffect(() => {
        let mounted = true;
        if (!locationValue || locationValue.length < 2 || !dirtyFields.locationName) {
            setSuggestions([]);
            return;
        }

        const t = setTimeout(async () => {
            const res = await geocodeSearch(locationValue, cityContexts);
            if (mounted) setSuggestions(res);
        }, 100);

        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, [locationValue, cityContexts, dirtyFields.locationName]);

    useEffect(() => {
        if (initialStop) {
            setValue("title", initialStop.title || "");
            setValue("time", initialStop.time || "");
            setValue("locationName", initialStop.locationName || "");
            setValue("description", initialStop.description || "");
            setValue("price", initialStop.price ?? undefined);
            setValue("category", (initialStop.category as StopCategory) || "none");

            if (initialDate) {
                setValue("date", parseISO(initialDate));
            }

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
            setValue("category", "none");
            setSelectedCoords(null);
            if (initialDate) {
                setValue("date", parseISO(initialDate));
            }
        }
    }, [initialStop, initialDate, setValue, reset]);

    const submit = async (data: FormData) => {
        setLoading(true);
        setGeoError("");

        let lat = null as number | null;
        let lng = null as number | null;

        if (selectedCoords) {
            lat = selectedCoords.lat;
            lng = selectedCoords.lng;
        } else if (data.locationName) {
            const result = await geocodeLocation(data.locationName, cityContexts);
            if (result) {
                lat = result.lat;
                lng = result.lng;
            } else {
                setGeoError("Location not found within trip area. Saving without coordinates.");
            }
        }

        onSubmit({
            title: data.title,
            category: data.category,
            // Format Date object back to string for the parent handler
            date: data.date ? formatDF(data.date, 'yyyy-MM-dd') : initialDate,
            time: data.time,
            locationName: data.locationName,
            lat,
            lng,
            price: data.price,
            description: data.description,
        }, initialStop?.id ?? null);

        setLoading(false);
        setSuggestions([]);
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
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-[2]">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Title *</label>
                        <input
                            {...register("title", { required: "Required" })}
                            className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.title ? "border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                            placeholder="e.g., Eiffel Tower"
                            disabled={readOnly}
                        />
                    </div>

                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Category</label>
                        <div className="mt-1">
                            <Select
                                value={STOP_CATEGORIES.find(c => c.id === categoryValue) || STOP_CATEGORIES[8]}
                                onChange={(val) => {
                                    const option = val as any;
                                    setValue("category", option.id as StopCategory);
                                }}
                                fetchOptions={async (q) =>
                                    STOP_CATEGORIES.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
                                }
                                showSearchbar={false}
                                showBadgedropdown={true}
                                showCheckMark={false}
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </div>

                {/* Date & Time Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Date *</label>
                        <div className="mt-1">
                            <Controller
                                control={control}
                                name="date"
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        minDate={startDate}
                                        maxDate={endDate}
                                        disabled={readOnly}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Time *</label>
                        <input
                            {...register("time", { required: "This field is required" })}
                            type="time"
                            className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.time ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                            disabled={readOnly}
                        />
                        {errors.time && <div className="text-red-600 text-xs mt-1">{errors.time.message}</div>}
                    </div>
                </div>

                <div className="relative">
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Location *</label>
                    <input
                        {...register("locationName", { required: "This field is required" })}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.locationName ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        placeholder="Search for an address..."
                        disabled={readOnly}
                        autoComplete="off"
                    />
                    {errors.locationName && <div className="text-red-600 text-xs mt-1">{errors.locationName.message}</div>}
                    {geoError && <div className="text-orange-600 text-xs mt-1">{geoError}</div>}

                    {suggestions.length > 0 && (
                        <div className="absolute z-100 w-full border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mt-1 max-h-40 overflow-auto shadow-lg">
                            {suggestions.map((s, i) => (
                                <div
                                    key={`${s.lat}-${s.lng}-${i}`}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 text-sm border-b last:border-b-0 border-gray-100 dark:border-gray-700"
                                    onClick={() => {
                                        setValue("locationName", s.displayName, { shouldDirty: false });
                                        setSelectedCoords({ lat: s.lat, lng: s.lng, displayName: s.displayName });
                                        setSuggestions([]);
                                    }}
                                >
                                    {s.displayName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Price (USD, Optional)</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
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
                            className={`w-full pl-7 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.price ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        />
                    </div>
                    {errors.price && <div className="text-red-600 text-xs mt-1">{errors.price.message}</div>}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Description</label>
                    <textarea
                        {...register("description")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600"
                        placeholder="Notes, activities, or details..."
                        disabled={readOnly}
                    />
                </div>

                {!readOnly && (
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : initialStop ? "Save Changes" : "Add Stop"}
                        </Button>
                    </div>
                )}
            </form>
        </Modal>
    );
}