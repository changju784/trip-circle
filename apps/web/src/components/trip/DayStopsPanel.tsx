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

export default function DayStopsPanel({ days, selectedDay, onOpenAdd, onEditStop, onDeleteStop, onReorderStops }: any) {
    const day = days[selectedDay];

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
            <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-medium mb-2">🗺️ Route Preview</h3>
                <MapPreview stops={day.stops} height={350} />
            </div>

            {/* Day header and stops */}
            <div className="bg-white rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="text-sm font-medium">Day {selectedDay + 1}</div>
                        <div className="text-sm text-muted-foreground">
                            {dayLabel(day.date)}
                        </div>
                    </div>

                    <button
                        onClick={() => onOpenAdd(selectedDay)}
                        className="bg-black text-white px-3 py-2 rounded-lg"
                    >
                        + Add Stop
                    </button>
                </div>

                {day.stops.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
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
