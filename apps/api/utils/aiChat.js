import { GoogleGenerativeAI } from "@google/generative-ai";
import { exploreTrips } from '../services/tripSearchService.js';
import { createTrip } from '../services/tripService.js';
import Trip from '../schema/TripSchema.js';
import { TripTagsEnum } from '../schema/const/TripConstants.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are TripCircle AI, a friendly travel planning assistant embedded in the TripCircle platform.

Your capabilities:
1. Search the platform for public travel plans that match the user's interests or destination
2. Show detailed itineraries of specific trips
3. List the user's own saved trips
4. Create new trips for the user as an agentic action

Guidelines:
- Always call a search or lookup tool before presenting trip options — never invent trips.
- When creating a trip, confirm key details (title, destination, dates) with the user before calling create_trip.
- Present search results in a clean, readable format with title, destination, and dates.
- Be concise, helpful, and travel-savvy.
- If you cannot find relevant trips, suggest creating a new one.
- Valid trip tags are: ${TripTagsEnum.join(', ')}.`;

const toolDeclarations = [
    {
        name: 'search_public_trips',
        description: 'Search for public travel plans on TripCircle by keyword (destination, title) and/or tags.',
        parameters: {
            type: 'OBJECT',
            properties: {
                query: {
                    type: 'STRING',
                    description: 'Free-text search query, e.g. "Tokyo" or "beach vacation"'
                },
                tags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    description: `Filter by tags. Valid values: ${TripTagsEnum.join(', ')}`
                },
                limit: {
                    type: 'NUMBER',
                    description: 'Maximum number of results to return (default 5, max 20)'
                }
            }
        }
    },
    {
        name: 'get_trip_details',
        description: 'Get the full day-by-day itinerary and details of a specific public trip by its ID.',
        parameters: {
            type: 'OBJECT',
            properties: {
                tripId: {
                    type: 'STRING',
                    description: 'The trip ID returned from search_public_trips'
                }
            },
            required: ['tripId']
        }
    },
    {
        name: 'get_user_trips',
        description: "Fetch the current user's own saved trips (including private ones).",
        parameters: {
            type: 'OBJECT',
            properties: {
                limit: {
                    type: 'NUMBER',
                    description: 'Maximum number of results (default 10)'
                }
            }
        }
    },
    {
        name: 'create_trip',
        description: 'Create a new trip for the current user. Only call this after the user has confirmed they want to create a trip and you have gathered the necessary details.',
        parameters: {
            type: 'OBJECT',
            properties: {
                title: {
                    type: 'STRING',
                    description: 'Trip title, e.g. "5 Days in Tokyo"'
                },
                description: {
                    type: 'STRING',
                    description: 'Short description of the trip'
                },
                destinations: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            label: { type: 'STRING', description: 'Place name, e.g. "Tokyo, Japan"' },
                            lat: { type: 'NUMBER' },
                            lng: { type: 'NUMBER' }
                        }
                    },
                    description: 'List of destinations'
                },
                startDate: {
                    type: 'STRING',
                    description: 'Start date in ISO format YYYY-MM-DD'
                },
                endDate: {
                    type: 'STRING',
                    description: 'End date in ISO format YYYY-MM-DD'
                },
                tags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    description: `Trip style/vibe tags. Valid values: ${TripTagsEnum.join(', ')}`
                },
                isPublic: {
                    type: 'BOOLEAN',
                    description: 'Whether to share this trip publicly on the platform (default false)'
                }
            },
            required: ['title', 'startDate', 'endDate']
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
        // destinations may be label strings (search) or { label } objects (details)
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
 * Sends a user message in a multi-turn chat, runs the agentic tool-call loop,
 * and returns the final text response plus a historyDelta to persist in the DB.
 *
 * @param {Array}  history     - Previous Gemini-format messages from DB (without the current user message)
 * @param {string} userMessage - The user's new message text
 * @param {string} userId      - MongoDB ObjectId string of the authenticated user
 * @returns {{ responseText, toolsUsed, createdTripIds, suggestedTrips, historyDelta }}
 */
export async function sendChatMessage(history, userMessage, userId) {
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
    });

    const chat = model.startChat({ history });

    // Delta accumulates every new turn to be persisted in the DB
    const historyDelta = [
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    const toolsUsed = [];
    const createdTripIds = [];
    // Map keyed by trip id — deduplicates across multiple tool calls in one turn
    const suggestedTripsMap = new Map();

    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Agentic loop: keep resolving tool calls until Gemini returns pure text
    while (response.functionCalls()?.length > 0) {
        const calls = response.functionCalls();

        // Record the model's function-call turn
        historyDelta.push({
            role: 'model',
            parts: calls.map(c => ({ functionCall: { name: c.name, args: c.args } }))
        });

        const functionResponseParts = [];

        for (const call of calls) {
            toolsUsed.push({ name: call.name, args: call.args });
            const toolResult = await executeTool(call.name, call.args, userId);

            // --- Collect trip cards from tool results ---
            if (call.name === 'create_trip' && toolResult.success) {
                createdTripIds.push(toolResult.tripId.toString());
            }

            if (
                (call.name === 'search_public_trips' || call.name === 'get_user_trips') &&
                Array.isArray(toolResult.trips)
            ) {
                for (const trip of toolResult.trips) {
                    const card = toTripCard(trip);
                    if (card.id) suggestedTripsMap.set(card.id, card);
                }
            }

            if (call.name === 'get_trip_details' && toolResult.id && !toolResult.error) {
                const card = toTripCard(toolResult);
                suggestedTripsMap.set(card.id, card);
            }
            // --------------------------------------------

            functionResponseParts.push({
                functionResponse: { name: call.name, response: toolResult }
            });
        }

        // Record the tool results as a user turn (Gemini's required format)
        historyDelta.push({
            role: 'user',
            parts: functionResponseParts
        });

        result = await chat.sendMessage(functionResponseParts);
        response = result.response;
    }

    const responseText = response.text();

    historyDelta.push({
        role: 'model',
        parts: [{ text: responseText }]
    });

    return {
        responseText,
        toolsUsed,
        createdTripIds,
        suggestedTrips: [...suggestedTripsMap.values()],
        historyDelta
    };
}
