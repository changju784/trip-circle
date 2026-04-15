import OpenAI from "openai";
import { exploreTrips } from '../services/tripSearchService.js';
import { createTrip } from '../services/tripService.js';
import Trip from '../schema/TripSchema.js';
import { TripTagsEnum } from '../schema/const/TripConstants.js';
import { SYSTEM_PROMPT } from './chatPrompt.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
const MODEL_NAME = "gpt-5.4-mini";

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_public_trips',
            description: 'Search for public travel plans on TripCircle by keyword (destination, title) and/or tags.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Free-text search query, e.g. "Tokyo" or "beach vacation"'
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: `Filter by tags. Valid values: ${TripTagsEnum.join(', ')}`
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of results to return (default 5, max 20)'
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_trip_details',
            description: 'Get the full day-by-day itinerary and details of a specific public trip by its ID.',
            parameters: {
                type: 'object',
                properties: {
                    tripId: {
                        type: 'string',
                        description: 'The trip ID returned from search_public_trips'
                    }
                },
                required: ['tripId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_user_trips',
            description: "Fetch the current user's own saved trips (including private ones).",
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Maximum number of results (default 10)'
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_trip',
            description: 'Create a new trip for the current user. Only call this after the user has confirmed they want to create a trip and you have gathered the necessary details.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Trip title, e.g. "5 Days in Tokyo"'
                    },
                    description: {
                        type: 'string',
                        description: 'Short description of the trip'
                    },
                    destinations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'Place name, e.g. "Tokyo, Japan"' },
                                lat: { type: 'number' },
                                lng: { type: 'number' }
                            }
                        },
                        description: 'List of destinations'
                    },
                    startDate: {
                        type: 'string',
                        description: 'Start date in ISO format YYYY-MM-DD'
                    },
                    endDate: {
                        type: 'string',
                        description: 'End date in ISO format YYYY-MM-DD'
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: `Trip style/vibe tags. Valid values: ${TripTagsEnum.join(', ')}`
                    },
                    isPublic: {
                        type: 'boolean',
                        description: 'Whether to share this trip publicly on the platform (default false)'
                    }
                },
                required: ['title', 'startDate', 'endDate']
            }
        }
    }
];

async function executeTool(toolName, args, userId) {
    switch (toolName) {
        case 'search_public_trips': {
            const results = await exploreTrips({
                q: args.query || '',
                tags: args.tags || [],
                limitNum: Math.min(args.limit || 5, 20)
            });
            return {
                count: results.length,
                trips: results.map(t => ({
                    id: t._id,
                    title: t.title,
                    description: t.description,
                    destinations: t.destinations?.map(d => d.label),
                    startDate: t.startDate,
                    endDate: t.endDate,
                    tags: t.tags,
                    thumbnail: t.thumbnail
                }))
            };
        }

        case 'get_trip_details': {
            const trip = await Trip.findOne({
                _id: args.tripId,
                $or: [{ isPublic: true }, { members: userId }]
            })
                .select('title description destinations days startDate endDate tags totalPrice budget thumbnail')
                .lean();

            if (!trip) return { error: 'Trip not found or access denied.' };

            return {
                id: trip._id,
                title: trip.title,
                description: trip.description,
                destinations: trip.destinations?.map(d => ({ label: d.label, lat: d.lat, lng: d.lng })),
                startDate: trip.startDate,
                endDate: trip.endDate,
                tags: trip.tags,
                totalPrice: trip.totalPrice,
                budget: trip.budget,
                days: trip.days?.map(d => ({
                    date: d.date,
                    stops: d.stops?.map(s => ({
                        title: s.title,
                        category: s.category,
                        time: s.time,
                        locationName: s.locationName,
                        price: s.price,
                        description: s.description
                    }))
                }))
            };
        }

        case 'get_user_trips': {
            const trips = await Trip.find({ members: userId })
                .sort({ dateCreated: -1 })
                .limit(args.limit || 10)
                .select('title description destinations startDate endDate tags isPublic thumbnail dateCreated')
                .lean();

            return {
                count: trips.length,
                trips: trips.map(t => ({
                    id: t._id,
                    title: t.title,
                    destinations: t.destinations?.map(d => d.label),
                    startDate: t.startDate,
                    endDate: t.endDate,
                    tags: t.tags,
                    isPublic: t.isPublic
                }))
            };
        }

        case 'create_trip': {
            const trip = await createTrip({
                title: args.title,
                description: args.description || '',
                destinations: args.destinations || [],
                startDate: args.startDate,
                endDate: args.endDate,
                tags: args.tags || [],
                isPublic: args.isPublic ?? false,
                members: [userId]
            });
            return {
                success: true,
                tripId: trip._id,
                title: trip.title
            };
        }

        default:
            return { error: `Unknown tool: ${toolName}` };
    }
}

/**
 * Normalises a raw trip object (from any tool) into the card shape
 * the frontend needs to render a TripCard component.
 */
function toTripCard(trip) {
    return {
        id: trip.id?.toString() ?? trip._id?.toString(),
        title: trip.title,
        description: trip.description ?? null,
        destinations: (trip.destinations ?? []).map(d =>
            typeof d === 'string' ? d : d.label
        ),
        startDate: trip.startDate ?? null,
        endDate: trip.endDate ?? null,
        tags: trip.tags ?? [],
        thumbnail: trip.thumbnail ?? null,
        totalPrice: trip.totalPrice ?? null,
        isPublic: trip.isPublic ?? null
    };
}

/**
 * Generates a concise 4-7 word title for a chat session based on the first exchange.
 */
export async function generateSessionTitle(userMessage, responseText) {
    const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
            {
                role: 'system',
                content: 'Generate a concise 4-7 word title for a travel planning chat session based on the first exchange. Return only the title text — no quotes, no punctuation at the end.'
            },
            {
                role: 'user',
                content: `User: "${userMessage}"\nAssistant: "${responseText.slice(0, 300)}"`
            }
        ],
        max_tokens: 20
    });
    return response.choices[0].message.content.trim();
}

/**
 * Sends a user message in a multi-turn chat, runs the agentic tool-call loop,
 * and returns the final text response plus a historyDelta to persist in the DB.
 *
 * @param {Array}  history     - Previous OpenAI-format messages from DB (without the current user message)
 * @param {string} userMessage - The user's new message text
 * @param {string} userId      - MongoDB ObjectId string of the authenticated user
 * @returns {{ responseText, toolsUsed, createdTripIds, suggestedTrips, historyDelta }}
 */
export async function sendChatMessage(history, userMessage, userId) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userMessage }
    ];

    const historyDelta = [
        { role: 'user', content: userMessage }
    ];

    const toolsUsed = [];
    const createdTripIds = [];
    const suggestedTripsMap = new Map();

    let response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages,
        tools
    });

    // Agentic loop: keep resolving tool calls until the model returns pure text
    while (response.choices[0].finish_reason === 'tool_calls') {
        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage);
        historyDelta.push({
            role: 'assistant',
            content: assistantMessage.content ?? null,
            tool_calls: assistantMessage.tool_calls
        });

        const toolResultParts = [];

        for (const toolCall of assistantMessage.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            toolsUsed.push({ name: toolCall.function.name, args });

            const toolResult = await executeTool(toolCall.function.name, args, userId);

            // Collect trip cards from tool results
            if (toolCall.function.name === 'create_trip' && toolResult.success) {
                createdTripIds.push(toolResult.tripId.toString());
            }

            if (
                (toolCall.function.name === 'search_public_trips' || toolCall.function.name === 'get_user_trips') &&
                Array.isArray(toolResult.trips)
            ) {
                for (const trip of toolResult.trips) {
                    const card = toTripCard(trip);
                    if (card.id) suggestedTripsMap.set(card.id, card);
                }
            }

            if (toolCall.function.name === 'get_trip_details' && toolResult.id && !toolResult.error) {
                const card = toTripCard(toolResult);
                suggestedTripsMap.set(card.id, card);
            }

            const resultMsg = {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
            };
            messages.push(resultMsg);
            toolResultParts.push(resultMsg);
        }

        historyDelta.push(...toolResultParts);

        response = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages,
            tools
        });
    }

    const responseText = response.choices[0].message.content;

    historyDelta.push({
        role: 'assistant',
        content: responseText
    });

    return {
        responseText,
        toolsUsed,
        createdTripIds,
        suggestedTrips: [...suggestedTripsMap.values()],
        historyDelta
    };
}
