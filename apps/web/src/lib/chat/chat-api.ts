import { apiPost } from '../api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  return apiPost<ChatResponse>('/api/chat', { messages });
}
