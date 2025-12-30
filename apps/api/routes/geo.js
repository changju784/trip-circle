import express from 'express';
import { searchLocations, searchCities } from '../services/geoService.js';

const router = express.Router();

router.get('/search', async (req, res) => {
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

export default router;