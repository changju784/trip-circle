import Trip from '../schema/TripSchema.js';
import { chatCompletion } from './llmClient.js';
import { buildSystemPrompt } from './prompts.js';
import logger from '../config/logger.js';

/**
 * Process one chat turn for the authenticated user.
 * @param {object} params
 * @param {string} params.userId - authenticated user's ObjectId string (for logging)
 * @param {Array<string>} params.userTripIds - trip ObjectIds from req.user.trips
 * @param {Array<{role: string, content: string}>} params.messages - conversation history
 * @returns {Promise<{ reply: string }>}
 */
export async function processChat({ userId, userTripIds, messages }) {
  // 1. Fetch the user's own trips for context
  const userTrips = await Trip.find(
    { _id: { $in: userTripIds } },
    'title description startDate endDate destinations tags'
  ).lean();

  // 2. Search public trips using the latest user message as the query
  const latestUserMessage =
    [...messages].reverse().find(m => m.role === 'user')?.content || '';

  let publicTrips = [];
  if (latestUserMessage.trim()) {
    publicTrips = await Trip.find(
      { isPublic: true, $text: { $search: latestUserMessage } },
      { score: { $meta: 'textScore' }, title: 1, description: 1, destinations: 1, tags: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .lean();
  }

  // 3. Build system prompt with injected context
  const systemPrompt = buildSystemPrompt(userTrips, publicTrips);
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  // 4. Call the LLM
  logger.info(`Chat request — user: ${userId}, history length: ${messages.length}, public trips found: ${publicTrips.length}`);
  const reply = await chatCompletion(fullMessages);

  return { reply };
}
