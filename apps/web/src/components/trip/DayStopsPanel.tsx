import React, { useMemo, useState } from "react";
import StopItem from "./StopItem";
import MapPreview from "./MapPreview";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "../ui/Button";
import { reverseGeocode, RouteData } from "@/lib/geo/geo-api";
import { Clock, ExternalLink, MapPin, Maximize2, Sparkles } from "lucide-react";
import FullMapView from "./FullMapView";
import { useOpenInGoogleMaps } from "@/pages/trip/hooks/use-open-in-google-map";
import { WeatherBadge } from "./WeatherBadge";
import { Destination } from "@/lib/trips/trips-api";
import { useSuggestions } from "@/lib/trips/use-suggestions";
import SuggestionCard from "./SuggestionCard";

interface DayStopsPanelProps {
    days: any[];
    selectedDay: number;
    primaryCity: string;
    destinations?: Destination[];
    isOwner?: boolean;
    onOpenAdd: (dayIndex: number, prefilledData?: any) => void;
    onEditStop?: (stopId: string) => void;
    onDeleteStop?: (stopId: string) => void;
    onReorderStops?: (dayIndex: number, reorderedStops: any[]) => void;
}

export default function DayStopsPanel({ days, selectedDay, primaryCity, destinations = [], isOwner, onOpenAdd, onEditStop, onDeleteStop, onReorderStops }: DayStopsPanelProps) {
    const day = days[selectedDay];
    const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const { openDirections } = useOpenInGoogleMaps();

    // Collect all existing stop titles across all days for deduplication
    const existingTitles = useMemo(() => {
        const titles = new Set<string>();
        for (const d of days) {
            for (const s of d.stops ?? []) {
                if (s.title) titles.add(s.title.toLowerCase());
            }
        }
        return titles;
    }, [days]);

    const { allSuggestions, images, loading: suggestionsLoading } = useSuggestions(destinations);

    // Filter out already-added stops, cap at 3
    const suggestions = useMemo(() =>
        allSuggestions.filter(s => !existingTitles.has(s.title.toLowerCase())).slice(0, 3),
        [allSuggestions, existingTitles]
    );

    const dailyPriceTotal = day.stops.reduce((sum: number, stop: any) => {
        return sum + (Number(stop.price) || 0);
    }, 0);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAddStopAtCoords = async (dayIndex: number, coords: { lat: number, lng: number }) => {
        try {
            const locationData = await reverseGeocode(coords.lat, coords.lng);
            const prefilledStop = {
                title: "",
                locationName: locationData?.displayName || "",
                lat: coords.lat,
                lng: coords.lng,
                category: 'none'
            };

            onOpenAdd(dayIndex, prefilledStop);
        } catch (error) {
            console.error("Failed to reverse geocode:", error);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = day.stops.findIndex((s: any) => s.id === active.id);
            const newIndex = day.stops.findIndex((s: any) => s.id === over.id);
            const reordered = arrayMove(day.stops, oldIndex, newIndex);
            onReorderStops?.(selectedDay, reordered);
        }
    };

    const dayLabel = (iso: string) => {
        let d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
        return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-black dark:text-gray-100 font-medium flex items-center gap-2">
                        🗺️ Route Preview
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setIsFullMapOpen(true)}
                    >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        Full View
                    </Button>
                </div>
                <MapPreview
                    stops={day.stops}
                    height={350}
                    onMarkerClick={(stop) => onEditStop?.(stop.id)}
                    onRouteFetched={setActiveRoute}
                />
            </div>
            <FullMapView
                isOpen={isFullMapOpen}
                onClose={() => setIsFullMapOpen(false)}
                days={days}
                initialDayIndex={selectedDay}
                isOwner={isOwner}
                onEditStop={onEditStop}
                onAddStopAtCoords={handleAddStopAtCoords}
            />

            <div className="bg-white dark:bg-gray-700 text-black dark:text-gray-100 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="text-sm font-medium">Day {selectedDay + 1}</div>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">{dayLabel(day.date)}</div>
                        </div>
                        {day.stops.length > 0 && (
                            <div className="px-2 py-0.5 md:px-3 md:py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full shrink-0">
                                <span className="text-[10px] md:text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                    Total: ${dailyPriceTotal.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {primaryCity && days[selectedDay]?.date && (
                            <WeatherBadge
                                city={primaryCity}
                                date={days[selectedDay].date.split('T')[0]}
                            />
                        )}
                    </div>
                    {isOwner && (
                        <Button variant="primary" size="sm" onClick={() => onOpenAdd(selectedDay)}>+ Add Stop</Button>
                    )}
                </div>

                {day.stops.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">No stops planned yet.</div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={day.stops.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col">
                                {day.stops.map((stop, index) => {
                                    // Get the travel info for the segment AFTER this stop
                                    const leg = activeRoute?.geometry?.features?.[0]?.properties?.legs?.[index];
                                    const nextStop = day.stops[index + 1];

                                    return (
                                        <React.Fragment key={stop.id}>
                                            <StopItem
                                                stop={stop}
                                                isOwner={isOwner}
                                                onEdit={() => onEditStop?.(stop.id)}
                                                onDelete={() => onDeleteStop?.(stop.id)}
                                            />

                                            {/* TRAVEL INDICATOR */}
                                            {index < day.stops.length - 1 && leg && nextStop && (
                                                <div className="relative ml-6 my-1 z-10">
                                                    {/* Dashed Line Connector */}
                                                    <div className="absolute left-[-11px] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 dark:border-gray-600" />

                                                    <div className="flex items-center gap-2 pl-4 py-4">
                                                        {/* Time Badge */}
                                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm text-[11px] text-gray-500 dark:text-gray-400">
                                                            <Clock size={12} />
                                                            {Math.round(leg.time / 60)} mins
                                                        </div>

                                                        {/* Distance Badge */}
                                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm text-[11px] text-gray-500 dark:text-gray-400">
                                                            <MapPin size={12} />
                                                            {(leg.distance / 1000).toFixed(1)} km
                                                        </div>

                                                        {/* NEW: External Link Button placed directly next to badges */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:text-indigo-600 transition-all active:scale-90 ml-1"
                                                            onClick={() => openDirections(stop, nextStop, activeRoute?.mode)}
                                                            title="View Directions in Google Maps"
                                                        >
                                                            <ExternalLink size={12} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        {/* Suggestions section (owners only, when trip has at least one destination) */}
        {isOwner && destinations.length > 0 && (
            <div className="bg-white dark:bg-gray-700 text-black dark:text-gray-100 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} className="text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Suggested Places Nearby</h3>
                    {suggestionsLoading && (
                        <span className="text-[11px] text-muted-foreground animate-pulse">Loading…</span>
                    )}
                </div>

                {!suggestionsLoading && suggestions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No suggestions available for this destination.</p>
                )}

                {suggestions.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                        {suggestions.map(s => (
                            <SuggestionCard
                                key={s.xid}
                                suggestion={s}
                                imageUrl={images[s.xid]}
                                onAdd={() => onOpenAdd(selectedDay, {
                                    title: s.title,
                                    category: s.category,
                                    locationName: s.locationName,
                                    lat: s.lat,
                                    lng: s.lng,
                                    description: s.description,
                                })}
                            />
                        ))}
                    </div>
                )}

                {suggestionsLoading && (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="flex flex-col w-48 shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 animate-pulse">
                                <div className="h-28 bg-gray-200 dark:bg-gray-600" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-4/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        </div>
    );
}