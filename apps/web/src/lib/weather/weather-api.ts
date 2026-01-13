/**
 * Weather API module
 * Interfaces with the backend proxy to fetch weather forecasts and historical data.
 */

import { apiGet } from "../api";

export interface WeatherData {
    status: 'success' | 'unavailable' | 'error';
    dataType?: 'history' | 'forecast';
    temp?: number;
    condition?: string;
    icon?: string;
    high?: number;
    low?: number;
    description?: string;
    message?: string; // Used for "unavailable" or "error" states
}

/**
 * Fetch weather for a specific city and date
 * @param city - The name of the city (e.g., "Boston")
 * @param date - The date in YYYY-MM-DD format
 */
export async function getTripWeather(city: string, date: string): Promise<WeatherData> {
    if (!city || !date) {
        return {
            status: 'error',
            message: 'City and date are required for weather lookups.'
        };
    }

    try {
        // We use the same apiGet wrapper as your geo-api to handle auth headers/base URLs
        return await apiGet<WeatherData>(
            `/api/weather?city=${encodeURIComponent(city)}&date=${date}`
        );
    } catch (error: any) {
        console.error("Weather API Fetch Error:", error);
        return {
            status: 'error',
            message: error.message || 'Failed to connect to weather service.'
        };
    }
}