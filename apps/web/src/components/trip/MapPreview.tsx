import React from "react";
import { Stop } from "../../lib/tripStorage";

type MapPreviewProps = {
    stops?: Stop[];
    height?: number;
    fallbackCity?: string;
};

export default function MapPreview({ stops = [], height = 420, fallbackCity }: MapPreviewProps) {
    const firstWithCoords = stops.find((s) => s.lat != null && s.lng != null);
    if (!firstWithCoords) {
        return (
            <div className="w-full h-full bg-white rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground" style={{ height }}>
                <div className="text-center">Add stops to see them on the map</div>
            </div>
        );
    }

    const lat = firstWithCoords.lat as number;
    const lng = firstWithCoords.lng as number;
    const delta = 0.05;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

    return (
        <div className="w-full bg-white rounded-lg shadow-sm p-3" style={{ height }}>
            <iframe
                title="map"
                width="100%"
                height={height - 10}
                frameBorder="0"
                scrolling="no"
                src={src}
                style={{ borderRadius: 8 }}
            />
        </div>
    );
}
