import { useCallback } from 'react';

/**
 * Hook to generate and open Google Maps direction URLs
 */
export const useOpenInGoogleMaps = () => {
    const openDirections = useCallback((stopA: { lat: number; lng: number }, stopB: { lat: number; lng: number }, mode: string = 'walking') => {
        if (!stopA?.lat || !stopA?.lng || !stopB?.lat || !stopB?.lng) {
            console.warn("Incomplete coordinates provided for Google Maps directions.");
            return;
        }

        // travelmode mapping for Google Maps URL parameters
        // 'w' for walking, 'd' for driving, 't' for transit, 'b' for bicycling
        const modeMap: Record<string, string> = {
            walk: 'w',
            drive: 'd',
            transit: 't',
            bicycle: 'b'
        };

        const gMode = modeMap[mode] || 'w';

        // Construct the standard Google Maps directions URL
        const url = `https://www.google.com/maps/dir/?api=1&origin=${stopA.lat},${stopA.lng}&destination=${stopB.lat},${stopB.lng}&travelmode=${gMode}`;

        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    return { openDirections };
};