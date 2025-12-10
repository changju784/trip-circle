import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Heart, MessageCircle, GitFork } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Trip } from "@/lib/trips/trips-api";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import { getPosts, toggleLike, addComment, Post, searchPosts } from "@/lib/posts/posts-api";
import { AuthContext } from "@/components/auth/AuthProvider";

function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

    const sameYear = start.getFullYear() === end.getFullYear();

    const startStr = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    });

    const endStr = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${startStr} – ${endStr}`;
}

function buildDestinationSummary(trip: Trip): string {
    const pieces: string[] = [];

    if (Array.isArray(trip.destinations) && trip.destinations.length > 0) {
        trip.destinations.forEach((dest) => {
            if (dest.label) {
                pieces.push(dest.label);
            }
        });
    }

    if (pieces.length === 0) return "Flexible destination";
    return pieces.join(" • ");
}

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
    const [sortOption, setSortOption] = useState<"recent" | "likes" | "forks" | "name">("recent");

    // debounced search (300ms delay after user stops typing)
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setDebouncedQuery(value);
        }, 300),
        []
    );

    // update query and trigger debounced search
    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    // fetch posts from backend
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
                    const msg = err instanceof Error ? err.message : "Failed to load posts";
                    setError(msg);
                    setPosts([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadPosts();
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    // Handle like toggle
    const handleLike = async (postId: string) => {
        if (!user?.id) return;

        try {
            const updatedPost = await toggleLike(postId, user.id);
            setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    // Handle comment submission
    const handleCommentSubmit = async (postId: string) => {
        if (!user?.id) return;
        const commentText = commentInputs[postId]?.trim();
        if (!commentText) return;

        try {
            const updatedPost = await addComment(postId, user.id, commentText);
            setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    // Thumbnail generation via reusable hook
    const trips = posts.map(p => p.tripId);
    const thumbnails = useSplashThumbnails(trips);

    const filteredPosts = useMemo(() => {
        const sorted = [...posts];
        switch (sortOption) {
            case "likes":
                sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                break;
            case "forks":
                sorted.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0));
                break;
            case "name":
                sorted.sort((a, b) => {
                    const aName = a.tripId?.title || "";
                    const bName = b.tripId?.title || "";
                    return aName.localeCompare(bName, undefined, { sensitivity: "base" });
                });
                break;
            default:
                // recent: preserve fetch order (backend returns newest first)
                break;
        }
        return sorted;
    }, [posts, sortOption]);

    return (
        <div className="space-y-6">
            {/* Header + search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-semibold text-gray-900">Explore trips</h2>
                    <p className="text-muted-foreground mt-1">
                        Browse public trip ideas and adapt them for your own plans.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                        placeholder="Search by city, destination, or trip title"
                        className="md:w-80 border-2 border-sky-100 focus-visible:ring-sky-500 shadow-sm bg-white"
                        value={query}
                        onChange={handleQueryChange}
                    />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                        className="h-10 rounded-md border border-input bg-white px-3 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                        <option value="recent">Most recent</option>
                        <option value="likes">Most liked</option>
                        <option value="forks">Most forked</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    Loading trips...
                </div>
            )}

            {/* Results */}
            {!isLoading && filteredPosts.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {filteredPosts.map((post) => {
                        const trip = post.tripId;
                        const dateRange = formatDateRange(trip.startDate, trip.endDate);
                        const destinationSummary = buildDestinationSummary(trip);

                        const explicitThumb = trip.thumbnail ?? null;
                        const generatedThumb = thumbnails[trip._id] ?? null;
                        const thumbnailUrl = explicitThumb || generatedThumb || null;

                        const isLiked = user?.id ? post.likes.includes(user.id) : false;
                        const showComments = openComments[post._id];

                        return (
                            <Card
                                key={post._id}
                                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {thumbnailUrl ? (
                                    <div className="h-32 w-full bg-gray-100">
                                        <div
                                            className="h-full w-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${thumbnailUrl})` }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
                                )}

                                <div className="p-5 flex flex-col justify-between flex-1">
                                    <div className="space-y-2 text-left">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {trip.title}
                                        </h3>

                                        {dateRange && (
                                            <p className="text-xs font-medium text-sky-700 bg-sky-50 inline-flex px-2 py-1 rounded-full">
                                                {dateRange}
                                            </p>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-1">
                                            {destinationSummary}
                                        </p>

                                        {trip.description && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                                {trip.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Engagement */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className="flex items-center gap-1 hover:text-red-600 transition-colors disabled:opacity-50"
                                                disabled={!user}
                                            >
                                                <Heart
                                                    className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`}
                                                />
                                                <span>{post.likeCount}</span>
                                            </button>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <GitFork className="w-4 h-4" />
                                                <span>{post.forkCount}</span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setOpenComments((prev) => ({
                                                        ...prev,
                                                        [post._id]: !prev[post._id],
                                                    }))
                                                }
                                                className="flex items-center gap-1 hover:text-sky-700 transition-colors disabled:opacity-50"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{post.commentCount}</span>
                                            </button>
                                        </div>

                                        {showComments && (
                                            <div className="space-y-2">
                                                {post.comments?.length > 0 && (
                                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                        {post.comments.slice(-3).map((comment) => (
                                                            <div
                                                                key={comment._id}
                                                                className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                                            >
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
                                                        onChange={(e) =>
                                                            setCommentInputs((prev) => ({
                                                                ...prev,
                                                                [post._id]: e.target.value,
                                                            }))
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleCommentSubmit(post._id);
                                                            }
                                                        }}
                                                        disabled={!user}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCommentSubmit(post._id)}
                                                        disabled={
                                                            !user || !(commentInputs[post._id]?.trim().length)
                                                        }
                                                    >
                                                        Post
                                                    </Button>
                                                </div>

                                                {!user && (
                                                    <p className="text-xs text-gray-500">
                                                        Log in to add a comment.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="mt-4 self-start"
                                        onClick={() => {
                                            navigate(`/trip-circle/trip/${trip._id}`);
                                        }}
                                    >
                                        View this trip
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredPosts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                    {query ? (
                        <>
                            No trips match{" "}
                            <span className="font-medium text-gray-900">"{query}"</span>. Try another search term.
                        </>
                    ) : (
                        "No public trips available yet."
                    )}
                </div>
            )}
        </div>
    );
}
