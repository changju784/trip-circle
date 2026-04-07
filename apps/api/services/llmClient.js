import OpenAI from 'openai';
import logger from '../config/logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Send a chat completion request to OpenAI.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @param {string} [options.model]
 * @param {number} [options.temperature]
 * @param {number} [options.max_tokens]
 * @returns {Promise<string>} assistant message content
 */
export async function chatCompletion(messages, options = {}) {
  const { model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 1024 } = options;
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    });
    return response.choices[0].message.content;
  } catch (err) {
    logger.error('OpenAI API error:', err.message);
    throw err;
  }
}
