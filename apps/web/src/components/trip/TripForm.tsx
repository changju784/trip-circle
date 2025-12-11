import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormContainer from "@/components/form/FormContainer";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { searchCities } from "@/lib/citySearch";
import { Toggle } from "@/components/ui/Toggle";
import { Upload } from "@/components/ui/Upload";
import { DatePicker } from "@/components/ui/DatePicker";

export type TripFormValues = {
    title: string;
    destinations?: { id: string; label: string }[];
    description?: string;
    startDate: string;
    endDate: string;
    isPublic?: boolean;
    thumbnail?: string | null;
};

interface TripFormProps {
    title: string;
    subtitle: string;
    defaultValues?: Partial<TripFormValues>;
    submitLabel: string;
    isLoading: boolean;
    error: string | null;
    onSubmit: (data: TripFormValues) => Promise<void>;
    onCancel?: () => void;
}

export default function TripForm({
    title,
    subtitle,
    defaultValues,
    submitLabel,
    isLoading,
    error,
    onSubmit,
    onCancel,
}: TripFormProps) {
    const navigate = useNavigate();
    const [preview, setPreview] = useState<string | null>(defaultValues?.thumbnail || null);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<TripFormValues>({
        defaultValues: {
            title: "",
            description: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            isPublic: false,
            destinations: [],
            thumbnail: null,
            ...defaultValues, // Override defaults if data is passed (Edit mode)
        },
    });

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate(-1);
        }
    };

    return (
        <FormContainer title={title} subtitle={subtitle}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Title */}
                <div>
                    <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Trip Title</div>
                    <input
                        {...register("title", { required: "This field is required" })}
                        placeholder="e.g., Summer in Europe"
                        className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.title ? "border-red-600 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title.message}</div>}
                </div>

                {/* Destinations */}
                <div>
                    <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Destinations</div>
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
                    {errors.destinations && <div className="text-red-600 text-xs mt-1">{errors.destinations.message}</div>}
                </div>

                {/* Description */}
                <div>
                    <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description (Optional)</div>
                    <textarea
                        {...register("description")}
                        className="w-full rounded-lg p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Tell others about your trip..."
                    ></textarea>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Start Date</div>
                        <Controller
                            control={control}
                            name="startDate"
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <DatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={field.onChange}
                                    placeholder="Select start date"
                                />
                            )}
                        />
                        {errors.startDate && <div className="text-red-600 text-xs mt-1">{errors.startDate.message}</div>}
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">End Date</div>
                        <Controller
                            control={control}
                            name="endDate"
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <DatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={field.onChange}
                                    placeholder="Select end date"
                                    minDate={watch("startDate") ? new Date(watch("startDate")) : undefined}
                                />
                            )}
                        />
                        {errors.endDate && <div className="text-red-600 text-xs mt-1">{errors.endDate.message}</div>}
                    </div>
                </div>

                {/* Upload */}
                <Upload
                    label="Upload Trip Thumbnail (Optional)"
                    accept="image/*"
                    onFileSelect={(data) => {
                        (window as any).__trip_thumbnail = data;
                        setPreview(data);
                    }}
                />
                {preview && (
                    <div className="mt-3">
                        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Preview</div>
                        <img src={preview} alt="preview" className="w-40 h-28 object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow" />
                    </div>
                )}

                {/* Public Toggle */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                            <span className="text-lg">{watch("isPublic") ? "🌍" : "🔒"}</span>
                            {watch("isPublic") ? "Public Trip" : "Private Trip"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {watch("isPublic") ? "Anyone can view this trip" : "Only you can view this trip"}
                        </div>
                    </div>
                    <Toggle
                        checked={watch("isPublic") ?? false}
                        onChange={() => setValue("isPublic", !watch("isPublic"))}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button variant="muted" type="button" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : submitLabel}
                    </Button>
                </div>
            </form>
        </FormContainer>
    );
}
