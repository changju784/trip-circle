import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Flame, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Option } from "../../components/ui/Select";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import {
    getPosts,
    toggleLike,
    Post,
    searchPosts,
} from "@/lib/posts/posts-api";
import { AuthContext } from "@/components/auth/AuthProvider";
import { TripCard } from "@/components/trip/TripCard";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";

const SORT_OPTIONS: Option[] = [
    { id: "recent", label: "Most recent" },
    { id: "likes", label: "Most liked" },
    { id: "forks", label: "Most forked" },
    { id: "name", label: "Name (A-Z)" },
];

export default function ExploreSection() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<Option>(SORT_OPTIONS[0]);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setDebouncedQuery(value);
        }, 300),
        []
    );

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    useEffect(() => {
        let cancelled = false;
        async function loadPosts() {
            try {
                setIsLoading(true);
                setError(null);
                const result = debouncedQuery
                    ? await searchPosts(debouncedQuery)
                    : await getPosts();

                if (!cancelled) setPosts(result);
            } catch (err) {
                if (!cancelled) {
                    setPosts([]);
                    setError("Failed to load trips. Please try again.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadPosts();
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const handleLike = async (postId: string) => {
        if (!user?.id) return;
        try {
            const updatedPost = await toggleLike(postId, user.id);
            setPosts((prev) =>
                prev.map((p) => (p._id === postId ? updatedPost : p))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const trendingTrips = useMemo(() => {
        if (debouncedQuery) return [];
        return [...posts]
            .sort((a, b) => {
                const scoreA = (a.likeCount || 0) + (a.commentCount || 0) * 2;
                const scoreB = (b.likeCount || 0) + (b.commentCount || 0) * 2;
                return scoreB - scoreA;
            })
            .slice(0, 3);
    }, [posts, debouncedQuery]);

    const filteredPosts = useMemo(() => {
        const trendingIds = new Set(trendingTrips.map(t => t._id));
        let filtered = posts.filter(p => !trendingIds.has(p._id));

        switch (sortOption.id) {
            case "likes":
                filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                break;
            case "forks":
                filtered.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0));
                break;
            case "name":
                filtered.sort((a, b) => (a.tripId?.title || "").localeCompare(b.tripId?.title || ""));
                break;
            default: // recent
                break;
        }
        return filtered;
    }, [posts, sortOption, trendingTrips]);

    const allVisibleTrips = [...posts].map(p => p.tripId);
    const thumbnails = useSplashThumbnails(allVisibleTrips);

    const renderCard = (post: Post, isTrending = false) => {
        const trip = post.tripId;
        const thumb = trip.thumbnail || thumbnails[trip._id] || null;
        const isLiked = user?.id ? post.likes.includes(user.id) : false;

        return (
            <TripCard
                key={post._id}
                trip={trip}
                thumbnailUrl={thumb}
                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                footer={
                    <div className="space-y-3">
                        <PostActivitySummary
                            likeCount={post.likeCount}
                            forkCount={post.forkCount}
                            commentCount={post.commentCount}
                            isLiked={isLiked}
                            onLike={() => handleLike(post._id)}
                        />
                        <Button className="w-full" onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}>
                            View Trip
                        </Button>
                    </div>
                }
            />
        );
    };

    return (
        <div className="space-y-10">
            {/* Header + controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Explore trips</h2>
                    <p className="text-black/60 dark:text-white/40 text-sm">Browse and adapt public trip ideas.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                        placeholder="Search city or destination..."
                        className="md:w-80 border-2 border-sky-100 dark:border-gray-600"
                        value={query}
                        onChange={handleQueryChange}
                    />
                    <select
                        value={sortOption.id}
                        onChange={(e) => setSortOption(SORT_OPTIONS.find(o => o.id === e.target.value)!)}
                        className="h-10 rounded-md border-2 border-sky-100 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm shadow-sm"
                    >
                        {SORT_OPTIONS.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="p-4 text-red-600 bg-red-50 rounded-lg text-center">{error}</div>}

            {isLoading ? (
                <div className="p-20 text-center text-gray-500">Loading your next adventure...</div>
            ) : (
                <>
                    {/* Trending Section */}
                    {trendingTrips.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6 group">
                                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 fill-orange-500/20" />
                                <h3 className="text-lg font-bold uppercase tracking-tight text-gray-800 dark:text-gray-200">
                                    Trending Now
                                </h3>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                {trendingTrips.map(post => renderCard(post, true))}
                            </div>
                            <div className="mt-10 border-b border-gray-100 dark:border-gray-800" />
                        </section>
                    )}

                    {/* All Trips Feed */}
                    <section>
                        {trendingTrips.length > 0 && (
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest">Recent Discoveries</h3>
                        )}
                        {filteredPosts.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-3">
                                {filteredPosts.map(post => renderCard(post))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 italic">
                                {query ? `No results for "${query}"` : "Nothing here yet."}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}