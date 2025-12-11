import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Heart, MessageCircle, GitFork } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Select, { Option } from "../../components/ui/Select";
import { useTrips } from "@/lib/trips/use-trips";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { getPosts, toggleLike, addComment, Post, searchPosts } from "@/lib/posts/posts-api";
import { AuthContext } from "@/components/auth/AuthProvider";
import { TripCard } from "@/components/trip/TripCard";

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
    const [, setError] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

    // Manage sort option as a single Option object
    const [sortOption, setSortOption] = useState<Option>(SORT_OPTIONS[0]);

    const debouncedSearch = useCallback(
        debounce((value: string) => { setDebouncedQuery(value); }, 300), []
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

                if (!cancelled) {
                    setPosts(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setPosts([]);
                    setError("Failed to load");
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
            setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
        } catch (err) { console.error(err); }
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!user?.id) return;
        const text = commentInputs[postId]?.trim();
        if (!text) return;
        try {
            const updatedPost = await addComment(postId, user.id, text);
            setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        } catch (err) { console.error(err); }
    };

    const trips = posts.map(p => p.tripId);
    const thumbnails = useSplashThumbnails(trips);

    const filteredPosts = useMemo(() => {
        const sorted = [...posts];
        switch (sortOption.id) {
            case "likes": sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)); break;
            case "forks": sorted.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0)); break;
            case "name": sorted.sort((a, b) => (a.tripId?.title || "").localeCompare(b.tripId?.title || "")); break;
            default: break; // recent
        }
        return sorted;
    }, [posts, sortOption]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-left text-muted-foreground">
                    <h2 className="text-2xl font-semibold">Explore trips</h2>
                    <p className="mt-1">Browse public trip ideas and adapt them for your own plans.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                        placeholder="Search by city, destination, or trip title"
                        className="md:w-80 border-2 border-sky-100 focus-visible:ring-sky-500 shadow-sm bg-white"
                        value={query}
                        onChange={handleQueryChange}
                    />

                    <div className="w-48">
                        <Select
                            value={sortOption}
                            onChange={(val) => {
                                if (val && !Array.isArray(val)) {
                                    setSortOption(val as Option);
                                }
                            }}
                            // Simple mock fetch that returns static options immediately
                            fetchOptions={async () => SORT_OPTIONS}
                            placeholder="Sort by..."
                        />
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    Loading trips...
                </div>
            )}

            {!isLoading && filteredPosts.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {filteredPosts.map((post) => {
                        const trip = post.tripId;
                        const thumb = trip.thumbnail || thumbnails[trip._id] || null;
                        const isLiked = user?.id ? post.likes.includes(user.id) : false;
                        const showComments = openComments[post._id];

                        return (
                            <TripCard
                                key={post._id}
                                trip={trip}
                                thumbnailUrl={thumb}
                                onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}
                                footer={
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}
                                                className="flex items-center gap-1 hover:text-red-600 transition-colors disabled:opacity-50"
                                                disabled={!user}
                                            >
                                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                                                <span>{post.likeCount}</span>
                                            </button>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <GitFork className="w-4 h-4" />
                                                <span>{post.forkCount}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }));
                                                }}
                                                className="flex items-center gap-1 hover:text-sky-700 transition-colors disabled:opacity-50"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{post.commentCount}</span>
                                            </button>
                                        </div>

                                        {showComments && (
                                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                                {post.comments?.length > 0 && (
                                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                        {post.comments.slice(-3).map((comment) => (
                                                            <div key={comment._id} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                                                <span className="font-semibold text-gray-800">
                                                                    {comment.userId?.username || "User"}:
                                                                </span>{" "}
                                                                {comment.commentText}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder={user ? "Add a comment" : "Log in to comment"}
                                                        value={commentInputs[post._id] ?? ""}
                                                        onChange={(e) => setCommentInputs(p => ({ ...p, [post._id]: e.target.value }))}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCommentSubmit(post._id); } }}
                                                        disabled={!user}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCommentSubmit(post._id)}
                                                        disabled={!user || !(commentInputs[post._id]?.trim().length)}
                                                    >
                                                        Post
                                                    </Button>
                                                </div>
                                                {!user && <p className="text-xs text-gray-500">Log in to add a comment.</p>}
                                            </div>
                                        )}

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

            {!isLoading && filteredPosts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    {query ? (
                        <>No trips match <span className="font-medium text-gray-900">"{query}"</span>. Try another search term.</>
                    ) : (
                        "No public trips available yet."
                    )}
                </div>
            )}
        </div>
    );
}