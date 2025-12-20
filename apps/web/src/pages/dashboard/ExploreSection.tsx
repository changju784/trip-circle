import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

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
    const [, setError] = useState<string | null>(null);

    // Manage sort option as a single Option object
    const [sortOption, setSortOption] = useState<Option>(SORT_OPTIONS[0]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                        <PostActivitySummary
                                            likeCount={post.likeCount}
                                            forkCount={post.forkCount}
                                            commentCount={post.commentCount}
                                            isLiked={isLiked}
                                            onLike={() => handleLike(post._id)}
                                        />

                                        <Button className="w-full" onClick={() => navigate(`/trip-circle/trip/${trip._id}`)}>
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
