import express from 'express';
import { chatWithAI } from '../services/aiService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required." });
        }

        const result = await chatWithAI(messages);
        res.json(result);

    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({
            error: "Failed to process chat request.",
            details: error.message
        });
    }
});

export default router;
