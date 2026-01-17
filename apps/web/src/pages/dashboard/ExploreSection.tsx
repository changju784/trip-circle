import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/Modal";
import { TripCard } from "@/components/trip/TripCard";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { getPosts, toggleLike, searchPosts, Post } from "@/lib/posts/posts-api";
import { AuthContext } from "@/components/auth/AuthProvider";
import { TRIP_TAGS } from "@/lib/const/trip-tags";
import { cn } from "@/lib/utils";
import type { Option } from "@/components/ui/Select";
import { TripSearchFilter } from "@/components/trip/TripSearchFilter";

const SORT_OPTIONS: Option[] = [
    { id: "recent", label: "Most recent" },
    { id: "likes", label: "Most liked" },
    { id: "forks", label: "Most forked" },
    { id: "name", label: "Name (A-Z)" },
];

const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
};

export default function ExploreSection() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get("q") || "";
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [sortOption, setSortOption] = useState<Option>(SORT_OPTIONS[0]);

    const isFiltering = !!query || activeTags.length > 0;

    useEffect(() => {
        let cancelled = false;
        async function loadPosts() {
            try {
                setIsLoading(true);
                const result = isFiltering
                    ? await searchPosts(query, activeTags)
                    : await getPosts();
                if (!cancelled) setPosts(result);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadPosts();
        return () => { cancelled = true; };
    }, [query, activeTags, isFiltering]);

    const handleSortUpdate = (id: string) => {
        const selected = SORT_OPTIONS.find(o => o.id === id)!;
        setSortOption(selected);
        setIsExpanded(true);
    };

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
        if (isExpanded || isFiltering) return [];
        return [...posts]
            .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
            .slice(0, 3);
    }, [posts, isExpanded, isFiltering]);

    const libraryPosts = useMemo(() => {
        const trendingIds = new Set(trendingTrips.map(t => t._id));
        let filtered = posts.filter(p => !trendingIds.has(p._id));

        switch (sortOption.id) {
            case "likes": filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)); break;
            case "forks": filtered.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0)); break;
            case "name": filtered.sort((a, b) => (a.tripId?.title || "").localeCompare(b.tripId?.title || "")); break;
            default: break;
        }
        return filtered;
    }, [posts, sortOption, trendingTrips]);

    const thumbnails = useSplashThumbnails(posts.map(p => p.tripId));

    // Helper to render cards consistently across Trending and Results sections
    const renderTripCard = (post: Post, isTrending = false) => {
        const isLiked = user?.id ? post.likes?.includes(user.id) : false;
        return (
            <TripCard
                key={post._id}
                trip={post.tripId}
                className={cn(!isExpanded && !isTrending && "min-w-[300px] md:min-w-[350px] snap-center")}
                thumbnailUrl={post.tripId.thumbnail || thumbnails[post.tripId._id]}
                onClick={() => navigate(`/trip-circle/trip/${post.tripId._id}`)}
                footer={
                    <div className="space-y-3">
                        <PostActivitySummary
                            likeCount={post.likeCount}
                            forkCount={post.forkCount}
                            commentCount={post.commentCount}
                            isLiked={isLiked}
                            onLike={() => handleLike(post._id)}
                        />
                        <Button
                            className="w-full"
                            onClick={() => navigate(`/trip-circle/trip/${post.tripId._id}`)}
                        >
                            View Trip
                        </Button>
                    </div>
                }
            />
        );
    };

    if (isLoading && posts.length === 0) {
        return <div className="p-20 text-center opacity-50 font-black uppercase tracking-widest text-xs dark:text-white text-zinc-500">Loading...</div>;
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="text-left">
                    <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">Explore</h2>
                    <p className="text-black/60 dark:text-white/40 text-sm">Discover itineraries</p>
                </div>

                <TripSearchFilter
                    activeTags={activeTags}
                    onToggleTag={(id) => {
                        setActiveTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
                        setIsExpanded(true);
                    }}
                    onOpenAdvanced={() => setIsFilterModalOpen(true)}
                    sortOption={sortOption}
                    sortOptions={SORT_OPTIONS}
                    onSortChange={handleSortUpdate}
                />
            </div>

            {/* Trending Section */}
            {trendingTrips.length > 0 && (
                <section className="space-y-6 px-2">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                        <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">Trending Now</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {trendingTrips.map(post => renderTripCard(post, true))}
                    </div>
                </section>
            )}

            {/* Public/Results Section */}
            <section className="space-y-6 px-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">
                            {isFiltering ? "Results" : "Public Trips"}
                        </h3>
                        {isFiltering && (
                            <button
                                onClick={() => { setActiveTags([]); setSearchParams({}); setIsExpanded(false); }}
                                className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                <X size={12} /> Clear Filters
                            </button>
                        )}
                    </div>
                    {!isFiltering && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[10px] font-bold uppercase tracking-widest dark:text-white/60 text-zinc-500"
                        >
                            {isExpanded ? "Show Less" : "See All"} {!isExpanded && <ChevronRight className="ml-1 w-4 h-4" />}
                        </Button>
                    )}
                </div>

                <div className={cn(
                    "transition-all duration-500",
                    isExpanded ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x"
                )}>
                    {libraryPosts.length > 0 ? (
                        libraryPosts.map(post => renderTripCard(post, false))
                    ) : (
                        <div className="w-full py-20 text-center border-2 border-dashed dark:border-white/5 border-zinc-200 rounded-3xl">
                            <p className="dark:text-white/40 text-zinc-400 italic text-sm font-black uppercase tracking-widest">No matches found.</p>
                        </div>
                    )}
                </div>
            </section>

            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Advanced Filters">
                <div className="space-y-8 p-2">
                    {["season", "group", "style", "activity"].map(cat => (
                        <div key={cat} className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white/30 text-zinc-500 ml-1">{cat}</h4>
                            <div className="flex flex-wrap gap-2">
                                {TRIP_TAGS.filter(t => t.category === cat).map(tag => {
                                    const isActive = activeTags.includes(tag.id);
                                    return (
                                        <Badge
                                            key={tag.id}
                                            onClick={() => setActiveTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                                            className={cn(
                                                "rounded-full px-4 py-2 cursor-pointer border-2 transition-all text-[10px] font-black uppercase",
                                                isActive
                                                    ? "border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                    : "dark:border-white/5 border-zinc-200 dark:bg-zinc-900 bg-zinc-100 dark:text-white/60 text-zinc-600"
                                            )}
                                        >
                                            <tag.icon size={12} className={cn("mr-2", isActive ? "text-blue-500" : "text-zinc-400")} />
                                            {tag.label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <Button
                        onClick={() => setIsFilterModalOpen(false)}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20"
                    >
                        Apply All Filters
                    </Button>
                </div>
            </Modal>
        </div>
    );
}