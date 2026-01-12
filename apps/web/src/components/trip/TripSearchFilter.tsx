import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { TRIP_TAGS } from "@/lib/const/trip-tags";
import { cn } from "@/lib/utils";
import type { Option } from "@/components/ui/Select";

const PRESET_TAGS = ["summer", "winter", "budget", "luxury", "solo", "adventure"];

interface TripSearchFilterProps {
    activeTags: string[];
    onToggleTag: (tagId: string) => void;
    onOpenAdvanced: () => void;
    sortOption: Option;
    sortOptions: Option[];
    onSortChange: (newSortId: string) => void;
}

export function TripSearchFilter({
    activeTags,
    onToggleTag,
    onOpenAdvanced,
    sortOption,
    sortOptions,
    onSortChange
}: TripSearchFilterProps) {
    return (
        <div className="flex gap-3 w-full md:w-auto items-center overflow-hidden">
            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {TRIP_TAGS.filter(t => PRESET_TAGS.includes(t.id)).map(tag => {
                    const isActive = activeTags.includes(tag.id);
                    return (
                        <Badge
                            key={tag.id}
                            variant="outline"
                            onClick={() => onToggleTag(tag.id)}
                            className={cn(
                                "rounded-full px-4 h-10 cursor-pointer flex gap-2 items-center text-[10px] font-bold uppercase transition-all shrink-0 border-2",
                                isActive
                                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "dark:border-white/10 border-zinc-200 dark:text-white/40 text-zinc-400 dark:bg-zinc-900 bg-zinc-100"
                            )}
                        >
                            <tag.icon size={12} className={isActive ? "text-blue-500 dark:text-blue-400" : ""} />
                            {tag.label}
                        </Badge>
                    );
                })}
            </div>

            <Button
                variant="secondary"
                size="sm"
                onClick={onOpenAdvanced}
                className="rounded-full h-10 px-4 flex gap-2 font-bold text-[10px] uppercase shrink-0 dark:border-white/5 border-zinc-200 dark:bg-zinc-900 bg-zinc-100"
            >
                <Filter size={14} className="dark:text-white text-zinc-900" />
            </Button>

            <select
                value={sortOption.id}
                onChange={(e) => onSortChange(e.target.value)}
                className="h-10 rounded-full border-2 dark:border-white/10 border-zinc-200 dark:bg-zinc-900 bg-zinc-100 px-4 text-[10px] font-bold uppercase tracking-widest dark:text-white text-zinc-900 outline-none focus:border-blue-500/50 transition-colors shrink-0"
            >
                {sortOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}