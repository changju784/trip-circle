import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { useTripsContext } from "@/contexts/TripsContext";
import { TripCard } from "@/components/trip/TripCard";
import { HeroTripCard } from "@/components/trip/HeroTripCard";
import { AuthContext } from "@/components/auth/AuthProvider";
import { getPostByTrip, toggleLike, Post } from "@/lib/posts/posts-api";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";
import { useGetHeroTrip } from "../trip/hooks/use-get-hero-trip";
import { ChevronRight } from "lucide-react";

export default function MyTripsSection() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { userTrips: trips, isLoading, error } = useTripsContext();
    const thumbnails = useSplashThumbnails(trips);

    const [postsData, setPostsData] = useState<Record<string, Post>>({});
    const [isExpanded, setIsExpanded] = useState(false);

    const heroTrip = useGetHeroTrip(trips);

    const sortedGridTrips = useMemo(() => {
        return [...trips]
            .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
            .filter(t => t._id !== heroTrip?._id);
    }, [trips, heroTrip]);

    const sortedAllTrips = useMemo(() => {
        return [...trips].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
    }, [trips]);

    useEffect(() => {
        async function loadSocialStats() {
            const stats: Record<string, Post> = {};
            await Promise.all(
                trips.map(async (t) => {
                    try {
                        const post = await getPostByTrip(t._id);
                        if (post) stats[t._id] = post;
                    } catch (err) { /* ignore */ }
                })
            );
            setPostsData(stats);
        }
        if (trips.length > 0) loadSocialStats();
    }, [trips]);

    const handleLike = async (tripId: string) => {
        const post = postsData[tripId];
        if (!user?.id || !post?._id) return;
        try {
            const updatedPost = await toggleLike(post._id, user.id);
            setPostsData((prev) => ({ ...prev, [tripId]: updatedPost }));
        } catch (err) {
            console.error("Failed to like trip", err);
        }
    };

    if (isLoading) return <div className="p-20 text-center opacity-50 font-black uppercase tracking-widest text-xs">Loading adventures...</div>;
    if (error) return <div className="p-20 text-center text-red-500 font-bold uppercase text-xs">Error: {error}</div>;

    const renderTripCard = (trip: any) => {
        const thumb = trip.thumbnail || thumbnails[trip._id] || null;
        const post = postsData[trip._id];
        return (
            <TripCard
                key={trip._id}
                trip={trip}
                thumbnailUrl={thumb}
                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                className={!isExpanded ? "min-w-[300px] md:min-w-[350px] snap-center" : ""}
                footer={
                    <div className="space-y-4 pt-2">
                        <PostActivitySummary
                            likeCount={post?.likeCount || 0}
                            forkCount={post?.forkCount || 0}
                            commentCount={post?.commentCount || 0}
                            isLiked={user?.id ? post?.likes?.includes(user.id) : false}
                            onLike={() => handleLike(trip._id)}
                            onCommentClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                        />
                        <Button className="w-full" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trip-circle/trip/${trip._id}`);
                        }}>
                            Edit Itinerary
                        </Button>
                    </div>
                }
            />
        );
    };

    return (
        <section className="space-y-12">
            {/* HERO SECTION */}
            <div className="space-y-4">
                <div className="px-2">
                    <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">Up Next</h2>
                    <p className="text-black/60 dark:text-white/40 text-xs">
                        {trips.length > 0 ? "Your most imminent travel plan" : "Your world is waiting"}
                    </p>
                </div>
                <HeroTripCard
                    trip={heroTrip ? {
                        ...heroTrip,
                        thumbnail: heroTrip.thumbnail || thumbnails[heroTrip._id] || null
                    } : undefined}
                />
            </div>

            {/* LIBRARY SECTION */}
            {trips.length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                        <div>
                            <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">Your Collections</h2>
                            <p className="text-black/60 dark:text-white/40 text-sm">Manage your past and future collections</p>
                        </div>
                        {sortedGridTrips.length > 0 && (
                            <Button
                                variant="ghost"
                                size={"sm"}
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs uppercase tracking-widest font-bold"
                            >
                                {isExpanded ? "Close" : "Show All"}
                                {!isExpanded && <ChevronRight size={16} />}
                            </Button>
                        )}
                    </div>

                    <div className={
                        isExpanded
                            ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                            : "flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x px-2"
                    }>
                        {(isExpanded ? sortedAllTrips : sortedGridTrips).map(renderTripCard)}
                    </div>
                </div>
            )}
        </section>
    );
}