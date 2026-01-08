import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import StopDetailModal from "@/components/trip/StopDetailModal";
import ShareTripModal from "@/components/trip/ShareTripModal";
import Receipts from "@/components/trip/Receipts";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { useTrips } from "@/lib/trips/use-trips";
import { useTripsContext } from "@/contexts/TripsContext";
import { useAuth } from "@/auth/hook/use-auth";
import { getUser } from "@/lib/users/users-api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { addComment, getPostByTrip, toggleLike, type Post } from "@/lib/posts/posts-api";
import { Section } from "@/components/ui/Section";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";
import { useGetTripBudgetInfo } from "./hooks/use-get-trip-budget-info";
import { useGetTripOwners } from "./hooks/use-get-trip-owners";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { Trip } from "@/lib/trips/trips-api";
import { TAG_CONFIG } from "@/lib/const/trip-tags";
import { Badge } from "@/components/ui/badge";

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTrip, updateTrip, shareTrip } = useTrips();
    const { deleteTrip, forkTrip } = useTripsContext();
    const { user } = useAuth();

    const [trip, setTrip] = useState<Trip | null>(null);
    const { owner, contributors } = useGetTripOwners(trip);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [loadingTrip, setLoadingTrip] = useState(true);
    const [post, setPost] = useState<Post | null>(null);
    const [loadingPost, setLoadingPost] = useState(false);
    const [, setPostError] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    // ---------------- LOAD TRIP ----------------
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        async function load() {
            try {
                setLoadingTrip(true);
                setError(null);
                const data = await getTrip(id);
                if (!cancelled) setTrip(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load trip");
                }
            } finally {
                if (!cancelled) setLoadingTrip(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [id, getTrip, refreshKey]);

    // ---------------- HELPER VARS ----------------
    const isOwner = Boolean(
        user &&
        trip?.members &&
        Array.isArray(trip.members) &&
        trip.members.some((m: any) => String(m) === String(user.id))
    );

    const initialStop = useMemo(() => {
        if (!editingStop || !trip) return null;
        for (const d of trip.days || []) {
            const s = (d.stops || []).find((x: any) => x.id === editingStop);
            if (s) return s;
        }
        return null;
    }, [editingStop, trip]);

    const tripBudgetInfo = useGetTripBudgetInfo(trip);

    const refresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleReceiptsChange = (updatedTrip: any) => {
        setTrip(updatedTrip);
    };

    // ---------------- LOAD POST (for comments/likes) ----------------
    useEffect(() => {
        if (!trip?._id || !trip.isPublic) {
            setPost(null);
            setPostError(trip && !trip.isPublic ? "Comments are only available on public trips." : null);
            return;
        }

        let cancelled = false;
        const loadPost = async () => {
            try {
                setLoadingPost(true);
                setPostError(null);
                const data = await getPostByTrip(trip._id);
                if (!cancelled) setPost(data);
            } catch (err) {
                if (!cancelled) {
                    const msg = err instanceof Error ? err.message : "Unable to load comments right now.";
                    setPost(null);
                    setPostError(msg);
                }
            } finally {
                if (!cancelled) setLoadingPost(false);
            }
        };

        loadPost();
        return () => { cancelled = true; };
    }, [trip?._id, trip?.isPublic, refreshKey, trip]);

    // ---------------- COMMENTS & LIKES ----------------
    const handleLikeToggle = async () => {
        if (!user?.id || !post?._id) return;
        try {
            const updated = await toggleLike(post._id, user.id);
            setPost(updated);
        } catch (err) {
            console.error("Failed to toggle like:", err);
        }
    };

    const handleAddComment = async () => {
        if (!user?.id || !post?._id) return;
        const text = commentText.trim();
        if (!text) return;
        try {
            setCommentSubmitting(true);
            const updated = await addComment(post._id, user.id, text);
            setPost(updated);
            setCommentText("");
        } catch (err) {
            console.error("Failed to add comment:", err);
        } finally {
            setCommentSubmitting(false);
        }
    };

    // ---------------- HANDLERS ----------------
    const handleAddStop = async (data: any, stopId?: string | null) => {
        if (!id || !trip) return;
        const days = JSON.parse(JSON.stringify(trip.days || []));

        if (stopId) {
            for (const d of days) {
                const idx = (d.stops || []).findIndex((s: any) => s.id === stopId);
                if (idx >= 0) {
                    d.stops[idx] = { ...d.stops[idx], ...data, lat: data.lat ?? null, lng: data.lng ?? null };
                    break;
                }
            }
        } else {
            if (!days[selectedDay]) {
                days[selectedDay] = { date: new Date().toISOString(), stops: [] };
            }
            days[selectedDay].stops.push({
                id: Math.random().toString(36).slice(2, 9),
                ...data,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
            });
        }
        await updateTrip(id, { days });
        refresh();
        setEditingStop(null);
        setOpenAdd(false);
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!id || !trip) return;
        const days = trip.days.map((d: any) => ({
            ...d,
            stops: d.stops.filter((s: any) => s.id !== stopId),
        }));
        await updateTrip(id, { days });
        refresh();
    };

    const handleReorderStops = async (dayIndex: number, reorderedStops: any[]) => {
        if (!id || !trip) return;
        const updatedTrip = { ...trip };
        updatedTrip.days = [...trip.days];
        updatedTrip.days[dayIndex] = {
            ...updatedTrip.days[dayIndex],
            stops: reorderedStops
        };
        setTrip(updatedTrip);
        updateTrip(id, { days: updatedTrip.days }).catch(err => {
            console.error('Failed to save reorder:', err);
        });
    };

    const confirmDeleteTrip = async () => {
        await deleteTrip(trip._id);
        navigate("/trip-circle/dashboard");
    };

    if (loadingTrip) {
        return <div className="min-h-screen p-10 text-center text-gray-600 dark:text-gray-400">Loading trip...</div>;
    }
    if (error || !trip) {
        return (
            <div className="min-h-screen p-10 text-center text-red-600 dark:text-red-400">
                {error ? `Error: ${error}` : "Trip not found"} — <Link to="/trip-circle/dashboard" className="underline text-gray-900 dark:text-gray-100">Back</Link>
            </div>
        );
    }


    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-screen-xl mx-auto px-6 pt-6">
                <BackToDashboardButton />
            </div>

            <main className="max-w-screen-xl mx-auto px-6 mt-4">
                {/* --- OVERVIEW SECTION --- */}
                <Section
                    title={trip.title}
                    rightElement={
                        <div className="flex items-center gap-2">
                            {isOwner ? (
                                <>
                                    <Button variant="secondary" onClick={() => setShareOpen(true)}>Share</Button>
                                    <Link to={`/trip-circle/trip/${trip._id}/edit`}>
                                        <Button variant="outline">Edit Trip</Button>
                                    </Link>
                                    <Button variant="destructive" onClick={() => setOpenDeleteModal(true)}>Delete</Button>
                                </>
                            ) : (
                                trip.isPublic && user && (
                                    <Button variant="dark" onClick={async () => {
                                        try {
                                            const newTrip = await forkTrip(trip._id, user.id);
                                            navigate(`/trip-circle/trip/${newTrip._id}`);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to copy trip.");
                                        }
                                    }}>Copy Trip</Button>
                                )
                            )}
                        </div>
                    }
                >
                    {/* The children of this section is the "Overview" content */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex flex-col gap-1">
                                {trip.destinations?.slice(0, 3).map((d: any) => (
                                    <div key={d.id} className="flex items-center gap-1">
                                        <span>📍</span>
                                        <span className="text-gray-900 dark:text-gray-100">{d.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                            <div className="flex items-center gap-2">
                                📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                            </div>

                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${trip.isPublic ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                <span>{trip.isPublic ? "🌍" : "🔒"}</span>
                                {trip.isPublic ? "Public" : "Private"}
                            </div>

                            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                            {trip.isPublic && (
                                <PostActivitySummary
                                    likeCount={post?.likeCount}
                                    forkCount={post?.forkCount}
                                    commentCount={post?.commentCount}
                                    isLiked={post?.likes.includes(user?.id || "")}
                                    onLike={handleLikeToggle}
                                />
                            )}
                        </div>

                        {trip.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed italic">
                                {trip.description}
                            </p>
                        )}

                        {/* --- TRIP TAGS --- */}
                        {trip.tags && trip.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {trip.tags.map((tagId) => {
                                    const config = TAG_CONFIG[tagId as keyof typeof TAG_CONFIG];
                                    if (!config) return null;
                                    const Icon = config.icon;

                                    return (
                                        <Badge
                                            key={tagId}
                                            variant="outline"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-white/5 bg-zinc-900/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
                                        >
                                            <Icon size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {config.label}
                                            </span>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* --- BUDGET/PRICE WIDGET --- */}
                        {tripBudgetInfo && (
                            <div className="mt-6 p-5 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 max-w-2xl shadow-sm">
                                {isOwner ? (
                                    /* OWNER VIEW: Full Budget Breakdown */
                                    <>
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                                    Trip Budget Status
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        ${tripBudgetInfo.total.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        spent of ${tripBudgetInfo.limit.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                                    {tripBudgetInfo.isOverBudget ? "Over Budget" : "Remaining"}
                                                </p>
                                                <span className={cn(
                                                    "text-lg font-bold",
                                                    tripBudgetInfo.isOverBudget ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                                                )}>
                                                    {tripBudgetInfo.isOverBudget ? "+" : ""}${Math.abs(tripBudgetInfo.remaining).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <Progress
                                            value={tripBudgetInfo.percentUsed}
                                            className="h-2"
                                            indicatorClassName={tripBudgetInfo.isOverBudget ? "bg-red-500" : "bg-emerald-500"}
                                        />

                                        {tripBudgetInfo.isOverBudget && (
                                            <p className="text-[11px] text-red-500 mt-2 font-medium flex items-center gap-1">
                                                <span>⚠️</span> Careful! You've exceeded your set budget.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    /* PUBLIC VIEW: Total Price Only */
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                                Total Estimated Cost
                                            </p>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                ${tripBudgetInfo.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                            Estimated Price
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 font-medium">Contributors:</span>
                            <div className="flex -space-x-2 isolate">
                                {owner && (
                                    <Avatar
                                        user={owner}
                                        size={28}
                                        className="ring-2 ring-white dark:ring-gray-900 z-30"
                                        showPopover={true}
                                    />
                                )}
                                {contributors.map((c) => (
                                    <Avatar
                                        key={c.id}
                                        user={c}
                                        size={28}
                                        className="ring-2 ring-white dark:ring-gray-900 z-20 hover:z-40 transition-all"
                                        showPopover={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* --- ITINERARY SECTION --- */}
                <Section title="Itinerary">
                    <Tabs
                        value={`day-${selectedDay}`}
                        onValueChange={(v) => setSelectedDay(Number(v.replace("day-", "")))}
                        className="mb-4"
                    >
                        <DayTabs days={trip.days} />

                        {trip.days.map((d: any, i: number) => (
                            <TabsContent key={d.date || i} value={`day-${i}`}>
                                <DayStopsPanel
                                    days={trip.days}
                                    selectedDay={i}
                                    isOwner={isOwner}
                                    onOpenAdd={(dayIndex) => {
                                        setSelectedDay(dayIndex);
                                        setEditingStop(null);
                                        setOpenAdd(true);
                                    }}
                                    onEditStop={(sId: string) => {
                                        setSelectedDay(i);
                                        setEditingStop(sId);
                                        setOpenAdd(true);
                                    }}
                                    onDeleteStop={handleDeleteStop}
                                    onReorderStops={handleReorderStops}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </Section>

                {/* --- DOCUMENTS SECTION --- */}
                {isOwner && (
                    <Section title="Documents & Receipts">
                        <Receipts
                            tripId={trip._id}
                            receipts={trip.receipts || []}
                            onReceiptsChange={handleReceiptsChange}
                        />
                    </Section>
                )}

                {/* --- DISCUSSION SECTION --- */}
                <Section
                    title="Discussion"
                    icon={<MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    className="mt-10"
                    rightElement={post && (
                        <button
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            onClick={handleLikeToggle}
                            disabled={!user}
                        >
                            <Heart
                                className={`w-4 h-4 ${post.likes.includes(user?.id || "") ? "fill-red-600 text-red-600 dark:fill-red-400 dark:text-red-400" : ""}`}
                            />
                            <span>{post.likeCount}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">Like</span>
                        </button>
                    )}
                >
                    <div className="w-full space-y-6">
                        {!trip.isPublic && (
                            <div className="p-8 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Comments are only available on public trips.
                                </p>
                            </div>
                        )}

                        {trip.isPublic && (
                            <div className="w-full space-y-6">
                                {/* 1. Comments Feed */}
                                {post && post.comments.length > 0 ? (
                                    <div className="space-y-4">
                                        {post.comments.map((comment) => (
                                            <div
                                                key={comment._id}
                                                className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm"
                                            >
                                                <Avatar
                                                    user={{
                                                        id: (comment.userId as any)?._id || (comment.userId as any)?.id,
                                                        username: (comment.userId as any)?.username,
                                                        email: (comment.userId as any)?.email,
                                                        name: (comment.userId as any)?.name,
                                                    }}
                                                    size={36}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                            {comment.userId?.username || "Traveler"}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                            {new Date(comment.dateCreated).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {comment.commentText}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    trip.isPublic && !loadingPost && (
                                        <div className="p-10 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                            <p className="text-sm text-gray-500">No comments yet. Be the first to share your thoughts.</p>
                                        </div>
                                    )
                                )}

                                {/* 2. Add Comment Input Area */}
                                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add a comment</span>
                                    </div>

                                    <textarea
                                        id="comment-box"
                                        className="w-full min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-gray-500 transition-all"
                                        placeholder={user ? "Share feedback, tips, or questions about this trip..." : "Log in to comment"}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                        disabled={!user || commentSubmitting}
                                    />

                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] text-gray-500">
                                            Tip: Press <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-sans">Cmd/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-sans">Enter</kbd> to post.
                                        </p>

                                        <Button
                                            onClick={handleAddComment}
                                            disabled={!user || commentSubmitting || !commentText.trim().length}
                                            className="px-6"
                                        >
                                            {commentSubmitting ? "Posting..." : "Post comment"}
                                        </Button>
                                    </div>
                                    {!user && <p className="text-xs text-amber-600 dark:text-amber-500 text-right">Please log in to participate in the discussion.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </Section>

                {/* --- MODALS --- */}
                <StopDetailModal open={openAdd} onClose={() => { setOpenAdd(false); setEditingStop(null); }} onSubmit={handleAddStop} initialStop={initialStop} readOnly={!isOwner} cityContexts={trip?.destinations} />
                <ShareTripModal open={shareOpen} onClose={() => setShareOpen(false)} onShare={async (email: string) => { await shareTrip(trip._id, email); setShareOpen(false); refresh(); }} />
                <Modal title="Delete Trip?" isOpen={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone. Are you sure you want to delete this trip?</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDeleteTrip}>Delete</Button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
