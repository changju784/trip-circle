import { apiGet, apiPost, apiDelete } from "../api";

export interface SuggestedTrip {
    id: string;
    title: string;
    description?: string | null;
    destinations: string[];
    startDate?: string | null;
    endDate?: string | null;
    tags: string[];
    thumbnail?: string | null;
    totalPrice?: number | null;
    isPublic?: boolean | null;
}

export interface ChatMessagePart {
    text?: string;
    functionCall?: { name: string; args: Record<string, unknown> };
    functionResponse?: { name: string; response: unknown };
}

export interface ChatMessage {
    role: "user" | "model";
    parts: ChatMessagePart[];
    timestamp?: string;
}

export interface ChatSession {
    _id: string;
    title: string;
    context: {
        referencedTripIds: string[];
        createdTripIds: string[];
    };
    messages?: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface SendMessageResponse {
    sessionId: string;
    responseText: string;
    toolsUsed: { name: string; args: Record<string, unknown> }[];
    createdTripIds: string[];
    suggestedTrips: SuggestedTrip[];
}

export async function createSession(): Promise<ChatSession> {
    return apiPost<ChatSession>("/api/chat/sessions");
}

export async function getSessions(): Promise<ChatSession[]> {
    return apiGet<ChatSession[]>("/api/chat/sessions");
}

export async function getSession(sessionId: string): Promise<ChatSession> {
    return apiGet<ChatSession>(`/api/chat/sessions/${sessionId}`);
}

export async function sendMessage(
    sessionId: string,
    message: string
): Promise<SendMessageResponse> {
    return apiPost<SendMessageResponse>(
        `/api/chat/sessions/${sessionId}/messages`,
        { message }
    );
}

export async function deleteSession(sessionId: string): Promise<{ message: string }> {
    return apiDelete(`/api/chat/sessions/${sessionId}`);
}
