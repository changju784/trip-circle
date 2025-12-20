import { Heart, MessageCircle, GitFork } from "lucide-react";

interface PostActivitySummaryProps {
    likeCount?: number;
    forkCount?: number;
    commentCount?: number;
    isLiked?: boolean;
    onLike?: () => void;
    onCommentClick?: () => void;
    isLoading?: boolean;
}

export function PostActivitySummary({
    likeCount = 0,
    forkCount = 0,
    commentCount = 0,
    isLiked = false,
    onLike,
    onCommentClick,
    isLoading = false
}: PostActivitySummaryProps) {
    if (isLoading) return <div className="h-6 w-32 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />;

    return (
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {/* Like Stat */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onLike?.();
                }}
                className="flex items-center gap-1 hover:text-red-600 transition-colors"
            >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-red-600 text-red-600" : ""}`} />
                <span className="font-medium">{likeCount}</span>
            </button>

            {/* Fork Stat (Display Only) */}
            <div className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                <span className="font-medium">{forkCount}</span>
            </div>

            {/* Comment Stat */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCommentClick?.();
                }}
                className="flex items-center gap-1 hover:text-sky-600 transition-colors"
            >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{commentCount}</span>
            </button>
        </div>
    );
}