import { Heart, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Trip } from "@/lib/trips/trips-api";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TripDiscussionSectionProps {
    trip: Trip;
    user: any;
    post: any;
    loadingPost: boolean;
    commentText: string;
    setCommentText: (t: string) => void;
    onAddComment: () => void;
    onLikeToggle: () => void;
    commentSubmitting: boolean;
}

export function TripDiscussionSection({
    trip, user, post, loadingPost, commentText, setCommentText, onAddComment, onLikeToggle, commentSubmitting
}: TripDiscussionSectionProps) {
    return (
        <TooltipProvider>
            <Section
                title="Discussion"
                icon={<MessageCircle className="w-5 h-5 text-muted-foreground" />}
                className="mt-10"
                rightElement={post && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={!user ? "cursor-not-allowed" : ""}>
                                <button
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors group disabled:pointer-events-none"
                                    onClick={onLikeToggle}
                                    disabled={!user}
                                >
                                    <Heart className={cn(
                                        "w-4 h-4 transition-all",
                                        post.likes.includes(user?.id || "") ? "fill-red-500 text-red-500" : "group-hover:scale-110"
                                    )} />
                                    <span className="font-medium">{post.likeCount}</span>
                                </button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{user ? "Like this trip!" : "Sign in to like this trip"}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            >
                <div className="w-full space-y-6">
                    {!trip.isPublic ? (
                        <div className="p-10 text-center rounded-xl border-2 border-dashed border-muted bg-muted/20">
                            <p className="text-sm text-muted-foreground">Comments are only available on public trips.</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-6">
                            {/* 1. Comments Feed */}
                            <div className="space-y-3">
                                {post?.comments.map((comment: any) => (
                                    <div
                                        key={comment._id}
                                        className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm shadow-sm"
                                    >
                                        <Avatar user={comment.userId} size={36} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-bold text-foreground">
                                                    {comment.userId?.username || "Traveler"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(comment.dateCreated).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {comment.commentText}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 2. Input Area */}
                            <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm p-5 space-y-4 shadow-sm">
                                <span className="text-sm font-bold text-foreground">Join the conversation</span>

                                <textarea
                                    className="w-full min-h-[100px] rounded-lg border border-input bg-background/50 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all resize-none"
                                    placeholder={user ? "Share feedback, tips, or questions..." : "Please log in to leave a comment"}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            onAddComment();
                                        }
                                    }}
                                    disabled={!user || commentSubmitting}
                                />

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Tip: Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-sans">Cmd/Ctrl + Enter</kbd> to post.
                                    </p>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className={(!user || !commentText.trim()) ? "cursor-not-allowed" : ""}>
                                                <Button
                                                    onClick={onAddComment}
                                                    disabled={!user || commentSubmitting || !commentText.trim()}
                                                    className="w-full sm:w-auto px-6 rounded-full disabled:pointer-events-none"
                                                >
                                                    {commentSubmitting ? "Posting..." : "Post comment"}
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>
                                                {!user
                                                    ? "Sign in to leave a comment"
                                                    : !commentText.trim()
                                                        ? "Write something to comment"
                                                        : "Post your comment"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Section>
        </TooltipProvider>
    );
}