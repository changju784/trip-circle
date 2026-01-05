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
    className?: string; // Added to support horizontal scroll width
}

export function TripCard({ trip, thumbnailUrl, onClick, footer, className }: TripCardProps) {
    const dateRange = formatDateRange(trip.startDate, trip.endDate);
    const destinationSummary = buildDestinationSummary(trip);
    const { owner } = useGetTripOwners(trip);

    return (
        <Card
            className={cn(
                "flex flex-col overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
                className
            )}
            onClick={onClick}
        >
            {/* Thumbnail Section */}
            {thumbnailUrl ? (
                <div className="h-32 w-full bg-gray-100 dark:bg-gray-700">
                    <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />
                </div>
            ) : (
                <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
            )}

            {/* Content Section */}
            <div className="p-5 flex flex-col justify-between flex-1">
                <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
                            {trip.title}
                        </h3>
                        {owner && (
                            <Avatar
                                user={owner}
                                size={24}
                                showPopover={true}
                                className="ring-2 ring-white dark:ring-gray-700 shrink-0"
                            />
                        )}
                    </div>

                    {dateRange && (
                        <p className="text-xs font-medium text-sky-700 bg-sky-50 dark:text-sky-200 dark:bg-sky-900/40 inline-flex px-2 py-1 rounded-full">
                            {dateRange}
                        </p>
                    )}

                    <p className="text-xs font-medium text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30 inline-flex px-2 py-1 rounded-full uppercase tracking-tight border border-emerald-100 dark:border-emerald-800/50">
                        TOTAL: ${trip.totalPrice?.toLocaleString() ?? 0}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {destinationSummary}
                    </p>

                    {trip.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {trip.description}
                        </p>
                    )}
                </div>

                {/* Footer Injection */}
                {footer && <div className="mt-4">{footer}</div>}
            </div>
        </Card>
    );
}