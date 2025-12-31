import React, { useMemo, useState } from "react";
import { X, Calendar, Plus, MousePointer2 } from "lucide-react";
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
    onAddStopAtCoords?: (dayIndex: number, coords: { lat: number, lng: number }) => void;
};

export default function FullMapView({
    isOpen,
    onClose,
    days,
    initialDayIndex,
    onEditStop,
    onAddStopAtCoords
}: FullMapViewProps) {
    const [viewDayIndex, setViewDayIndex] = useState<number>(initialDayIndex);
    const [isAddingPin, setIsAddingPin] = useState(false);
    const isAllDaysView = useMemo(() => viewDayIndex === -1, [viewDayIndex]);

    if (!isOpen) return null;

    const activeStops = isAllDaysView
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
                            {isAllDaysView ? "Showing Entire Trip" : `Day ${viewDayIndex + 1}`}
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 p-1 rounded-full shadow-2xl border border-border backdrop-blur-md max-w-[95vw] overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setViewDayIndex(-1)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap",
                            isAllDaysView ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
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

                    {/* Integrated "Drop Pin" Button */}
                    {!isAllDaysView && (
                        <>
                            {/* Visual Separator */}
                            <div className="w-px h-4 bg-border mx-1" />

                            <button
                                onClick={() => setIsAddingPin(!isAddingPin)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border-2",
                                    isAddingPin
                                        ? "bg-indigo-600 border-indigo-400 text-white shadow-inner"
                                        : "bg-slate-900 dark:bg-slate-100 border-transparent text-white dark:text-slate-900 hover:opacity-90"
                                )}
                            >
                                {isAddingPin ? (
                                    <>
                                        <MousePointer2 size={14} className="animate-pulse" />
                                        Click Map to Pin
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        Drop Pin
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Map Area */}
                <div className={cn("absolute inset-0", isAddingPin ? "cursor-crosshair" : "")}>
                    <MapPreview
                        stops={activeStops}
                        height={undefined}
                        onMarkerClick={(stop) => onEditStop?.(stop.id)}
                        showRoute={!isAllDaysView}
                        isAddingPin={isAddingPin}
                        onMapClick={(coords) => {
                            onAddStopAtCoords?.(viewDayIndex, coords);
                            setIsAddingPin(false);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}