import { Heart, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Trip } from "@/lib/trips/trips-api";

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
        <Section
            title="Discussion"
            icon={<MessageCircle className="w-5 h-5 text-gray-500" />}
            className="mt-10"
            rightElement={post && (
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors" onClick={onLikeToggle} disabled={!user}>
                    <Heart className={`w-4 h-4 ${post.likes.includes(user?.id || "") ? "fill-red-600 text-red-600" : ""}`} />
                    <span>{post.likeCount}</span>
                </button>
            )}
        >
            <div className="w-full space-y-6">
                {!trip.isPublic ? (
                    <div className="p-8 text-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50">
                        <p className="text-sm text-gray-600">Comments are only available on public trips.</p>
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        {post?.comments.map((comment: any) => (
                            <div key={comment._id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                                <Avatar user={comment.userId} size={36} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold">{comment.userId?.username || "Traveler"}</span>
                                        <span className="text-[11px] text-gray-500">{new Date(comment.dateCreated).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.commentText}</p>
                                </div>
                            </div>
                        ))}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
                            <span className="text-sm font-semibold">Add a comment</span>
                            <textarea
                                className="w-full min-h-[120px] rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                placeholder={user ? "Share feedback..." : "Log in to comment"}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={!user || commentSubmitting}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-[11px] text-gray-500">Tip: Press Cmd/Ctrl + Enter to post.</p>
                                <Button onClick={onAddComment} disabled={!user || commentSubmitting || !commentText.trim()}>
                                    {commentSubmitting ? "Posting..." : "Post comment"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
}