import React from "react";
import { Stop } from "../../lib/tripStorage";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "../ui/Button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function StopItem({ stop, onEdit, onDelete }: { stop: Stop; onEdit?: (id: string) => void; onDelete?: (id: string) => void; }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border border-border dark:border-gray-600 rounded-lg p-3 mb-3 bg-white dark:bg-gray-600 flex items-center gap-2"
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 p-1"
                title="Drag to reorder"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0"> {/* added min-w-0 to prevent text overflow issues */}
                <div className="flex items-center gap-2">
                    <div className="font-medium dark:text-gray-100 truncate">{stop.title}</div>
                </div>

                <div className="text-sm text-muted-foreground dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <div>{stop.time ?? "--:--"}</div>

                    <div className="font-medium text-indigo-600 dark:text-indigo-400">
                        {stop.price && stop.price > 0 ? `$${stop.price.toLocaleString()}` : "Free"}
                    </div>

                    <div className="truncate flex-1">{stop.locationName ?? ""}</div>
                </div>

                {stop.description && (
                    <div className="text-sm mt-2 text-muted-foreground dark:text-gray-400 line-clamp-2">
                        {stop.description}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(stop.id)}
                    className="h-8 w-8 text-muted-foreground dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit Stop"
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.(stop.id)}
                    className="h-8 w-8 text-muted-foreground dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete Stop"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
