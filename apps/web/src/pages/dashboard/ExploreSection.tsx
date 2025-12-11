import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { Heart, MessageCircle, GitFork } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Option } from "../../components/ui/Select";
import { useSplashThumbnails } from "@/lib/splash/use-splash-thumbnails";
import {
    getPosts,
    toggleLike,
    addComment,
    Post,
    searchPosts,
} from "@/lib/posts/posts-api";
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
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
        {}
    );
    const [openComments, setOpenComments] = useState<Record<string, boolean>>(
        {}
    );

    // Manage sort option as a single Option object
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
        return () => {
            cancelled = true;
        };
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

    const handleCommentSubmit = async (postId: string) => {
        if (!user?.id) return;
        const text = commentInputs[postId]?.trim();
        if (!text) return;
        try {
            const updatedPost = await addComment(postId, user.id, text);
            setPosts((prev) =>
                prev.map((p) => (p._id === postId ? updatedPost : p))
            );
            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        } catch (err) {
            console.error(err);
        }
    };

    const trips = posts.map((p) => p.tripId);
    const thumbnails = useSplashThumbnails(trips);

    const filteredPosts = useMemo(() => {
        const sorted = [...posts];
        switch (sortOption.id) {
            case "likes":
                sorted.sort(
                    (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
                );
                break;
            case "forks":
                sorted.sort(
                    (a, b) => (b.forkCount || 0) - (a.forkCount || 0)
                );
                break;
            case "name":
                sorted.sort((a, b) =>
                    (a.tripId?.title || "").localeCompare(
                        b.tripId?.title || ""
                    )
                );
                break;
            default:
                break; // recent
        }
        return sorted;
    }, [posts, sortOption]);

    return (
        <div className="space-y-6">
            {/* Header + controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Explore trips
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Browse public trip ideas and adapt them for your own
                        plans.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                        placeholder="Search by city, destination, or trip title"
                        className="md:w-80 border-2 border-sky-100 dark:border-gray-600 focus-visible:ring-sky-500 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        value={query}
                        onChange={handleQueryChange}
                    />

                    <select
                        value={sortOption.id}
                        onChange={(e) => {
                            const selected = SORT_OPTIONS.find(
                                (opt) => opt.id === e.target.value
                            );
                            if (selected) setSortOption(selected);
                        }}
                        className="h-10 rounded-md border-2 border-sky-100 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm shadow-sm text-gray-900 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400">
                    Loading trips...
                </div>
            )}

            {/* Results grid */}
            {!isLoading && filteredPosts.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {filteredPosts.map((post) => {
                        const trip = post.tripId;
                        const thumb =
                            trip.thumbnail || thumbnails[trip._id] || null;
                        const isLiked = user?.id
                            ? post.likes.includes(user.id)
                            : false;
                        const showComments = openComments[post._id];

                        return (
                            <TripCard
                                key={post._id}
                                trip={trip}
                                thumbnailUrl={thumb}
                                onClick={() =>
                                    navigate(`/trip-circle/trip/${trip._id}`)
                                }
                                footer={
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLike(post._id);
                                                }}
                                                className="flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                                disabled={!user}
                                            >
                                                <Heart
                                                    className={`w-4 h-4 ${
                                                        isLiked
                                                            ? "fill-red-600 text-red-600 dark:fill-red-400 dark:text-red-400"
                                                            : ""
                                                    }`}
                                                />
                                                <span>{post.likeCount}</span>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <GitFork className="w-4 h-4" />
                                                <span>
                                                    {post.forkCount}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenComments((prev) => ({
                                                        ...prev,
                                                        [post._id]:
                                                            !prev[post._id],
                                                    }));
                                                }}
                                                className="flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 transition-colors disabled:opacity-50"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>
                                                    {post.commentCount}
                                                </span>
                                            </button>
                                        </div>

                                        {showComments && (
                                            <div
                                                className="space-y-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {post.comments?.length > 0 && (
                                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                        {post.comments
                                                            .slice(-3)
                                                            .map(
                                                                (comment) => (
                                                                    <div
                                                                        key={
                                                                            comment._id
                                                                        }
                                                                        className="rounded-md bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-sm"
                                                                    >
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                            {comment
                                                                                .userId
                                                                                ?.username ||
                                                                                "User"}
                                                                            :
                                                                        </span>{" "}
                                                                        <span className="text-gray-700 dark:text-gray-300">
                                                                            {
                                                                                comment.commentText
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder={
                                                            user
                                                                ? "Add a comment"
                                                                : "Log in to comment"
                                                        }
                                                        value={
                                                            commentInputs[
                                                                post._id
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setCommentInputs(
                                                                (p) => ({
                                                                    ...p,
                                                                    [post._id]:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {
                                                                e.preventDefault();
                                                                handleCommentSubmit(
                                                                    post._id
                                                                );
                                                            }
                                                        }}
                                                        disabled={!user}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleCommentSubmit(
                                                                post._id
                                                            )
                                                        }
                                                        disabled={
                                                            !user ||
                                                            !(
                                                                commentInputs[
                                                                    post._id
                                                                ]?.trim()
                                                                    .length
                                                            )
                                                        }
                                                    >
                                                        Post
                                                    </Button>
                                                </div>
                                                {!user && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Log in to add a
                                                        comment.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <Button
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(
                                                    `/trip-circle/trip/${trip._id}`
                                                );
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

            {/* Empty state */}
            {!isLoading && filteredPosts.length === 0 && (
                <div className="p-8 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm">
                    {query ? (
                        <>
                            No trips match{" "}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                "{query}"
                            </span>
                            . Try another search term.
                        </>
                    ) : (
                        "No public trips available yet."
                    )}
                </div>
            )}
        </div>
    );
}
