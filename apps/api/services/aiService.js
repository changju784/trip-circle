import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert travel assistant for TripCircle. Your goal is to help users plan detailed, personalized trips.
You should interact with the user to understand their preferences, budget, and constraints.

When you have sufficient information (destination, duration/dates, budget, interests), you must generate a structured trip plan using the 'submit_trip_plan' tool.
If the user's request is vague, ask clarifying questions first.
Do not generate a plan until you are confident it meets the user's needs.

Your style should be helpful, enthusiastic, and knowledgeable about travel destinations.
Unless specified otherwise, assume a moderate pace and mid-range budget.
`;

const TRIP_PLAN_TOOL = {
    type: "function",
    function: {
        name: "submit_trip_plan",
        description: "Submit a structured trip plan based on the user's requirements.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "A catchy title for the trip" },
                description: { type: "string", description: "A brief summary of the trip experience" },
                budget: { type: "number", description: "Estimated total budget in USD" },
                destinations: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string", description: "City or region name (e.g., 'Paris, France')" }
                        },
                        required: ["label"]
                    }
                },
                days: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            dayTitle: { type: "string", description: "Theme or title for the day" },
                            stops: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string", description: "Name of the place/activity" },
                                        category: {
                                            type: "string",
                                            enum: ["sightseeing", "dining", "activity", "lodging", "shopping", "other"],
                                            description: "Category of the stop"
                                        },
                                        description: { type: "string", description: "Short description of what to do here" },
                                        locationName: { type: "string", description: "Address or area name" }
                                    },
                                    required: ["title", "category"]
                                }
                            }
                        },
                        required: ["stops"]
                    }
                }
            },
            required: ["title", "destinations", "days"]
        }
    }
};

export async function chatWithAI(messages) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        throw new Error("OpenAI API key is not configured.");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", // Or gpt-3.5-turbo if cost is a concern
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            tools: [TRIP_PLAN_TOOL],
            tool_choice: "auto",
        });

        const choice = response.choices[0];
        const message = choice.message;

        // Check if the AI wants to call the tool (submit a plan)
        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            if (toolCall.function.name === 'submit_trip_plan') {
                const tripPlan = JSON.parse(toolCall.function.arguments);
                return {
                    reply: "I've created a trip plan for you! You can review it below.",
                    tripPlan: tripPlan,
                    isPlan: true
                };
            }
        }

        // Otherwise, it's just a text reply (clarifying question or chat)
        return {
            reply: message.content,
            isPlan: false
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        throw new Error("Failed to communicate with AI service.");
    }
}
