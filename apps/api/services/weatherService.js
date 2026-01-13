/**
 * weatherService.js
 * 15-day forecasts while gracefully failing for dates too far in the future.
 */

const API_KEY = process.env.WEATHER_VISUAL_CROSSING_API_KEY;
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

export const weatherService = {
    /**
     * Main entry point to get weather for a trip.
     * @param {string} city - The city name (e.g., "Paris" or "Tokyo")
     * @param {string} date - ISO format "YYYY-MM-DD"
     */
    async getTripWeather(city, date) {
        try {
            const { isAvailable, type } = this.getDateStatus(date);

            // 1. Check if the date is beyond the free-tier forecast window
            if (!isAvailable) {
                return {
                    status: 'unavailable',
                    message: 'Forecast only available within 15 days of today.'
                };
            }

            // 2. Visual Crossing URL Construction
            // Format: [location]/[date1]
            const url = `${BASE_URL}/${encodeURIComponent(city)}/${date}?unitGroup=metric&key=${API_KEY}&contentType=json`;

            const response = await fetch(url);

            if (!response.ok) {
                // Handle specific status codes if needed
                if (response.status === 401) throw new Error("Invalid API Key");
                if (response.status === 429) throw new Error("Daily API limit reached");
                throw new Error(`Weather API Error: ${response.status}`);
            }

            const data = await response.json();

            // Check if days array exists and has data
            if (!data.days || data.days.length === 0) {
                throw new Error("No weather data found for this location/date.");
            }

            const dayData = data.days[0];

            // 3. Normalized return object for the UI
            return {
                status: 'success',
                dataType: type, // 'history' or 'forecast'
                temp: dayData.temp,
                condition: dayData.conditions,
                icon: dayData.icon,
                high: dayData.tempmax,
                low: dayData.tempmin,
                description: dayData.description || "Historical weather record for this date."
            };

        } catch (error) {
            console.error("weatherService Error:", error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    /**
     * Determines if a date is historical, forecastable, or unavailable.
     */
    getDateStatus(date) {
        const tripDate = new Date(date);
        const today = new Date();

        // Reset hours for clean day-to-day comparison
        today.setHours(0, 0, 0, 0);
        tripDate.setHours(0, 0, 0, 0);

        const diffTime = tripDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { isAvailable: true, type: 'history' };
        } else if (diffDays <= 15) {
            return { isAvailable: true, type: 'forecast' };
        } else {
            return { isAvailable: false, type: 'future' };
        }
    }
};