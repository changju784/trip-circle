import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { Stop } from "@/lib/trips/trips-api";

// Setup default Leaflet marker icons from node_modules
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
// Alternative: Use public folder URLs
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
};

export default function MapPreview({ stops = [], height = 420 }: MapPreviewProps) {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    // Watch for theme changes so the tile layer can swap to a darker style
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

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
                className="w-full h-full rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                style={{ height }}
            >
                <div className="text-center">Add stops to see them on the map</div>
            </div>
        );
    }

    const mapHeight = Math.max(200, height - 20);
    const defaultCenter: LatLngTuple = coords[0] || [51.505, -0.09];

    const MapContainerAny = MapContainer as any;
    const TileLayerAny = TileLayer as any;

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700" style={{ height, position: "relative", zIndex: 0 }}>
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

                {/* Markers */}
                {coords.map((pos, i) => (
                    <Marker key={i} position={pos}>
                        <Popup>
                            <div className="text-sm">Stop {i + 1}</div>
                        </Popup>
                    </Marker>
                ))}

                {/* Route line connecting stops */}
                {coords.length > 1 && (
                    <Polyline
                        pathOptions={{ color: isDark ? "#38bdf8" : "blue", weight: 2 }}
                        positions={coords}
                    />
                )}

                <AutoFitBounds points={coords} />
            </MapContainerAny>
        </div>
    );
}
