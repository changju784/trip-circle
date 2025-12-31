import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, GeoJSON, Tooltip, useMapEvents } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { Stop } from "@/lib/trips/trips-api";
import { getMapRoute, RouteData } from "@/lib/geo/geo-api";
import { Footprints, Car, Bus, Bike, Loader2, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/const/stop-categories";

L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapInvalidator() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function MapClickHandler({ isAddingPin, onMapClick }) {
    useMapEvents({
        click: (e) => {
            if (!isAddingPin) return;
            onMapClick(e.latlng); // Returns {lat, lng}
        },
    });
    return null;
}

function AutoFitBounds({ points }: { points: LatLngTuple[] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 14);
        } else {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [points, map]);
    return null;
}

type MapPreviewProps = {
    stops?: (Stop & { displayLabel?: string })[];
    height?: number;
    showRoute?: boolean;
    isAddingPin?: boolean;
    onMarkerClick?: (stop: Stop) => void;
    onRouteFetched?: (data: RouteData | null) => void;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
};

export default function MapPreview({ stops = [], height, showRoute = true, isAddingPin = false, onMarkerClick, onRouteFetched, onMapClick }: MapPreviewProps) {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [travelMode, setTravelMode] = useState<'walk' | 'drive' | 'transit' | 'bicycle'>('walk');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchRoute = async () => {
            const validStops = stops.filter((s) => s.lat != null && s.lng != null);
            if (!showRoute || validStops.length < 2) {
                setRouteData(null);
                onRouteFetched?.(null);
                return;
            }
            setIsLoading(true);
            try {
                const formattedStops = validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
                const data = await getMapRoute(formattedStops, travelMode);
                setRouteData(data);
                onRouteFetched?.(data);
            } catch (error) {
                setRouteData(null);
                onRouteFetched?.(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoute();
    }, [onRouteFetched, showRoute, stops, travelMode]);

    const createNumberedIcon = (stop: any, index: number, categoryId: string): L.DivIcon => {
        const config = CATEGORY_CONFIG[categoryId as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.none;
        const bgColorClass = config.color.split(' ')[0];
        const textColorClass = config.color.split(' ')[1];

        const label = stop.displayLabel || (index + 1).toString();

        return L.divIcon({
            className: "custom-div-icon",
            html: `
                <div class="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-md ${bgColorClass}">
                    <span class="text-[9px] font-bold ${textColorClass}">${label}</span>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    };

    const coords: LatLngTuple[] = stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => [Number(s.lat), Number(s.lng)] as LatLngTuple);

    const getLegStyle = () => ({
        color: isDark ? "#38bdf8" : "#2563eb",
        weight: 5,
        opacity: 0.8,
        dashArray: travelMode === 'walk' ? "5, 10" : "0",
        lineCap: 'round' as const
    });

    const onEachLeg = (legInfo: { distance: number, time: number }, layer: any) => {
        layer.on({
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({ weight: 8, color: '#f59e0b', opacity: 1 });
                const dist = (legInfo.distance / 1000).toFixed(1);
                const mins = Math.round(legInfo.time / 60);
                l.bindTooltip(`<b>${mins} mins</b> (${dist} km)`, { sticky: true, className: 'dark:bg-slate-800 dark:text-white dark:border-slate-700' }).openTooltip();
            },
            mouseout: (e: any) => {
                const l = e.target;
                l.setStyle(getLegStyle());
                l.closeTooltip();
            }
        });
    };

    const MapContainerAny = MapContainer as any;
    const TileLayerAny = TileLayer as any;
    const GeoJSONAny = GeoJSON as any;
    const MarkerAny = Marker as any;
    const TooltipAny = Tooltip as any;

    return (
        <div className="w-full h-full relative" style={height ? { height } : { height: "100%" }}>
            {/* Travel Mode Controls */}
            <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
                <div className="flex flex-col gap-1.5 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-md shadow-md border border-border backdrop-blur-md">
                    {[
                        { id: 'walk', icon: Footprints },
                        { id: 'drive', icon: Car },
                        { id: 'transit', icon: Bus },
                        { id: 'bicycle', icon: Bike }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setTravelMode(m.id as any)}
                            className={cn(
                                "p-1.5 rounded-sm transition-all",
                                travelMode === m.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <m.icon size={16} />
                        </button>
                    ))}
                </div>

                {routeData && !isLoading && (
                    <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-md shadow-md border border-border backdrop-blur-md flex flex-col gap-1 min-w-[90px]">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            <MapPin size={10} className="text-primary" />
                            {routeData.distance} km
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            <Clock size={10} className="text-primary" />
                            {routeData.time} mins
                        </div>
                    </div>
                )}
            </div>

            <MapContainerAny
                center={coords[0] || [0, 0]}
                zoom={13}
                style={{ width: "100%", height: "100%", borderRadius: height ? 6 : 0, zIndex: 0 }}
            >
                <TileLayerAny url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                <MapInvalidator />
                <MapClickHandler isAddingPin={isAddingPin} onMapClick={onMapClick} />
                {stops.map((stop, i) => (
                    stop.lat && stop.lng && (
                        <MarkerAny
                            key={`${stop.id}-${i}`}
                            position={[Number(stop.lat), Number(stop.lng)]}
                            icon={createNumberedIcon(stop, i, stop.category || 'none')}
                            eventHandlers={{
                                click: () => onMarkerClick?.(stop),
                            }}
                        >
                            <TooltipAny
                                direction="top"
                                offset={L.point(0, -10)}
                                opacity={1}
                                permanent={false}
                                className="!bg-white dark:!bg-slate-900 !border-gray-200 dark:!border-slate-700 !rounded-md !shadow-xl !p-0"
                            >
                                <div className="flex flex-col p-2 min-w-[140px] bg-white dark:bg-slate-900 rounded-md">
                                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 pb-1 mb-1 truncate">
                                        {stop.title}
                                    </span>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-3">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} className="text-indigo-500" />
                                            {stop.time || "N/A"}
                                        </div>
                                        <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                            {stop.price && stop.price > 0 ? `$${stop.price}` : "Free"}
                                        </div>
                                    </div>
                                </div>
                            </TooltipAny>
                        </MarkerAny>
                    )
                ))}

                {routeData?.geometry?.features?.[0] && (
                    <>
                        {routeData.geometry.features[0].properties.legs.map((leg: any, idx: number) => {
                            const legGeometry = {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: routeData.geometry.features[0].geometry.coordinates[idx]
                                },
                                properties: leg
                            };

                            return (
                                <GeoJSONAny
                                    key={`${travelMode}-${idx}-${stops.length}`}
                                    data={legGeometry}
                                    style={getLegStyle()}
                                    onEachFeature={(f: any, l: any) => onEachLeg(leg, l)}
                                />
                            );
                        })}
                    </>
                )}

                <AutoFitBounds points={coords} />
            </MapContainerAny>
        </div>
    );
}