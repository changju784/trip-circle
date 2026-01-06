import { Card } from "@/components/ui/Card";
import { Trip } from "@/lib/trips/trips-api";
import { buildDestinationSummary, formatDateRange } from "@/lib/trips/util";
import { Avatar } from "@/components/ui/Avatar";
import { useGetTripOwners } from "@/pages/trip/hooks/use-get-trip-owners";
import { cn } from "@/lib/utils";

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
                "group relative flex flex-col h-[450px] overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-[32px] hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                className
            )}
            onClick={onClick}
        >
            {/* 1. Dynamic Thumbnail: Shrinks to 30% on hover to make room */}
            <div className="relative w-full h-1/2 md:h-3/5 transition-all duration-500 ease-in-out md:group-hover:h-[30%] overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
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
            <div className="p-6 flex flex-col flex-1 min-h-0 relative bg-white dark:bg-gray-800 transition-all duration-500">
                <div className="text-left space-y-3">
                    {/* Header: Always visible */}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
                            {trip.title}
                        </h3>
                        {owner && (
                            <Avatar
                                user={owner}
                                size={28}
                                showPopover={true}
                                className="ring-2 ring-white dark:ring-gray-700 shrink-0"
                            />
                        )}
                    </div>

                    {/* Meta Row: Date, Price, Location (Minimal State) */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {dateRange && (
                                <p className="text-[10px] font-bold text-sky-700 bg-sky-50 dark:text-sky-200 dark:bg-sky-900/40 px-2 py-1 rounded-full uppercase">
                                    {dateRange}
                                </p>
                            )}
                            <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 uppercase">
                                ${trip.totalPrice?.toLocaleString() ?? 0}
                            </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight line-clamp-1 italic">
                            {destinationSummary}
                        </p>
                    </div>

                    {/* 3. Expanded Section: Fills the remaining fixed height */}
                    <div className="md:grid md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                        <div className="overflow-hidden">
                            <div className="pt-3 space-y-4 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:delay-150">
                                {trip.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {trip.description}
                                    </p>
                                )}

                                {footer && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
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