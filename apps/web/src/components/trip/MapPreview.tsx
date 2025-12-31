import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup, GeoJSON } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { Stop } from "@/lib/trips/trips-api";
import { getMapRoute, RouteData } from "@/lib/geo/geo-api";

// --- Leaflet Icon Fixes ---
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Auto-fit map bounds when stops change
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
    mode?: 'walk' | 'drive' | 'transit';
};

export default function MapPreview({
    stops = [],
    height = 420,
    mode = 'walk'
}: MapPreviewProps) {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    // State for routing data and UI feedback
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Watch for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // --- EFFECT: Fetch the real road path from our new endpoint ---
    useEffect(() => {
        const fetchRoute = async () => {
            // Filter out stops that don't have valid coordinates yet
            const validStops = stops.filter((s) => s.lat != null && s.lng != null);

            // Need at least 2 points to draw a route
            if (validStops.length < 2) {
                setRouteData(null);
                return;
            }

            setIsLoading(true);
            try {
                const formattedStops = validStops.map((s) => ({
                    lat: Number(s.lat),
                    lng: Number(s.lng),
                }));

                const data = await getMapRoute(formattedStops, mode);
                setRouteData(data);
            } catch (error) {
                console.error("MapPreview: Error fetching road route", error);
                // We keep routeData as null so it falls back to straight lines
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoute();
    }, [stops, mode]); // Re-run whenever stops are added/deleted/moved or mode changes

    const coords: LatLngTuple[] = stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => [Number(s.lat), Number(s.lng)] as LatLngTuple);

    const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileAttribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : "&copy; OpenStreetMap contributors";

    if (coords.length === 0) {
        return (
            <div
                className="w-full rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                style={{ height }}
            >
                <div className="text-center text-sm">Add stops to see your route preview</div>
            </div>
        );
    }

    const mapHeight = Math.max(200, height - (routeData ? 60 : 20));
    const defaultCenter: LatLngTuple = coords[0] || [51.505, -0.09];

    // Using "Any" for these specific components to bypass legacy TS definition issues in some Leaflet versions
    const MapContainerAny = MapContainer as any;
    const TileLayerAny = TileLayer as any;
    const GeoJSONAny = GeoJSON as any;

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700" style={{ height, position: "relative", zIndex: 0 }}>

            {/* Loading Indicator Overlay */}
            {isLoading && (
                <div className="absolute top-5 right-5 z-[1000] bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full shadow-md text-[10px] font-bold tracking-wider animate-pulse border border-indigo-200 dark:border-indigo-800">
                    CALCULATING ROUTE...
                </div>
            )}

            <MapContainerAny
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ width: "100%", height: mapHeight, borderRadius: 8, position: "relative", zIndex: 1 }}
            >
                <TileLayerAny
                    key={isDark ? "dark" : "light"}
                    url={tileUrl}
                    attribution={tileAttribution}
                />

                {/* Markers with Stop numbering */}
                {coords.map((pos, i) => (
                    <Marker key={`${i}-${pos[0]}`} position={pos}>
                        <Popup>
                            <div className="text-sm font-semibold">
                                Stop {i + 1}: {stops[i].title || "Untitled Stop"}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* 1. If we have road data (GeoJSON), draw it. 
                  2. If not (fallback/loading), draw a dashed straight line.
                */}
                {routeData?.geometry ? (
                    <GeoJSONAny
                        key={JSON.stringify(routeData.geometry)} // Key ensures it redraws on geometry change
                        data={routeData.geometry}
                        style={{
                            color: isDark ? "#38bdf8" : "#2563eb",
                            weight: 4,
                            opacity: 0.8
                        }}
                    />
                ) : (
                    coords.length > 1 && (
                        <Polyline
                            pathOptions={{
                                color: isDark ? "#38bdf8" : "blue",
                                weight: 2,
                                dashArray: '5, 10', // Dash array signals this is an estimate/fallback
                                opacity: 0.5
                            }}
                            positions={coords}
                        />
                    )
                )}

                <AutoFitBounds points={coords} />
            </MapContainerAny>

            {/* Travel Summary Bar */}
            {routeData && !isLoading && (
                <div className="mt-3 flex items-center justify-between px-2 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold">Distance</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{routeData.distance} km</span>
                    </div>
                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold">Est. Time ({mode})</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{routeData.time} mins</span>
                    </div>
                </div>
            )}
        </div>
    );
}