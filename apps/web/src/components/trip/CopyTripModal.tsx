import React, { useState, useMemo } from "react";
import { Trash2, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Select, { Option } from "@/components/ui/Select";
import { Modal } from "../ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { format } from "date-fns";

interface StopToCopy {
    id: string;
    title: string;
}

interface CopyTripModalProps {
    isOpen: boolean;
    tripTitle: string;
    stops: StopToCopy[];
    onConfirm: (data: { startDate: string; endDate: string; decisions: Record<string, string | "delete"> }) => void;
    onCancel: () => void;
}

export default function CopyTripModal({
    isOpen,
    tripTitle,
    stops,
    onConfirm,
    onCancel
}: CopyTripModalProps) {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const validDates = useMemo(() => {
        if (!startDate || !endDate) return [];
        const dates: { date: string; label: string }[] = [];
        let curr = new Date(startDate);
        const last = new Date(endDate);

        while (curr <= last) {
            const dateStr = curr.toISOString().split('T')[0];
            dates.push({
                date: dateStr,
                label: format(curr, "MMM d")
            });
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, [startDate, endDate]);

    const dateOptions: Option[] = [
        ...validDates.map(d => ({
            id: d.date,
            label: `Schedule for ${d.label}`,
            icon: CalendarDays,
        })),
        {
            id: "delete",
            label: "Don't copy this stop",
            icon: Trash2,
        }
    ];

    const [decisions, setDecisions] = useState<Record<string, string | "delete">>(
        Object.fromEntries(stops.map(s => [s.id, "delete"]))
    );

    const handleConfirm = () => {
        if (!startDate || !endDate) return;
        onConfirm({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            decisions
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={`Copy: ${tripTitle}`}
            description="Set your new travel dates and choose which stops to keep in your new itinerary."
        >
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 ml-1">Start Date</label>
                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="Select start"
                        />
                    </div>
                    <div className="space-y-1.5 border-l border-blue-500/10 pl-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 ml-1">End Date</label>
                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="Select end"
                            minDate={startDate}
                            disabled={!startDate}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Reconcile Stops
                        </h3>
                        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">
                            {stops.length} Total
                        </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {stops.map((stop) => (
                            <div
                                key={stop.id}
                                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-zinc-400" />
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{stop.title}</h4>
                                </div>

                                <Select
                                    showSearchbar={false}
                                    showCheckMark={true}
                                    disabled={!startDate || !endDate}
                                    value={dateOptions.find(opt => opt.id === decisions[stop.id]) || dateOptions[dateOptions.length - 1]}
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
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="muted" onClick={onCancel} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        className="flex-[2]"
                        disabled={!startDate || !endDate}
                    >
                        Create My Trip
                    </Button>
                </div>
            </div>
        </Modal>
    );
}