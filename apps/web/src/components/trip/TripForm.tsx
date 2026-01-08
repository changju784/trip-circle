import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

import FormContainer from "@/components/form/FormContainer";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { DatePicker } from "@/components/ui/DatePicker";
import { searchCities } from "@/lib/geo/geo-api";
import { TagPicker } from "./TripTagPicker";
import { cn } from "@/lib/utils";
import { TripTag } from "@/lib/trips/trips-api";

export type TripFormValues = {
    title: string;
    destinations?: { id: string; label: string }[];
    description?: string;
    tags?: TripTag[];
    startDate: string;
    endDate: string;
    budget?: number;
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

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200 flex items-center gap-1">
        {children}
        <span className="text-red-500 font-bold">*</span>
    </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
        {children}
    </div>
);

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
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors }
    } = useForm<TripFormValues>({
        defaultValues: {
            title: "",
            description: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            budget: 0,
            isPublic: false,
            destinations: [],
            tags: [],
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (defaultValues?.tags?.length || defaultValues?.description || (defaultValues?.budget && defaultValues.budget > 0)) {
            setIsExpanded(true);
        }
    }, [defaultValues]);

    const handleCancel = () => {
        onCancel ? onCancel() : navigate(-1);
    };

    return (
        <FormContainer title={title} subtitle={subtitle}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* --- PRIMARY SECTION: THE ESSENTIALS --- */}
                <div className="space-y-4">
                    <div>
                        <RequiredLabel>Trip Title</RequiredLabel>
                        <input
                            {...register("title", { required: "Title is required" })}
                            placeholder="e.g., Summer in Europe"
                            className={cn(
                                "w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-all focus:ring-2 focus:ring-blue-500",
                                errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                            )}
                        />
                    </div>

                    <div>
                        <RequiredLabel>Destinations</RequiredLabel>
                        <Controller
                            control={control}
                            name="destinations"
                            rules={{ validate: (v) => (Array.isArray(v) && v.length >= 1) || "Select at least one city" }}
                            render={({ field }) => (
                                <Select
                                    multiple
                                    maxSelection={3}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    placeholder="Search cities..."
                                    fetchOptions={async (q) => (await searchCities(q)).slice(0, 10)}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <RequiredLabel>Start Date</RequiredLabel>
                            <Controller
                                control={control}
                                name="startDate"
                                render={({ field }) => (
                                    <DatePicker value={field.value ? new Date(field.value) : undefined} onChange={field.onChange} />
                                )}
                            />
                        </div>
                        <div>
                            <RequiredLabel>End Date</RequiredLabel>
                            <Controller
                                control={control}
                                name="endDate"
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value ? new Date(field.value) : undefined}
                                        onChange={field.onChange}
                                        minDate={watch("startDate") ? new Date(watch("startDate")) : undefined}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* --- SECONDARY SECTION: PROGRESSIVE DISCLOSURE --- */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 transition-colors mb-4 group"
                    >
                        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                        {isExpanded ? "Hide Extra Details" : "Add Vibes, Description & Budget"}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                                <FieldLabel>Budget (USD)</FieldLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        {...register("budget", { valueAsNumber: true })}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Description</FieldLabel>
                                <textarea
                                    {...register("description")}
                                    rows={3}
                                    className="w-full rounded-lg p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    placeholder="Tell others about your trip..."
                                />
                            </div>
                            <div>
                                <FieldLabel>Tags</FieldLabel>
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                    <Controller
                                        control={control}
                                        name="tags"
                                        render={({ field }) => (
                                            <TagPicker selectedTags={field.value || []} onChange={field.onChange} />
                                        )}
                                    />
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* --- FOOTER: VISIBILITY & ACTIONS --- */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <span>{watch("isPublic") ? "🌍" : "🔒"}</span>
                                {watch("isPublic") ? "Public Trip" : "Private Trip"}
                            </div>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">
                                {watch("isPublic") ? "Visible in Explore" : "Only you can edit"}
                            </span>
                        </div>
                        <Toggle
                            checked={watch("isPublic") ?? false}
                            onChange={() => setValue("isPublic", !watch("isPublic"))}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button variant="muted" type="button" className="flex-1" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </div>
            </form>
        </FormContainer>
    );
}