import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, Sparkles, MapPin, Calendar, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAI } from "@/contexts/AIContext";

// Need to update import path once context file location is confirmed
// Assuming context is exported from src/contexts/AIContext
import { useTrips } from "@/lib/trips/use-trips";
import { convertPlanToTripInput } from "@/lib/ai/ai-api";
import { useNavigate } from "react-router-dom";

export default function AgentChat() {
    const { isOpen, toggleChat, messages, sendMessage, isLoading, currentPlan, clearPlan } = useAI();
    const { createTrip } = useTrips();
    const navigate = useNavigate();

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isApplying, setIsApplying] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const text = input;
        setInput("");
        await sendMessage(text);
    };

    const handleApplyPlan = async () => {
        if (!currentPlan) return;

        try {
            setIsApplying(true);
            const tripInput = convertPlanToTripInput(currentPlan);
            const newTrip = await createTrip(tripInput);

            toggleChat(); // Close chat
            clearPlan(); // Clear plan from context
            navigate(`/trip-circle/trip/${newTrip._id}`);

        } catch (error) {
            console.error("Failed to create trip from plan", error);
            alert("Failed to create trip. Please try again.");
        } finally {
            setIsApplying(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center gap-2 group"
            >
                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-sm hidden group-hover:block animate-in fade-in slide-in-from-right-2">Plan a Trip</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-md h-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <div className="flex items-center gap-2 text-white">
                    <Bot size={20} />
                    <h3 className="font-bold">AI Travel Assistant</h3>
                </div>
                <button
                    onClick={toggleChat}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 px-6">
                        <Sparkles size={40} className="mx-auto mb-4 text-indigo-300" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Where do you want to go?
                        </p>
                        <p className="text-xs text-gray-500">
                            Try: "Plan a 4-day trip to Tokyo under $1200" or "Romantic weekend in Paris"
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {/* Trip Proposal Card */}
                {currentPlan && (
                    <div className="mt-4 border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-100">{currentPlan.title}</h4>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-2">{currentPlan.description}</p>
                            </div>
                            <span className="bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                Draft
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <MapPin size={12} className="text-indigo-500" />
                                <span className="truncate">{currentPlan.destinations.map(d => d.label).join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <Calendar size={12} className="text-indigo-500" />
                                <span>{currentPlan.days?.length || currentPlan.durationDays} Days</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <DollarSign size={12} className="text-indigo-500" />
                                <span>~${currentPlan.budget}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                onClick={clearPlan}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleApplyPlan}
                                disabled={isApplying}
                            >
                                {isApplying ? "Creating..." : "Create Trip"}
                            </Button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your dream trip..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}
