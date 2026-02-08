import express from 'express';
import { searchLocations, searchCities } from '../services/geoService.js';
import { mapRouteService } from '../services/mapRouteService.js';

const router = express.Router();

router.get('/search', async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Search for locations or cities'
    // #swagger.description = 'Fetches location data from GeoDB (cities) or Photon (locations).'
    const { q, type, destinations } = req.query;

    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        // Handle City Search (GeoDB)
        if (type === 'city') {
            const results = await searchCities(q);
            return res.json(results);
        }

        // Parse destinations context for Location Search (Photon)
        let parsedDestinations = [];
        if (destinations) {
            try {
                parsedDestinations = JSON.parse(destinations);
            } catch (e) {
                console.error("Failed to parse destinations context:", e);
            }
        }

        const results = await searchLocations(q, parsedDestinations);
        res.json(results);
    } catch (error) {
        console.error("Search Route Error:", error);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.get('/reverse', async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Reverse Geocoding'
    // #swagger.description = 'Converts latitude and longitude into a human-readable address.'
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Missing coordinates" });
    }

    try {
        const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
        if (!result) {
            return res.status(404).json({ error: "Location not found" });
        }
        res.json(result);
    } catch (error) {
        console.error("Reverse Route Error:", error);
        res.status(500).json({ error: 'Reverse geocoding failed' });
    }
});

router.post('/route', async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Calculate Map Route'
    // #swagger.description = 'Generates routing data for a sequence of stops.
    try {
        const { stops, mode } = req.body;

        if (!stops || stops.length < 2) {
            return res.status(400).json({ error: "At least two stops are required." });
        }

        const routeData = await mapRouteService.getRoute(stops, mode);

        if (!routeData) {
            return res.status(500).json({ error: "Failed to fetch route" });
        }

        res.json(routeData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;