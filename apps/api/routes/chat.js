import express from 'express';
import authMiddleware from '../middleware/auth.js';
import * as chatService from '../services/chatService.js';

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/chat/sessions:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/sessions', async (req, res) => {
    try {
        const session = await chatService.createSession(req.user.userId);
        res.status(201).json(session);
    } catch (error) {
        console.error('[Chat] createSession error:', error);
        res.status(500).json({ message: 'Failed to create chat session' });
    }
});

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: List all chat sessions for the current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await chatService.getSessions(req.user.userId);
        res.json(sessions);
    } catch (error) {
        console.error('[Chat] getSessions error:', error);
        res.status(500).json({ message: 'Failed to fetch sessions' });
    }
});

/**
 * @swagger
 * /api/chat/sessions/{id}:
 *   get:
 *     summary: Get a specific chat session with full message history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session with messages
 *       404:
 *         description: Session not found
 */
router.get('/sessions/:id', async (req, res) => {
    try {
        const session = await chatService.getSession(req.params.id, req.user.userId);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (error) {
        console.error('[Chat] getSession error:', error);
        res.status(500).json({ message: 'Failed to fetch session' });
    }
});

/**
 * @swagger
 * /api/chat/sessions/{id}/messages:
 *   post:
 *     summary: Send a message and receive an AI response
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message text
 *     responses:
 *       200:
 *         description: AI response with tool usage metadata
 *       400:
 *         description: Missing message
 *       404:
 *         description: Session not found
 */
router.post('/sessions/:id/messages', async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ message: 'message is required' });
    }

    try {
        const result = await chatService.sendMessage(
            req.params.id,
            req.user.userId,
            message.trim()
        );
        if (!result) return res.status(404).json({ message: 'Session not found' });
        res.json(result);
    } catch (error) {
        console.error('[Chat] sendMessage error:', error);

        if (error.status === 429) {
            const retryInfo = error.errorDetails?.find(d =>
                d['@type']?.includes('RetryInfo')
            );
            const retryAfterSeconds = retryInfo?.retryDelay
                ? parseInt(retryInfo.retryDelay, 10)
                : 60;
            return res.status(429).json({
                message: 'The AI is rate limited. Please try again shortly.',
                retryAfterSeconds
            });
        }

        res.status(500).json({ message: 'Failed to process message' });
    }
});

/**
 * @swagger
 * /api/chat/sessions/{id}:
 *   delete:
 *     summary: Delete a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted
 *       404:
 *         description: Session not found
 */
router.delete('/sessions/:id', async (req, res) => {
    try {
        const deleted = await chatService.deleteSession(req.params.id, req.user.userId);
        if (!deleted) return res.status(404).json({ message: 'Session not found' });
        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('[Chat] deleteSession error:', error);
        res.status(500).json({ message: 'Failed to delete session' });
    }
});

export default router;
