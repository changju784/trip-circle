import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { useTripsContext } from "@/contexts/TripsContext";
import { TripCard } from "@/components/trip/TripCard";
import { AuthContext } from "@/components/auth/AuthProvider";
import { getPostByTrip, toggleLike, Post } from "@/lib/posts/posts-api";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";

export default function MyTripsSection() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { userTrips: trips, isLoading, error } = useTripsContext();
    const thumbnails = useSplashThumbnails(trips);

    // Store post data (social stats) for each trip
    const [postsData, setPostsData] = useState<Record<string, Post>>({});

    // Load social stats for these trips (only works if a post exists/is public)
    useEffect(() => {
        async function loadSocialStats() {
            const stats: Record<string, Post> = {};
            await Promise.all(
                trips.map(async (t) => {
                    try {
                        const post = await getPostByTrip(t._id);
                        if (post) stats[t._id] = post;
                    } catch (err) {
                        // Trip might be private or have no post, ignore
                    }
                })
            );
            setPostsData(stats);
        }

        if (trips.length > 0) {
            loadSocialStats();
        }
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

    return (
        <section className="space-y-5">
            {/* Header */}
            <div className="text-left">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    My trips
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Build your own private trips.
                </p>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400">
                    Loading your trips...
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="p-8 text-center rounded-xl border bg-red-50 dark:bg-gray-800 border-red-200 dark:border-red-500 shadow-sm text-red-700 dark:text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && trips.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-20 text-center shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="text-primary/40 text-5xl">📍</div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        No trips yet
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start planning your next adventure!
                    </p>
                    <Button onClick={() => navigate("/trip-circle/trip/new")}>
                        Create Trip
                    </Button>
                </div>
            )}

            {/* Trips grid */}
            {!isLoading && !error && trips.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {trips.map((trip) => {
                        const thumb = trip.thumbnail || thumbnails[trip._id] || null;
                        const post = postsData[trip._id];

                        return (
                            <TripCard
                                key={trip._id}
                                trip={trip}
                                thumbnailUrl={thumb}
                                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                                footer={
                                    <div className="space-y-3">
                                        <PostActivitySummary
                                            likeCount={post?.likeCount || 0}
                                            forkCount={post?.forkCount || 0}
                                            commentCount={post?.commentCount || 0}
                                            isLiked={user?.id ? post?.likes?.includes(user.id) : false}
                                            onLike={() => handleLike(trip._id)}
                                            onCommentClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                                        />

                                        <Button
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/trip-circle/trip/${trip._id}`);
                                            }}
                                        >
                                            View this trip
                                        </Button>
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}