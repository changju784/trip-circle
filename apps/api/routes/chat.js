import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { processChat } from '../services/chatService.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/chat
 *
 * Body:
 *   { messages: Array<{ role: "user" | "assistant", content: string }> }
 *
 * Returns:
 *   { reply: string }
 */
router.post('/', authMiddleware, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  const valid = messages.every(
    m =>
      m &&
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      ['user', 'assistant'].includes(m.role)
  );
  if (!valid) {
    return res
      .status(400)
      .json({ error: 'Each message must have role ("user"|"assistant") and content (string)' });
  }

  // Cap history to prevent runaway token usage
  const trimmedMessages = messages.slice(-20);

  try {
    const result = await processChat({
      userId: req.user.userId,
      userTripIds: req.user.trips || [],
      messages: trimmedMessages,
    });
    res.json(result);
  } catch (err) {
    logger.error('Chat route error:', err.message);
    res.status(500).json({ error: 'Chat request failed', details: err.message });
  }
});

export default router;
