import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import AddStopModal from "@/components/trip/AddStopModal";
import ShareTripModal from "@/components/trip/ShareTripModal";
import Receipts from "@/components/trip/Receipts";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import { useTrips } from "@/lib/trips/use-trips";
import { useTripsContext } from "@/contexts/TripsContext";
import { useAuth } from "@/auth/hook/use-auth";
import { getUser } from "@/lib/users/users-api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { addComment, getPostByTrip, toggleLike, type Post } from "@/lib/posts/posts-api";

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTrip, updateTrip, shareTrip } = useTrips();
    const { deleteTrip, forkTrip } = useTripsContext();
    const { user } = useAuth();

    const [trip, setTrip] = useState<any | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingStop, setEditingStop] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [ownerName, setOwnerName] = useState<string | null>(null);
    const [contributors, setContributors] = useState<{ id: string; name: string; email?: string }[]>([]);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [loadingTrip, setLoadingTrip] = useState(true);
    const [post, setPost] = useState<Post | null>(null);
    const [loadingPost, setLoadingPost] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
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

    // ---------------- LOAD OWNER ----------------
    useEffect(() => {
        if (!trip || !trip.members || !trip.members.length) {
            setOwnerName(null);
            return;
        }
        const ownerId = trip?.members?.[0];
        let cancelled = false;
        (async () => {
            try {
                const user = await getUser(ownerId);
                if (!cancelled) setOwnerName(user.username);
            } catch (err) {
                if (!cancelled) setOwnerName(null);
            }
        })();
        return () => { cancelled = true; };
    }, [trip]);

    // ---------------- LOAD CONTRIBUTORS ----------------
    useEffect(() => {
        let cancelled = false;
        const loadContributors = async () => {
            const memberIds: string[] = (trip?.members || []).map((m: any) => String(m));
            if (memberIds.length === 0) {
                setContributors([]);
                return;
            }

            const uniqueIds: string[] = Array.from(new Set(memberIds));
            try {
                const users = await Promise.all(uniqueIds.map(async (uid) => {
                    try {
                        const user = await getUser(uid);
                        return {
                            id: user.id || uid,
                            name: user.username || user.email || "Unknown",
                            email: user.email,
                        };
                    } catch {
                        return { id: uid, name: "Unknown" };
                    }
                }));
                if (!cancelled) setContributors(users as { id: string; name: string; email?: string }[]);
            } catch (err) {
                console.error("Failed to load contributors", err);
                if (!cancelled) setContributors(uniqueIds.map((id) => ({ id, name: "Unknown" })));
            }
        };

        loadContributors();
        return () => { cancelled = true; };
    }, [trip?.members]);

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

    const hasMoreDestinations = trip.destinations && trip.destinations.length > 3;

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-screen-xl mx-auto px-6 pt-6">
                <BackToDashboardButton />
            </div>

            <main className="max-w-screen-xl mx-auto px-6 mt-4">
                <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{trip.title}</h1>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <div className="flex flex-col gap-1">
                                {trip.destinations?.slice(0, 3).map((d: any) => (
                                    <div key={d.id} className="flex items-center gap-1">
                                        <span>📍</span>
                                        <span className="text-gray-900 dark:text-gray-100">{d.label}</span>
                                    </div>
                                ))}
                                {hasMoreDestinations && (
                                    <span className="text-xs text-gray-500 dark:text-gray-500 pl-5">+ {trip.destinations.length - 3} more</span>
                                )}
                            </div>

                            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                            </div>

                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${trip.isPublic
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                }`}>
                                <span>{trip.isPublic ? "🌍" : "🔒"}</span>
                                {trip.isPublic ? "Public" : "Private"}
                            </div>
                        </div>

                        {trip.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 max-w-2xl leading-relaxed">
                                {trip.description}
                            </p>
                        )}

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Owned by <span className="font-medium text-gray-900 dark:text-gray-100">{ownerName || "Unknown"}</span>
                        </p>

                        {contributors.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <span className="font-medium text-gray-900 dark:text-gray-100">Contributors:</span>
                                {contributors.map((c) => (
                                    <span
                                        key={c.id}
                                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                                        title={c.email}
                                    >
                                        <Avatar user={{ id: c.id, username: c.name, email: c.email }} size={28} />
                                        <span className="pr-1">{c.name}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

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
                                <Button
                                    variant="dark"
                                    onClick={async () => {
                                        try {
                                            const newTrip = await forkTrip(trip._id, user.id);
                                            navigate(`/trip-circle/trip/${newTrip._id}`);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to copy trip.");
                                        }
                                    }}
                                >
                                    Copy Trip
                                </Button>
                            )
                        )}
                    </div>
                </header>

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

                {isOwner && (
                    <Receipts
                        tripId={trip._id}
                        receipts={trip.receipts || []}
                        onReceiptsChange={handleReceiptsChange}
                    />
                )}

                <section className="max-w-4xl mx-auto mt-10 w-full">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            Discussion
                        </h2>
                        {post && (
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
                    </div>

                    <Card className="p-4 shadow-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {!trip.isPublic && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Comments are only available on public trips.
                            </p>
                        )}

                        {trip.isPublic && (
                            <>
                                {loadingPost && <p className="text-sm text-gray-600 dark:text-gray-400">Loading comments...</p>}
                                {postError && !loadingPost && <p className="text-sm text-red-600 dark:text-red-400">{postError}</p>}

                                {post && (
                                    <div className="space-y-4">
                                        <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                                            {post.comments.length === 0 ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">No comments yet. Be the first to share your thoughts.</p>
                                            ) : (
                                                post.comments.map((comment) => (
                                                    <div key={comment._id} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600/50 px-3 py-2">
                                                        <div className="flex items-start gap-2">
                                                            <Avatar
                                                                user={{
                                                                    id: (comment.userId as any)?._id || (comment.userId as any)?.id,
                                                                    username: (comment.userId as any)?.username,
                                                                    email: (comment.userId as any)?.email,
                                                                    name: (comment.userId as any)?.name,
                                                                }}
                                                                size={28}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                                                    {comment.userId?.username || "Traveler"}
                                                                    <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                                                                        {new Date(comment.dateCreated).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-900 dark:text-gray-200 mt-1 whitespace-pre-wrap">
                                                                    {comment.commentText}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
                                            <label className="text-sm font-medium text-gray-900 dark:text-gray-100" htmlFor="comment-box">Add a comment</label>
                                            <textarea
                                                id="comment-box"
                                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                                rows={3}
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
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Tip: Press Cmd/Ctrl + Enter to post.</p>
                                                <Button size="sm" onClick={handleAddComment} disabled={!user || commentSubmitting || !commentText.trim().length}>
                                                    {commentSubmitting ? "Posting..." : "Post comment"}
                                                </Button>
                                            </div>
                                            {!user && <p className="text-xs text-amber-600 dark:text-amber-400">Please log in to participate in the discussion.</p>}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </section>

                <AddStopModal open={openAdd} onClose={() => { setOpenAdd(false); setEditingStop(null); }} onSubmit={handleAddStop} initialStop={initialStop} />
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
