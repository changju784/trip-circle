import { apiPost } from "../api";
import { CreateTripInput } from "../trips/trips-api";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface TripPlan {
    title: string;
    description: string;
    durationDays?: number; // AI might infer number of days from stops/schedule
    budget?: number;
    destinations: { label: string }[];
    days: {
        date?: string; // or day index 1, 2, 3...
        dayTitle?: string;
        stops: {
            title: string;
            category: string;
            description: string;
            locationName?: string;
            lat?: number;
            lng?: number;
        }[];
    }[];
}

export interface AIResponse {
    reply: string;
    tripPlan?: TripPlan;
    isPlan: boolean;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<AIResponse> {
    return apiPost<AIResponse>("/api/ai/chat", { messages });
}

/**
 * Converts the AI's structured plan into the app's Trip format.
 * Note: AI doesn't return geocodes or exact dates usually (unless specified).
 * We might need to geocode destinations or set default dates.
 */
export function convertPlanToTripInput(plan: TripPlan): CreateTripInput {
    // Default start date to tomorrow if not specified
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    // Calculate end date based on days array length
    const endDate = new Date(startDate);
    const duration = plan.days?.length || plan.durationDays || 3;
    endDate.setDate(startDate.getDate() + duration);

    return {
        title: plan.title,
        description: plan.description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        budget: plan.budget || 0,
        isPublic: false,
        destinations: plan.destinations.map(d => ({
            id: Math.random().toString(36).substring(7), // Temp ID until geocoded? Or backend handles it?
            label: d.label
        })),
        days: plan.days.map((day, index) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + index);

            return {
                date: dayDate.toISOString(),
                stops: day.stops.map(stop => ({
                    id: Math.random().toString(36).substring(7),
                    title: stop.title,
                    category: (stop.category as any) || 'sightseeing',
                    description: stop.description || '',
                    locationName: stop.locationName,
                    lat: stop.lat || null,
                    lng: stop.lng || null
                }))
            };
        }),
        tags: []
    };
}
