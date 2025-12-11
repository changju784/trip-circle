import React from "react";
import MapPreview from "./MapPreview";

export default function RoutePreview({ city, stops }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">🗺️ Route Preview</h3>
            <div className="text-sm text-muted-foreground dark:text-gray-300 mb-3">
                Live map of your stops
            </div>

            <MapPreview
                stops={stops}
                height={420}
            />
        </div>
    );
}
