import { MapPin, Plus } from "lucide-react";
import { PlaceSuggestion } from "@/lib/trips/trips-api";
import { CATEGORY_CONFIG } from "@/lib/const/stop-categories";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
    suggestion: PlaceSuggestion;
    imageUrl?: string;
    onAdd: () => void;
}

export default function SuggestionCard({ suggestion, imageUrl, onAdd }: SuggestionCardProps) {
    const catConfig = CATEGORY_CONFIG[suggestion.category] ?? CATEGORY_CONFIG.other;
    const Icon = catConfig.icon;

    return (
        <div className="flex flex-col w-48 shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Splash image */}
            <div className="relative h-28 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {imageUrl ? (
                    <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500" />
                )}
                {/* Category badge overlaid on image */}
                <div className={cn(
                    "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    catConfig.color
                )}>
                    <Icon size={10} />
                    {catConfig.label}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3 gap-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 leading-tight">
                    {suggestion.title}
                </p>

                {suggestion.locationName && suggestion.locationName !== suggestion.title && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground dark:text-gray-400">
                        <MapPin size={10} className="shrink-0" />
                        <span className="line-clamp-1">{suggestion.locationName}</span>
                    </div>
                )}

                {suggestion.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {suggestion.description}
                    </p>
                )}

                <button
                    onClick={onAdd}
                    className="mt-auto flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors duration-150"
                >
                    <Plus size={12} />
                    Add to Day
                </button>
            </div>
        </div>
    );
}
