import { useState, useEffect } from "react";
import { getPostByTrip, toggleLike, addComment, type Post } from "@/lib/posts/posts-api";

export function useTripDiscussion(tripId?: string, isPublic?: boolean) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        if (!tripId || !isPublic) {
            setPost(null);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const data = await getPostByTrip(tripId);
                if (!cancelled) setPost(data);
            } catch (err) {
                console.error("Post load error", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [tripId, isPublic]);

    const handleLike = async (userId: string) => {
        if (!post?._id) return;
        const updated = await toggleLike(post._id, userId);
        setPost(updated);
    };

    const handleComment = async (userId: string) => {
        if (!post?._id || !commentText.trim()) return;
        const updated = await addComment(post._id, userId, commentText.trim());
        setPost(updated);
        setCommentText("");
    };

    return { post, loading, commentText, setCommentText, handleLike, handleComment };
}