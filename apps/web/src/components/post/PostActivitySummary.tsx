import { Heart, MessageCircle, GitFork } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface PostActivitySummaryProps {
    user?: any;
    likeCount?: number;
    forkCount?: number;
    commentCount?: number;
    isLiked?: boolean;
    onLike?: () => void;
    onCommentClick?: () => void;
    isLoading?: boolean;
}

export function PostActivitySummary({
    user,
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
        <TooltipProvider>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">

                {/* 1. Like Action with Tooltip */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={!user ? "cursor-not-allowed" : ""}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike?.();
                                }}
                                disabled={!user}
                                className={cn(
                                    "flex items-center gap-1 hover:text-red-600 transition-colors",
                                    !user && "pointer-events-none opacity-70"
                                )}
                            >
                                <Heart
                                    className={cn(
                                        "w-4 h-4 transition-transform active:scale-125",
                                        isLiked ? "fill-red-600 text-red-600" : ""
                                    )}
                                />
                                <span className="font-medium">{likeCount}</span>
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>{user ? (isLiked ? "Unlike" : "Like this trip") : "Sign in to like this trip"}</p>
                    </TooltipContent>
                </Tooltip>

                {/* 2. Fork Stat (Informational Tooltip) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                            <GitFork className="w-4 h-4" />
                            <span className="font-medium">{forkCount}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Total forks of this trip</p>
                    </TooltipContent>
                </Tooltip>

                {/* 3. Comment Stat with Tooltip */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCommentClick?.();
                            }}
                            className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-medium">{commentCount}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>View discussion</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider >
    );
}