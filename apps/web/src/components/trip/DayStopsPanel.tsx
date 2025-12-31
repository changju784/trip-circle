import React from "react";
import StopItem from "./StopItem";
import MapPreview from "./MapPreview";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "../ui/Button";

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

    const dailyPriceTotal = day.stops.reduce((sum: number, stop: any) => {
        return sum + (Number(stop.price) || 0);
    }, 0);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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
        // accept either full ISO (with time) or date-only (YYYY-MM-DD)
        let d: Date;
        try {
            if (String(iso).includes("T")) {
                d = new Date(iso);
            } else {
                d = new Date(`${iso}T00:00:00`);
            }
        } catch {
            d = new Date(iso);
        }

        return d.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        } as const);
    };


    return (
        <div className="space-y-4">
            {/* Map Preview for this day's stops */}
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3">
                <h3 className="text-black dark:text-gray-100 font-medium mb-2">🗺️ Route Preview</h3>
                <MapPreview stops={day.stops} height={350} onMarkerClick={(stop) => onEditStop?.(stop.id)} />
            </div>

            {/* Day header and stops */}
            <div className="bg-white dark:bg-gray-700 text-black dark:text-gray-100 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4"> {/* Flex container for date + total */}
                        <div>
                            <div className="text-sm font-medium">Day {selectedDay + 1}</div>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">
                                {dayLabel(day.date)}
                            </div>
                        </div>

                        {/* 2. Total Price Badge */}
                        {day.stops.length > 0 && (
                            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full">
                                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                    Total: ${dailyPriceTotal.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Add Stop Button */}
                    {isOwner && (
                        <Button
                            variant="dark"
                            size="sm"
                            onClick={() => onOpenAdd(selectedDay)}
                        >
                            + Add Stop
                        </Button>
                    )}
                </div>

                {day.stops.length === 0 ? (
                    <div className="text-center text-muted-foreground dark:text-gray-400 py-12">
                        No stops planned yet.
                        <br />Add your first stop.
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={day.stops.map((s: any) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div>
                                {day.stops.map((stop) => (
                                    <StopItem
                                        key={stop.id}
                                        stop={stop}
                                        isOwner={isOwner}
                                        onEdit={() => onEditStop?.(stop.id)}
                                        onDelete={() => onDeleteStop?.(stop.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
