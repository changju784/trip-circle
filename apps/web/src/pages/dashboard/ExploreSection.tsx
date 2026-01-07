import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Flame, ChevronRight, Search } from "lucide-react";

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
    const [isExpanded, setIsExpanded] = useState(false);
    const [sortOption, setSortOption] = useState<Option>(SORT_OPTIONS[0]);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setDebouncedQuery(value);
            // Auto-expand if user is searching to show all results
            if (value) setIsExpanded(true);
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
                    setError("Failed to load trips.");
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

    // Calculate Trending (Mixed score of likes and comments)
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

    // Library Feed (deduplicated from trending)
    const libraryPosts = useMemo(() => {
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
            default: break;
        }
        return filtered;
    }, [posts, sortOption, trendingTrips]);

    const thumbnails = useSplashThumbnails(posts.map(p => p.tripId));

    const renderCard = (post: Post, isTrending = false) => {
        const trip = post.tripId;
        const thumb = trip.thumbnail || thumbnails[trip._id] || null;
        const isLiked = user?.id ? post.likes?.includes(user.id) : false;

        return (
            <TripCard
                key={post._id}
                trip={trip}
                thumbnailUrl={thumb}
                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                className={!isExpanded && !isTrending ? "min-w-[300px] md:min-w-[350px] snap-center" : ""}
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

    if (isLoading) return <div className="p-20 text-center opacity-50 font-black uppercase tracking-widest text-xs">Loading the world...</div>;

    return (
        <div className="space-y-12">
            {/* Header + Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">Explore</h2>
                    <p className="text-black/60 dark:text-white/40 text-sm">Discover and remix public itineraries</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                        <Input
                            placeholder="Search destination..."
                            className="pl-10 md:w-72 border-2 border-black/5 dark:border-white/10"
                            value={query}
                            onChange={handleQueryChange}
                        />
                    </div>
                    <select
                        value={sortOption.id}
                        onChange={(e) => setSortOption(SORT_OPTIONS.find(o => o.id === e.target.value)!)}
                        className="h-10 rounded-md border-2 border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-sm font-bold uppercase tracking-widest"
                    >
                        {SORT_OPTIONS.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            {/* TRENDING SECTION */}
            {!isExpanded && trendingTrips.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                        <h3 className="text-xl font-black uppercase tracking-tighter">Trending Now</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3 px-2">
                        {trendingTrips.map(post => renderCard(post, true))}
                    </div>
                </section>
            )}

            {/* MAIN LIBRARY SECTION */}
            <section className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">
                            {debouncedQuery ? `Results for "${debouncedQuery}"` : "Public Trips"}
                        </h3>
                    </div>
                    {!debouncedQuery && libraryPosts.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs uppercase tracking-widest font-bold"
                        >
                            {isExpanded ? "Show Less" : "See All"}
                            {!isExpanded && <ChevronRight className="ml-1 w-4 h-4" />}
                        </Button>
                    )}
                </div>

                <div className={
                    isExpanded
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2"
                        : "flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x px-2"
                }>
                    {libraryPosts.length > 0 ? (
                        libraryPosts.map(post => renderCard(post))
                    ) : (
                        <p className="px-2 text-black/40 dark:text-white/40 italic">No trips found here yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}