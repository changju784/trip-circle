import React, { useState } from "react";
import { AlertCircle, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Select, { Option } from "@/components/ui/Select";
import { Modal } from "../ui/Modal";

interface OrphanedStop {
    id: string;
    title: string;
    originalDate: string;
}

interface ReconcileStopsModalProps {
    isOpen: boolean;
    orphanedStops: OrphanedStop[];
    validDates: { date: string; label: string }[];
    onConfirm: (reconciledStops: Record<string, string | "delete">) => void;
    onCancel: () => void;
}

export default function ReconcileStopsModal({
    isOpen,
    orphanedStops,
    validDates,
    onConfirm,
    onCancel
}: ReconcileStopsModalProps) {
    const dateOptions: Option[] = [
        ...validDates.map(d => ({
            id: d.date,
            label: `Move to ${d.label}`,
            icon: CalendarDays,
        })),
        {
            id: "delete",
            label: "Delete this stop",
            icon: Trash2,
        }
    ];

    const [decisions, setDecisions] = useState<Record<string, string | "delete">>(
        Object.fromEntries(orphanedStops.map(s => [s.id, validDates[0]?.date || "delete"]))
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="Itinerary Reconciliation"
            description="Your new trip dates exclude some existing stops. Please reassign them below to keep your itinerary organized."
        >
            <div className="space-y-4 pt-4">
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {orphanedStops.map((stop) => (
                        <div
                            key={stop.id}
                            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {stop.title}
                                    </h4>
                                    <p className="text-[11px] text-zinc-500 uppercase font-medium tracking-tight mt-0.5">
                                        ORIGINALLY SCHEDULED: {new Date(stop.originalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                                    </p>
                                </div>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                            </div>

                            <Select
                                showSearchbar={false}
                                showCheckMark={true}
                                // Ensure the selected value matches an option in our list
                                value={dateOptions.find(opt => opt.id === decisions[stop.id])}
                                onChange={(val) => {
                                    if (val && !Array.isArray(val)) {
                                        setDecisions(prev => ({ ...prev, [stop.id]: val.id }));
                                    }
                                }}
                                fetchOptions={async () => dateOptions}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="muted" onClick={onCancel} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={() => onConfirm(decisions)} className="flex-[2]">
                        Confirm Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
}