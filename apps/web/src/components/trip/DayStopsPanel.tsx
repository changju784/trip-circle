import React from "react";
import StopItem from "./StopItem";

export default function DayStopsPanel({ days, selectedDay, onOpenAdd, onEditStop, onDeleteStop }: any) {
    const day = days[selectedDay];

    const dayLabel = (iso: string) => {
        const d = new Date(`${iso}T00:00:00`);
        return d.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        } as const);
    };


    return (
        <div className="bg-white rounded-lg p-6 mt-4">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm font-medium">Day {selectedDay + 1}</div>
                    <div className="text-sm text-muted-foreground">
                        {dayLabel(day.date)}
                    </div>
                </div>

                <button
                    onClick={onOpenAdd}
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
                <div>
                    {day.stops.map((stop) => (
                        <StopItem key={stop.id} stop={stop} onEdit={() => onEditStop?.(stop.id)} onDelete={() => onDeleteStop?.(stop.id)} />
                    ))}
                </div>
            )}
        </div>
    );
}
