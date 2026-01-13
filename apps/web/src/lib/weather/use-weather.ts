import { useState, useEffect } from "react";
import { getTripWeather, WeatherData } from "./weather-api";

export function useWeather(city: string | undefined, date: string | undefined) {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch if we have both city and date
        if (!city || !date) return;

        let isMounted = true;
        const fetchDate = date.split('T')[0];

        async function load() {
            try {
                setLoading(true);
                const res = await getTripWeather(city, fetchDate);
                if (isMounted) {
                    setData(res);
                    setError(res.status === 'error' ? res.message || 'Error' : null);
                }
            } catch (err) {
                if (isMounted) setError("Failed to fetch weather");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();
        return () => { isMounted = false; };
    }, [city, date]);

    return { data, loading, error };
}