import { Card } from "@/components/ui/Card";
import { Trip } from "@/lib/trips/trips-api";
import { buildDestinationSummary, formatDateRange } from "@/lib/trips/util";
import { Avatar } from "@/components/ui/Avatar";
import { useGetTripOwners } from "@/pages/trip/hooks/use-get-trip-owners";
import { cn } from "@/lib/utils";
import { TAG_CONFIG } from "@/lib/const/trip-tags";
import { Badge } from "@/components/ui/badge";

interface TripCardProps {
    trip: Trip;
    thumbnailUrl?: string | null;
    onClick?: () => void;
    footer?: React.ReactNode;
    className?: string;
}

export function TripCard({ trip, thumbnailUrl, onClick, footer, className }: TripCardProps) {
    const dateRange = formatDateRange(trip.startDate, trip.endDate);
    const destinationSummary = buildDestinationSummary(trip);
    const { owner } = useGetTripOwners(trip);

    return (
        <Card
            className={cn(
                "group relative flex flex-col h-auto md:h-[480px] overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-[32px] hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                className
            )}
            onClick={onClick}
        >
            {/* Thumbnail */}
            <div className="relative w-full h-[200px] md:h-3/5 transition-all duration-500 ease-in-out md:group-hover:h-[25%] overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                {thumbnailUrl ? (
                    <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-700 md:group-hover:scale-110"
                        style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
                )}
            </div>

            {/* 2. Content Section */}
            <div className="p-5 md:p-6 flex flex-col flex-1 min-h-0 relative bg-white dark:bg-gray-800 transition-all duration-500">
                <div className="text-left space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
                            {trip.title}
                        </h3>
                        {owner && (
                            <Avatar
                                user={owner}
                                size={24}
                                className="ring-2 ring-white dark:ring-gray-700 shrink-0"
                            />
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {dateRange && (
                                <p className="text-[9px] md:text-[10px] font-bold text-sky-700 bg-sky-50 dark:text-sky-200 dark:bg-sky-900/40 px-2 py-1 rounded-full uppercase">
                                    {dateRange}
                                </p>
                            )}
                            <p className="text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 uppercase">
                                ${trip.totalPrice?.toLocaleString() ?? 0}
                            </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight line-clamp-1 italic">
                            {destinationSummary}
                        </p>
                    </div>

                    {/* Tags and Description Section */}
                    <div className="block md:grid md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                        <div className="overflow-hidden">
                            <div className="pt-2 space-y-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:delay-150">

                                {/* Tags */}
                                {trip.tags && trip.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {trip.tags.map((tagId) => {
                                            const config = TAG_CONFIG[tagId as keyof typeof TAG_CONFIG];
                                            if (!config) return null;
                                            return (
                                                <Badge key={tagId} variant="outline" className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-[9px] font-bold uppercase tracking-tight">
                                                    <config.icon size={10} className="text-blue-500" />
                                                    {config.label}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Description */}
                                {trip.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {trip.description}
                                    </p>
                                )}

                                {/* Footer (Actions/Stats) */}
                                {footer && (
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                        {footer}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}