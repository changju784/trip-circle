import express from 'express';
import { searchLocations, searchCities } from '../services/geoService.js';

const router = express.Router();

router.get('/search', async (req, res) => {
    const { q, type } = req.query;

    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        // If the frontend asks for cities, use GeoDB; otherwise default to OSM
        if (type === 'city') {
            const results = await searchCities(q);
            return res.json(results);
        }

        const results = await searchLocations(q);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;