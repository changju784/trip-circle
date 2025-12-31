// services/mapRouteService.js
import _ from 'lodash';

const API_KEY = process.env.GEOAPIFY_API_KEY;
const BASE_URL = 'https://api.geoapify.com/v1/routing';

class MapRouteService {
    constructor() {
        this.cache = new Map();
        this._debouncedFetch = _.debounce(this._executeFetch.bind(this), 500);
    }

    async getRoute(stops, mode = 'walk') {
        const cacheKey = JSON.stringify({ stops, mode });

        if (this.cache.has(cacheKey)) {
            console.log("[mapRouteService] Returning cached route");
            return this.cache.get(cacheKey);
        }

        return new Promise((resolve) => {
            this._debouncedFetch(stops, mode, (result) => {
                if (result && !result.error) {
                    this.cache.set(cacheKey, result);
                }
                resolve(result);
            });
        });
    }

    async _executeFetch(stops, mode, resolve) {
        const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('|');
        const url = `${BASE_URL}?waypoints=${waypoints}&mode=${mode}&apiKey=${API_KEY}`;

        try {
            console.log(`[mapRouteService] Fetching ${mode} route...`);
            const response = await fetch(url);

            if (response.status === 429) {
                console.error("Rate limit hit! Slowing down...");
                return resolve({ error: "Rate limit exceeded" });
            }

            const data = await response.json();
            resolve(this._formatResponse(data));
        } catch (err) {
            console.error("Routing Service Error:", err);
            resolve(null);
        }
    }

    _formatResponse(data) {
        const props = data.features[0].properties;
        return {
            geometry: data,
            time: Math.round(props.time / 60), // Convert to minutes
            distance: (props.distance / 1000).toFixed(1), // Convert to km
            mode: props.mode
        };
    }
}

export const mapRouteService = new MapRouteService();