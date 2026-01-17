import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import { useTrips } from "@/lib/trips/use-trips";
import { useTripsContext } from "@/contexts/TripsContext";
import { useAuth } from "@/auth/hook/use-auth";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Trip } from "@/lib/trips/trips-api";
import { getPostByTrip, toggleLike, addComment, type Post } from "@/lib/posts/posts-api";

import { TripOverviewSection } from "./sections/TripOverviewSection";
import { TripItinerarySection } from "./sections/TripItinerarySection";
import { TripDiscussionSection } from "./sections/TripDiscussionSection";

import StopDetailModal from "@/components/trip/StopDetailModal";
import ShareTripModal from "@/components/trip/ShareTripModal";
import Receipts from "@/components/trip/Receipts";
import { Section } from "@/components/ui/Section";

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTrip, updateTrip, shareTrip } = useTrips();
    const { deleteTrip } = useTripsContext();
    const { user } = useAuth();

    const [trip, setTrip] = useState<Trip | null>(null);
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
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load trip");
            } finally {
                if (!cancelled) setLoadingTrip(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [id, getTrip, refreshKey]);

    // ---------------- LOAD POST ----------------
    useEffect(() => {
        if (!trip?._id || !trip.isPublic) {
            setPost(null);
            return;
        }
        let cancelled = false;
        const loadPost = async () => {
            try {
                setLoadingPost(true);
                const data = await getPostByTrip(trip._id);
                if (!cancelled) setPost(data);
            } catch (err) {
                if (!cancelled) setPost(null);
            } finally {
                if (!cancelled) setLoadingPost(false);
            }
        };
        loadPost();
        return () => { cancelled = true; };
    }, [trip?._id, trip?.isPublic, refreshKey]);

    // ---------------- HELPERS ----------------
    const isOwner = Boolean(user && trip?.members?.some((m: any) => String(m) === String(user.id)));
    const initialStop = useMemo(() => {
        if (!editingStop || !trip) return null;
        for (const d of trip.days || []) {
            const s = d.stops.find((x: any) => x.id === editingStop);
            if (s) return s;
        }
        return null;
    }, [editingStop, trip]);

    // ---------------- HANDLERS ----------------
    const handleLikeToggle = async () => {
        if (!user?.id || !post?._id) return;
        try {
            const updated = await toggleLike(post._id, user.id);
            setPost(updated);
        } catch (err) { console.error(err); }
    };

    const handleAddComment = async () => {
        if (!user?.id || !post?._id || !commentText.trim()) return;
        try {
            setCommentSubmitting(true);
            const updated = await addComment(post._id, user.id, commentText.trim());
            setPost(updated);
            setCommentText("");
        } catch (err) { console.error(err); } finally { setCommentSubmitting(false); }
    };

    const handleAddStop = async (data: any, stopId?: string | null) => {
        if (!id || !trip) return;
        const days = JSON.parse(JSON.stringify(trip.days || []));
        if (stopId) {
            for (const d of days) {
                const idx = d.stops.findIndex((s: any) => s.id === stopId);
                if (idx >= 0) { d.stops[idx] = { ...d.stops[idx], ...data }; break; }
            }
        } else {
            if (!days[selectedDay]) days[selectedDay] = { stops: [] };
            days[selectedDay].stops.push({ id: Math.random().toString(36).slice(2, 9), ...data });
        }
        await updateTrip(id, { days });
        setRefreshKey(prev => prev + 1);
        setEditingStop(null);
        setOpenAdd(false);
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!id || !trip) return;
        const days = trip.days.map((d: any) => ({ ...d, stops: d.stops.filter((s: any) => s.id !== stopId) }));
        await updateTrip(id, { days });
        setRefreshKey(prev => prev + 1);
    };

    const handleReorderStops = async (dayIndex: number, reorderedStops: any[]) => {
        if (!id || !trip) return;
        const updatedDays = [...trip.days];
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], stops: reorderedStops };
        setTrip({ ...trip, days: updatedDays });
        updateTrip(id, { days: updatedDays }).catch(console.error);
    };

    if (loadingTrip) return <div className="min-h-screen p-10 text-center text-gray-600">Loading trip...</div>;
    if (error || !trip) return <div className="min-h-screen p-10 text-center text-red-600">{error || "Trip not found"}</div>;

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-screen-xl mx-auto px-6 pt-6"><BackToDashboardButton /></div>
            <main className="max-w-screen-xl mx-auto px-6 mt-4">
                <TripOverviewSection
                    trip={trip} isOwner={isOwner} user={user} post={post}
                    onShare={() => setShareOpen(true)}
                    onDelete={() => setOpenDeleteModal(true)}
                    onLikeToggle={handleLikeToggle}
                />

                <TripItinerarySection
                    trip={trip} isOwner={isOwner} selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                    onOpenAdd={(idx) => { setSelectedDay(idx); setEditingStop(null); setOpenAdd(true); }}
                    onEditStop={(sId) => { setEditingStop(sId); setOpenAdd(true); }}
                    onDeleteStop={handleDeleteStop}
                    onReorderStops={handleReorderStops}
                />

                {isOwner && (
                    <Section title="Documents & Receipts">
                        <Receipts tripId={trip._id} receipts={trip.receipts || []} onReceiptsChange={(t) => setTrip(t)} />
                    </Section>
                )}

                <TripDiscussionSection
                    trip={trip} user={user} post={post} loadingPost={loadingPost}
                    commentText={commentText} setCommentText={setCommentText}
                    onAddComment={handleAddComment} onLikeToggle={handleLikeToggle}
                    commentSubmitting={commentSubmitting}
                />

                {/* MODALS */}
                <StopDetailModal open={openAdd} onClose={() => { setOpenAdd(false); setEditingStop(null); }} onSubmit={handleAddStop} initialStop={initialStop} readOnly={!isOwner} cityContexts={trip?.destinations} />
                <ShareTripModal open={shareOpen} onClose={() => setShareOpen(false)} onShare={async (email) => { await shareTrip(trip._id, email); setShareOpen(false); setRefreshKey(k => k + 1); }} />
                <Modal title="Delete Trip?" isOpen={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={async () => { await deleteTrip(trip._id); navigate("/trip-circle/dashboard"); }}>Delete</Button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}