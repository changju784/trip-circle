import React from "react";
import MapPreview from "./MapPreview";

export default function RoutePreview({ city, stops }) {
    return (
        <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium mb-2">🗺️ Route Preview</h3>
            <div className="text-sm text-muted-foreground mb-3">
                Live map of your stops
            </div>

            <MapPreview
                stops={stops}
                height={420}
                fallbackCity={city}
            />
        </div>
    );
}
