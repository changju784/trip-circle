import React, { useState } from "react";
import StopItem from "./StopItem";
import MapPreview from "./MapPreview";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "../ui/Button";
import { RouteData } from "@/lib/geo/geo-api";
import { Clock, MapPin, Maximize2 } from "lucide-react";
import FullMapView from "./FullMapView";

export default function DayStopsPanel({ days, selectedDay, isOwner, onOpenAdd, onEditStop, onDeleteStop, onReorderStops }: {
    days: any[];
    selectedDay: number;
    isOwner?: boolean;
    onOpenAdd: (dayIndex: number) => void;
    onEditStop?: (stopId: string) => void;
    onDeleteStop?: (stopId: string) => void;
    onReorderStops?: (dayIndex: number, reorderedStops: any[]) => void;
}) {
    const day = days[selectedDay];
    const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);

    const dailyPriceTotal = day.stops.reduce((sum: number, stop: any) => {
        return sum + (Number(stop.price) || 0);
    }, 0);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = day.stops.findIndex((s: any) => s.id === active.id);
            const newIndex = day.stops.findIndex((s: any) => s.id === over.id);
            const reordered = arrayMove(day.stops, oldIndex, newIndex);
            onReorderStops?.(selectedDay, reordered);
        }
    };

    const dayLabel = (iso: string) => {
        let d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
        return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-black dark:text-gray-100 font-medium flex items-center gap-2">
                        🗺️ Route Preview
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setIsFullMapOpen(true)}
                    >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        Full View
                    </Button>
                </div>
                <MapPreview
                    stops={day.stops}
                    height={350}
                    onMarkerClick={(stop) => onEditStop?.(stop.id)}
                    onRouteFetched={setActiveRoute}
                />
            </div>
            <FullMapView
                isOpen={isFullMapOpen}
                onClose={() => setIsFullMapOpen(false)}
                days={days}
                initialDayIndex={selectedDay}
                onEditStop={onEditStop}
            />

            <div className="bg-white dark:bg-gray-700 text-black dark:text-gray-100 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="text-sm font-medium">Day {selectedDay + 1}</div>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">{dayLabel(day.date)}</div>
                        </div>
                        {day.stops.length > 0 && (
                            <div className="px-2 py-0.5 md:px-3 md:py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full shrink-0">
                                <span className="text-[10px] md:text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                    Total: ${dailyPriceTotal.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                    {isOwner && (
                        <Button variant="dark" size="sm" onClick={() => onOpenAdd(selectedDay)}>+ Add Stop</Button>
                    )}
                </div>

                {day.stops.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">No stops planned yet.</div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={day.stops.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col">
                                {day.stops.map((stop, index) => {
                                    // Get the travel info for the segment AFTER this stop
                                    const leg = activeRoute?.geometry?.features?.[0]?.properties?.legs?.[index];

                                    return (
                                        <React.Fragment key={stop.id}>
                                            <StopItem
                                                stop={stop}
                                                isOwner={isOwner}
                                                onEdit={() => onEditStop?.(stop.id)}
                                                onDelete={() => onDeleteStop?.(stop.id)}
                                            />

                                            {/* TRAVEL INDICATOR */}
                                            {index < day.stops.length - 1 && leg && (
                                                <div className="relative ml-6 my-[-4px] z-0">
                                                    {/* Dashed Line Connector */}
                                                    <div className="absolute left-[-11px] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 dark:border-gray-600" />

                                                    {/* Travel Info Badge */}
                                                    <div className="flex items-center gap-3 pl-4 py-4 text-[11px] text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                                            <Clock size={12} />
                                                            {Math.round(leg.time / 60)} mins
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                                            <MapPin size={12} />
                                                            {(leg.distance / 1000).toFixed(1)} km
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}