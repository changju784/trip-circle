import { Card } from "@/components/ui/Card";
import { Trip } from "@/lib/trips/trips-api";
import { buildDestinationSummary, formatDateRange } from "@/lib/trips/util";

interface TripCardProps {
    trip: Trip;
    thumbnailUrl?: string | null;
    onClick?: () => void;
    /** Content to render at the bottom of the card (Buttons, Socials, etc) */
    footer?: React.ReactNode;
}

export function TripCard({ trip, thumbnailUrl, onClick, footer }: TripCardProps) {
    const dateRange = formatDateRange(trip.startDate, trip.endDate);
    const destinationSummary = buildDestinationSummary(trip);

    return (
        <Card
            className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
            onClick={onClick}
        >
            {/* Thumbnail Section */}
            {thumbnailUrl ? (
                <div className="h-32 w-full bg-gray-100">
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
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {trip.title}
                    </h3>

                    {dateRange && (
                        <p className="text-xs font-medium text-sky-700 bg-sky-50 inline-flex px-2 py-1 rounded-full">
                            {dateRange}
                        </p>
                    )}

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