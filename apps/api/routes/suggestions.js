import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getSuggestions } from '../services/suggestionService.js';

const router = express.Router();

/**
 * GET /api/suggestions
 * Query params:
 *   lat      {number} optional (required if no city)
 *   lng      {number} optional (required if no city)
 *   city     {string} optional fallback when no lat/lng (destination label)
 *   radius   {number} meters, default 5000
 *   limit    {number} max 20, default 10
 *   kinds    {string} OpenTripMap kinds filter, default 'interesting_places'
 */
router.get('/', authMiddleware, async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Get place suggestions near a coordinate or city'
    const { lat, lng, city, radius, limit, kinds } = req.query;

    if ((!lat || !lng) && !city) {
        return res.status(400).json({ error: 'Provide lat+lng or city' });
    }

    try {
        const suggestions = await getSuggestions({
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            city: city || null,
            radius: radius ? parseInt(radius) : 5000,
            limit: limit ? parseInt(limit) : 10,
            kinds: kinds || 'interesting_places',
        });

        res.json({ suggestions });
    } catch (error) {
        console.error('Suggestion route error:', error.message, error.stack);
        const status = error.status === 429 ? 429 : 500;
        const message = status === 429 ? 'Too many requests to suggestions API, please try again shortly' : 'Failed to fetch suggestions';
        const body = { error: message };
        if (process.env.NODE_ENV !== 'production') body.detail = error.message;
        res.status(status).json(body);
    }
});

export default router;
