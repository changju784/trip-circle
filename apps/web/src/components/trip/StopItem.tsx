import React from "react";
import { Stop } from "../../lib/tripStorage";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";

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
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(stop.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                    title="Edit Stop"
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.(stop.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    title="Delete Stop"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
