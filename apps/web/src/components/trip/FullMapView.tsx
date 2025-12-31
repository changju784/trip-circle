import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import { Button } from "../ui/Button";
import MapPreview from "./MapPreview";
import { Stop } from "@/lib/trips/trips-api";
import { cn } from "@/lib/utils";

type FullMapViewProps = {
    isOpen: boolean;
    onClose: () => void;
    days: { date: string; stops: Stop[] }[];
    initialDayIndex: number;
    onEditStop?: (stopId: string) => void;
};

export default function FullMapView({
    isOpen,
    onClose,
    days,
    initialDayIndex,
    onEditStop
}: FullMapViewProps) {
    const [viewDayIndex, setViewDayIndex] = useState<number>(initialDayIndex);

    if (!isOpen) return null;

    const activeStops = viewDayIndex === -1
        ? days.flatMap((day, dIdx) =>
            day.stops.map((stop, sIdx) => ({
                ...stop,
                displayLabel: `${dIdx + 1}.${sIdx + 1}`
            }))
        )
        : days[viewDayIndex]?.stops.map((stop, sIdx) => ({
            ...stop,
            displayLabel: `${sIdx + 1}`
        })) || [];

    return (
        <div className="fixed inset-0 z-[40] h-screen w-screen bg-white dark:bg-slate-950 grid grid-rows-[auto_1fr] overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-14 shrink-0 border-b flex items-center justify-between px-4 bg-white dark:bg-gray-900 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-primary" />
                    <div>
                        <h2 className="font-semibold text-sm">Full Route Exploration</h2>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {viewDayIndex === -1 ? "Showing Entire Trip" : `Day ${viewDayIndex + 1}`}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X size={20} />
                </Button>
            </div>

            {/* Map Body */}
            <div className="relative w-full h-full bg-slate-100 dark:bg-slate-950 min-h-0">
                {/* Floating Day Selector Bubble */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-1 bg-white/90 dark:bg-gray-900/90 p-1 rounded-full shadow-2xl border border-border backdrop-blur-md max-w-[95vw] overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setViewDayIndex(-1)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap",
                            viewDayIndex === -1 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
                        )}
                    >
                        All Days
                    </button>
                    {days.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setViewDayIndex(idx)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap",
                                viewDayIndex === idx ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
                            )}
                        >
                            Day {idx + 1}
                        </button>
                    ))}
                </div>

                <div className="absolute inset-0">
                    <MapPreview
                        stops={activeStops}
                        height={undefined}
                        onMarkerClick={(stop) => onEditStop?.(stop.id)}
                        showRoute={viewDayIndex !== -1}
                    />
                </div>
            </div>
        </div>
    );
}