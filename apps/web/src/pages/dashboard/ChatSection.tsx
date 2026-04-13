import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bot, Plus, Send, Trash2, MapPin, CalendarDays,
    Loader2, MessageSquare, ChevronLeft, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/lib/trips/util";
import { TAG_CONFIG } from "@/lib/const/trip-tags";
import {
    createSession,
    getSessions,
    getSession,
    sendMessage,
    deleteSession,
    ChatSession,
    SuggestedTrip,
} from "@/lib/chat/chat-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisplayMessage {
    role: "user" | "model";
    text: string;
    timestamp?: string;
    suggestedTrips?: SuggestedTrip[];
}

// ─── Suggested Trip Card ──────────────────────────────────────────────────────

function SuggestedTripCard({ trip, onClick }: { trip: SuggestedTrip; onClick: () => void }) {
    const dateRange =
        trip.startDate && trip.endDate
            ? formatDateRange(trip.startDate, trip.endDate)
            : null;

    const destinationLabel =
        trip.destinations.length > 0 ? trip.destinations.join(" • ") : null;

    const visibleTags = trip.tags.slice(0, 3);

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer flex-shrink-0 w-52 rounded-2xl overflow-hidden border border-border/50 bg-white dark:bg-zinc-900 hover:shadow-lg hover:border-blue-500/40 transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="h-28 w-full overflow-hidden">
                {trip.thumbnail ? (
                    <div
                        className="h-full w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${trip.thumbnail})` }}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500" />
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
                <p className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                    {trip.title}
                </p>

                {destinationLabel && (
                    <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 line-clamp-1 uppercase tracking-tight">
                            {destinationLabel}
                        </p>
                    </div>
                )}

                {dateRange && (
                    <div className="flex items-center gap-1">
                        <CalendarDays size={10} className="text-emerald-500 shrink-0" />
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                            {dateRange}
                        </p>
                    </div>
                )}

                {visibleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {visibleTags.map((tag) => {
                            const config = TAG_CONFIG[tag as keyof typeof TAG_CONFIG];
                            if (!config) return null;
                            return (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border-zinc-200 dark:border-zinc-700"
                                >
                                    <config.icon size={8} className="text-blue-500" />
                                    {config.label}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                <Button
                    size="sm"
                    className="w-full h-7 text-[10px] font-black uppercase tracking-widest rounded-xl mt-1"
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                    View Trip
                </Button>
            </div>
        </div>
    );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onTripClick }: {
    msg: DisplayMessage;
    onTripClick: (id: string) => void;
}) {
    const isUser = msg.role === "user";

    return (
        <div className={cn("flex flex-col gap-3", isUser ? "items-end" : "items-start")}>
            {/* Bubble */}
            <div
                className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    isUser
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
                )}
            >
                {msg.text}
            </div>

            {/* Suggested trip cards */}
            {!isUser && msg.suggestedTrips && msg.suggestedTrips.length > 0 && (
                <div className="w-full max-w-full space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pl-1">
                        <Sparkles size={10} className="text-blue-500" />
                        Suggested Trips
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {msg.suggestedTrips.map((trip) => (
                            <SuggestedTripCard
                                key={trip.id}
                                trip={trip}
                                onClick={() => onTripClick(trip.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTextFromSession(session: ChatSession): DisplayMessage[] {
    return (session.messages ?? [])
        .filter((m) => m.parts.some((p) => p.text))
        .map((m) => ({
            role: m.role,
            text: m.parts.find((p) => p.text)?.text ?? "",
            timestamp: m.timestamp,
        }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatSection() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCountdown = useCallback((seconds: number) => {
        setRateLimitCountdown(seconds);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setRateLimitCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!);
                    countdownRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    // Load session list on mount
    useEffect(() => {
        getSessions()
            .then(setSessions)
            .finally(() => setIsSessionsLoading(false));
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAiLoading]);

    const handleSelectSession = async (sessionId: string) => {
        if (sessionId === activeSessionId) return;
        setActiveSessionId(sessionId);
        setMessages([]);
        try {
            const session = await getSession(sessionId);
            setMessages(extractTextFromSession(session));
        } catch {
            setMessages([]);
        }
        inputRef.current?.focus();
    };

    const handleNewSession = async () => {
        try {
            const session = await createSession();
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session._id);
            setMessages([]);
            inputRef.current?.focus();
        } catch (err) {
            console.error("Failed to create session", err);
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        try {
            await deleteSession(sessionId);
            setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error("Failed to delete session", err);
        }
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isAiLoading) return;

        // Ensure a session exists
        let sessionId = activeSessionId;
        if (!sessionId) {
            try {
                const session = await createSession();
                setSessions((prev) => [session, ...prev]);
                setActiveSessionId(session._id);
                sessionId = session._id;
            } catch {
                return;
            }
        }

        // Optimistically add user message
        setMessages((prev) => [...prev, { role: "user", text }]);
        setInputText("");
        setIsAiLoading(true);

        try {
            const result = await sendMessage(sessionId, text);

            // Update session title in sidebar after first message
            setSessions((prev) =>
                prev.map((s) =>
                    s._id === sessionId
                        ? { ...s, title: text.slice(0, 60) }
                        : s
                )
            );

            setMessages((prev) => [
                ...prev,
                {
                    role: "model",
                    text: result.responseText,
                    suggestedTrips:
                        result.suggestedTrips.length > 0 ? result.suggestedTrips : undefined,
                },
            ]);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { message?: string; retryAfterSeconds?: number } } };
            const status = axiosErr?.response?.status;
            const data = axiosErr?.response?.data;

            if (status === 429) {
                const seconds = data?.retryAfterSeconds ?? 60;
                startCountdown(seconds);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "model",
                        text: `The AI is currently rate limited. You can send another message in ${seconds} seconds.`,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "model",
                        text: "Sorry, something went wrong. Please try again.",
                    },
                ]);
            }
        } finally {
            setIsAiLoading(false);
            inputRef.current?.focus();
        }
    };

    const isBlocked = isAiLoading || rateLimitCountdown > 0;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const activeSession = sessions.find((s) => s._id === activeSessionId);

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[500px] rounded-3xl overflow-hidden border border-border/50 bg-white dark:bg-zinc-950 shadow-sm">

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside
                className={cn(
                    "flex flex-col border-r border-border/50 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300",
                    sidebarOpen ? "w-64 min-w-[220px]" : "w-0 min-w-0 overflow-hidden"
                )}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                            Chats
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNewSession}
                        className="h-7 w-7 p-0 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        title="New chat"
                    >
                        <Plus size={14} />
                    </Button>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {isSessionsLoading ? (
                        <div className="flex justify-center pt-8">
                            <Loader2 size={16} className="animate-spin text-zinc-400" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <p className="text-center text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-600 pt-8 tracking-widest">
                            No chats yet
                        </p>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s._id}
                                onClick={() => handleSelectSession(s._id)}
                                className={cn(
                                    "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                                    s._id === activeSessionId
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <MessageSquare
                                        size={12}
                                        className={cn(
                                            "shrink-0",
                                            s._id === activeSessionId
                                                ? "text-blue-500"
                                                : "text-zinc-400"
                                        )}
                                    />
                                    <span className="text-xs font-semibold truncate">
                                        {s.title}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(e, s._id)}
                                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-red-500 transition-all"
                                    title="Delete chat"
                                >
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* ── Main Chat Area ───────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 shrink-0">
                    <button
                        onClick={() => setSidebarOpen((o) => !o)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        <ChevronLeft
                            size={16}
                            className={cn("transition-transform duration-300", !sidebarOpen && "rotate-180")}
                        />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                                TripCircle AI
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                {activeSession ? activeSession.title : "Your travel planning assistant"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
                    {messages.length === 0 && !isAiLoading ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    Plan your next adventure
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                                    Ask me to find trips, explore destinations, or create a new itinerary for you.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                                {[
                                    "Find beach trips in Southeast Asia",
                                    "Show me my saved trips",
                                    "Plan a 5-day Tokyo itinerary",
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => {
                                            setInputText(prompt);
                                            inputRef.current?.focus();
                                        }}
                                        className="px-4 py-2 rounded-full border border-border/60 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <MessageBubble
                                key={i}
                                msg={msg}
                                onTripClick={(id) => navigate(`/trip-circle/trip/${id}`)}
                            />
                        ))
                    )}

                    {/* AI loading indicator */}
                    {isAiLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot size={13} className="text-white" />
                            </div>
                            <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="px-5 pb-5 pt-3 border-t border-border/50 shrink-0">
                    <div className={cn(
                        "flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border rounded-2xl px-4 py-2 transition-all",
                        rateLimitCountdown > 0
                            ? "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20"
                            : "border-border/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20"
                    )}>
                        <Input
                            ref={inputRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                rateLimitCountdown > 0
                                    ? `Rate limited — try again in ${rateLimitCountdown}s…`
                                    : "Ask about destinations, trips, or create an itinerary…"
                            }
                            disabled={isBlocked}
                            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-0 h-9"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!inputText.trim() || isBlocked}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 shrink-0"
                        >
                            {isAiLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : rateLimitCountdown > 0 ? (
                                <span className="text-[10px] font-black tabular-nums">{rateLimitCountdown}</span>
                            ) : (
                                <Send size={14} />
                            )}
                        </Button>
                    </div>
                    <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 font-medium">
                        Press Enter to send · AI may occasionally make mistakes
                    </p>
                </div>
            </div>
        </div>
    );
}
