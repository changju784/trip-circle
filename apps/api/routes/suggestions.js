import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getSuggestions } from '../services/suggestionService.js';

const router = express.Router();

/**
 * GET /api/suggestions
 * Query params:
 *   lat      {number} required
 *   lng      {number} required
 *   radius   {number} meters, default 5000
 *   limit    {number} max 20, default 10
 *   kinds    {string} OpenTripMap kinds filter, default 'interesting_places'
 *
 * Returns array of suggestion objects ready to pre-fill a stop modal.
 */
router.get('/', authMiddleware, async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Get place suggestions near a coordinate'
    const { lat, lng, radius, limit, kinds } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    try {
        const suggestions = await getSuggestions({
            lat: parsedLat,
            lng: parsedLng,
            radius: radius ? parseInt(radius) : 5000,
            limit: limit ? parseInt(limit) : 10,
            kinds: kinds || 'interesting_places',
        });

        res.json({ suggestions });
    } catch (error) {
        console.error('Suggestion route error:', error.message);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

export default router;
