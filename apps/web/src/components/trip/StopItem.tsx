import React from "react";
import { Stop } from "../../lib/tripStorage";

export default function StopItem({ stop, onEdit, onDelete }: { stop: Stop; onEdit?: (id: string) => void; onDelete?: (id: string) => void; }) {
    return (
        <div className="border border-border rounded-lg p-3 mb-3 bg-white flex justify-between items-center">
            <div>
                <div className="font-medium">{stop.title}</div>
                <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                    <div>{stop.time ?? "--:--"}</div>
                    <div>{stop.locationName ?? ""}</div>
                </div>
                {stop.description && <div className="text-sm mt-2 text-muted-foreground">{stop.description}</div>}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onEdit?.(stop.id)} className="p-2 rounded text-muted-foreground">✎</button>
                <button onClick={() => onDelete?.(stop.id)} className="p-2 rounded text-muted-foreground">🗑</button>
            </div>
        </div>
    );
}
