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
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        return new Promise((resolve) => {
            this._debouncedFetch(stops, mode, (result) => {
                if (result) this.cache.set(cacheKey, result);
                resolve(result);
            });
        });
    }

    async _executeFetch(stops, mode, resolve) {
        try {
            const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('|');
            const url = `${BASE_URL}?waypoints=${waypoints}&mode=${mode}&apiKey=${API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                console.error("[mapRouteService] API Error:", data.message);
                return resolve(null);
            }

            if (!data.features || data.features.length === 0) {
                console.warn("[mapRouteService] No route found for these coordinates.");
                return resolve(null);
            }

            resolve(this._formatResponse(data));
        } catch (err) {
            console.error("[mapRouteService] Internal Error:", err);
            resolve(null);
        }
    }

    _formatResponse(data) {
        const feature = data.features[0];
        const props = feature.properties;

        return {
            geometry: data,
            time: Math.round(props.time / 60),
            distance: (props.distance / 1000).toFixed(1),
            mode: props.mode
        };
    }
}

export const mapRouteService = new MapRouteService();