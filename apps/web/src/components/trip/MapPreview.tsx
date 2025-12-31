import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup, GeoJSON } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { Stop } from "@/lib/trips/trips-api";
import { getMapRoute, RouteData } from "@/lib/geo/geo-api";
import { Footprints, Car, Bus, Bike, Loader2, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/const/stop-categories";

// --- Leaflet Icon Fixes ---
// Note: We are using DivIcons for the stops, but standard Marker fixes 
// are kept for general Leaflet stability.
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Auto-fit map bounds when stops change
 */
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
    stops?: Stop[];
    height?: number;
};

export default function MapPreview({ stops = [], height = 420 }: MapPreviewProps) {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [travelMode, setTravelMode] = useState<'walk' | 'drive' | 'transit' | 'bicycle'>('walk');

    // Watch for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // Fetch route whenever stops or mode changes
    useEffect(() => {
        const fetchRoute = async () => {
            const validStops = stops.filter((s) => s.lat != null && s.lng != null);
            if (validStops.length < 2) { setRouteData(null); return; }

            setIsLoading(true);
            try {
                const formattedStops = validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
                const data = await getMapRoute(formattedStops, travelMode);
                setRouteData(data);
            } catch (error) {
                console.error("Routing Error:", error);
                setRouteData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoute();
    }, [stops, travelMode]);

    /**
     * Creates a numbered marker using Tailwind colors from CATEGORY_CONFIG
     */
    const createNumberedIcon = (index: number, categoryId: string): L.DivIcon => {
        const config = CATEGORY_CONFIG[categoryId as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.none;
        const bgColorClass = config.color.split(' ')[0];
        const textColorClass = config.color.split(' ')[1];

        return L.divIcon({
            className: "custom-div-icon",
            html: `
            <div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-md ${bgColorClass}">
                <span class="text-[10px] font-bold ${textColorClass}">${index + 1}</span>
            </div>
        `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    };

    const coords: LatLngTuple[] = stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => [Number(s.lat), Number(s.lng)] as LatLngTuple);

    /**
     * Mode-aware line styling
     */
    const getLegStyle = () => ({
        color: isDark ? "#38bdf8" : "#2563eb",
        weight: 5,
        opacity: 0.8,
        // Visual cue: walking routes are dashed
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
                l.bindTooltip(`<b>${mins} mins</b> (${dist} km)`, { sticky: true }).openTooltip();
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

    return (
        <div
            className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 relative"
            style={{ height, zIndex: 1 }}
        >
            {/* Overlay Group: Mode Switcher & Total Stats */}
            <div className="absolute top-6 right-6 z-[1000] flex flex-col items-end gap-2">
                {/* Mode Control Panel */}
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
                                travelMode === m.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <m.icon size={16} />
                        </button>
                    ))}
                </div>

                {/* Journey Stats HUD */}
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

            {/* Sync Status Overlay */}
            {isLoading && (
                <div className="absolute top-6 left-6 z-[1000] flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 px-3 py-1.5 rounded-md border text-[10px] font-bold tracking-widest text-primary shadow-sm">
                    <Loader2 size={12} className="animate-spin" />
                    SYNCING ROUTE...
                </div>
            )}

            <MapContainerAny
                center={coords[0] || [0, 0]}
                zoom={13}
                style={{ width: "100%", height: "100%", borderRadius: 6, zIndex: 0 }}
            >
                <TileLayerAny url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />

                {/* Categorical & Numbered Markers */}
                {stops.map((stop, i) => (
                    stop.lat && stop.lng && (
                        <MarkerAny
                            key={`${stop.id}-${i}`}
                            position={[Number(stop.lat), Number(stop.lng)]}
                            icon={createNumberedIcon(i, stop.category || 'none')}
                        >
                            <Popup><div className="text-xs font-medium">Stop {i + 1}: {stop.title}</div></Popup>
                        </MarkerAny>
                    )
                ))}

                {/* Road-snapped Journey Legs */}
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