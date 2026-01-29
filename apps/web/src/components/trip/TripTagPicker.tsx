import { TripTag } from "@/lib/trips/trips-api";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { TRIP_TAGS } from "@/lib/const/trip-tags";

interface TagPickerProps {
    selectedTags: TripTag[];
    onChange: (tags: TripTag[]) => void;
    className?: string;
}

export function TagPicker({ selectedTags, onChange, className }: TagPickerProps) {
    const toggleTag = (tagId: TripTag) => {
        if (selectedTags.includes(tagId)) {
            onChange(selectedTags.filter((t) => t !== tagId));
        } else {
            onChange([...selectedTags, tagId]);
        }
    };

    const categories = ["season", "group", "style", "vibe", "activity"];

    return (
        <div className={cn("space-y-6", className)}>
            {categories.map((cat) => (
                <div key={cat} className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">
                        {cat}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {TRIP_TAGS.filter((t) => t.category === cat).map((tag) => {
                            const isSelected = selectedTags.includes(tag.id);
                            const Icon = tag.icon;

                            return (
                                <Badge
                                    key={tag.id}
                                    variant="outline"
                                    onClick={() => toggleTag(tag.id)}
                                    className={cn(
                                        "cursor-pointer rounded-full px-4 py-2 flex gap-2 items-center transition-all duration-300 border-2 select-none",
                                        isSelected
                                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105"
                                            : "bg-zinc-900/50 border-white/5 text-white/60 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    <Icon size={14} className={isSelected ? "text-white" : "text-white/40"} />
                                    <span className="font-bold text-[11px] uppercase tracking-wider">
                                        {tag.label}
                                    </span>
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}