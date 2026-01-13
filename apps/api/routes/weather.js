import express from 'express';
import { weatherService } from '../services/weatherService.js';

const router = express.Router();

/**
 * GET /api/weather
 * Query Params: city (string), date (YYYY-MM-DD)
 */
router.get('/', async (req, res) => {
    const { city, date } = req.query;

    // Validation
    if (!city || !date) {
        return res.status(400).json({
            error: 'Missing required parameters: city and date (YYYY-MM-DD) are required.'
        });
    }

    try {
        const result = await weatherService.getTripWeather(city, date);

        if (result.status === 'unavailable') {
            // 200 OK because the request was valid, but data isn't available yet
            return res.json(result);
        }

        if (result.status === 'error') {
            return res.status(500).json({ error: result.message });
        }

        res.json(result);
    } catch (error) {
        console.error("Weather Route Error:", error);
        res.status(500).json({ error: 'Internal server error fetching weather data.' });
    }
});

export default router;