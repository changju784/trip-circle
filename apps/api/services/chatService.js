import ChatSession from '../schema/ChatSchema.js';
import { sendChatMessage, generateSessionTitle } from '../utils/aiChat.js';

/**
 * Creates a new empty chat session for a user.
 */
export async function createSession(userId) {
    const session = await ChatSession.create({
        userId,
        title: 'New Chat',
        messages: [],
        context: { referencedTripIds: [], createdTripIds: [] }
    });
    return session;
}

/**
 * Returns all chat sessions for a user (summary only, no messages).
 */
export async function getSessions(userId) {
    return ChatSession.find({ userId })
        .sort({ updatedAt: -1 })
        .select('title context createdAt updatedAt')
        .lean();
}

/**
 * Returns a single chat session including full message history.
 */
export async function getSession(sessionId, userId) {
    return ChatSession.findOne({ _id: sessionId, userId }).lean();
}

/**
 * Sends a user message in a session, runs the Gemini agentic loop,
 * persists the full history delta, and returns the assistant's response.
 *
 * @returns {{ sessionId, responseText, toolsUsed, createdTripIds }}
 */
export async function sendMessage(sessionId, userId, userMessage) {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) return null;

    // Build OpenAI-compatible history from stored messages.
    // Strip the per-message timestamp (not an OpenAI field) before passing in.
    const history = session.messages.map(({ role, content, tool_calls, tool_call_id }) => {
        const msg = { role, content: content ?? null };
        if (tool_calls?.length) msg.tool_calls = tool_calls;
        if (tool_call_id) msg.tool_call_id = tool_call_id;
        return msg;
    });

    const { responseText, toolsUsed, createdTripIds, suggestedTrips, historyDelta } =
        await sendChatMessage(history, userMessage, userId.toString());

    // Auto-title the session from the first exchange using AI summarization
    const isFirstMessage = session.messages.length === 0 && session.title === 'New Chat';
    if (isFirstMessage) {
        try {
            session.title = await generateSessionTitle(userMessage, responseText);
        } catch {
            session.title = userMessage.slice(0, 60).trim();
        }
    }

    // Persist all new turns with timestamps
    const now = new Date();
    for (const entry of historyDelta) {
        session.messages.push({ ...entry, timestamp: now });
    }

    // Track trip IDs touched during this turn
    if (createdTripIds.length > 0) {
        session.context.createdTripIds.push(...createdTripIds);
    }

    // Collect trip IDs returned by search/detail tools
    const referencedIds = toolsUsed
        .flatMap(t => {
            if (t.name === 'get_trip_details') return [t.args.tripId];
            return [];
        })
        .filter(Boolean);

    if (referencedIds.length > 0) {
        session.context.referencedTripIds.push(...referencedIds);
    }

    await session.save();

    return {
        sessionId: session._id,
        title: session.title,
        responseText,
        toolsUsed,
        createdTripIds,
        suggestedTrips
    };
}

/**
 * Deletes a chat session owned by the user.
 */
export async function deleteSession(sessionId, userId) {
    const result = await ChatSession.findOneAndDelete({ _id: sessionId, userId });
    return result !== null;
}
