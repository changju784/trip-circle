import React, { createContext, useContext, useState, useCallback } from "react";
import { sendChatMessage, ChatMessage, AIResponse, TripPlan } from "@/lib/ai/ai-api";

interface AIContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    toggleChat: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    clearChat: () => void;
    currentPlan: TripPlan | null;
    clearPlan: () => void;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<TripPlan | null>(null);

    const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setCurrentPlan(null);
    }, []);

    const clearPlan = useCallback(() => setCurrentPlan(null), []);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMsg: ChatMessage = { role: "user", content };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Include history in the request
            const history = [...messages, userMsg];
            const response = await sendChatMessage(history);

            setMessages(prev => [
                ...prev,
                { role: "assistant", content: response.reply }
            ]);

            if (response.isPlan && response.tripPlan) {
                setCurrentPlan(response.tripPlan);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    return (
        <AIContext.Provider value={{
            isOpen,
            setIsOpen,
            toggleChat,
            messages,
            isLoading,
            sendMessage,
            clearChat,
            currentPlan,
            clearPlan
        }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error("useAI must be used within an AIProvider");
    }
    return context;
}
