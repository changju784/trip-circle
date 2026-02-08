import express from 'express';
import { weatherService } from '../services/weatherService.js';
import { weatherRateLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Apply limiter to all weather requests
router.use(weatherRateLimiter);

/**
 * GET /api/weather
 * Query Params: city (string), date (YYYY-MM-DD)
 */
router.get('/', async (req, res) => {
    // #swagger.tags = ['External Services']
    // #swagger.summary = 'Get weather for a trip'
    // #swagger.description = 'Fetches weather data for a specific city and date.'
    let { city, date } = req.query;

    // 1. Validation & Sanitization
    if (!city || !date) {
        return res.status(400).json({
            error: 'Missing required parameters: city and date are required.'
        });
    }

    // Ensure date is only YYYY-MM-DD even if a full timestamp is sent
    const formattedDate = date.split('T')[0];

    try {
        const result = await weatherService.getTripWeather(city, formattedDate);

        // 2. Handle 'Unavailable' (Dates too far in future)
        if (result.status === 'unavailable') {
            return res.json({
                status: 'unavailable',
                message: result.message,
                dataType: 'none'
            });
        }

        // 3. Handle Service-level Errors (API limits, invalid keys)
        if (result.status === 'error') {
            return res.status(502).json({ error: result.message }); // 502 = Bad Gateway (Upstream API failed)
        }

        // 4. Success
        res.json(result);

    } catch (error) {
        console.error("Weather Route Error:", error);
        res.status(500).json({ error: 'Internal server error fetching weather data.' });
    }
});

export default router;