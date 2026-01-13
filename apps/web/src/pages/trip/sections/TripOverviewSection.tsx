import { Link } from "react-router-dom";
import { Copy, Edit3, Share, Trash2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Avatar";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";
import { useGetTripBudgetInfo } from "../hooks/use-get-trip-budget-info";
import { useGetTripOwners } from "../hooks/use-get-trip-owners";
import { TAG_CONFIG } from "@/lib/const/trip-tags";
import { cn } from "@/lib/utils";
import { Trip } from "@/lib/trips/trips-api";

interface TripOverviewSectionProps {
    trip: Trip;
    isOwner: boolean;
    user: any;
    post: any;
    onShare: () => void;
    onDelete: () => void;
    onLikeToggle: () => void;
    onFork: () => void;
}

export function TripOverviewSection({ trip, isOwner, user, post, onShare, onDelete, onLikeToggle, onFork }: TripOverviewSectionProps) {
    const { owner, contributors } = useGetTripOwners(trip);
    const tripBudgetInfo = useGetTripBudgetInfo(trip);

    return (
        <Section
            title={trip.title}
            rightElement={
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
                    {isOwner ? (
                        <>
                            <Button variant="secondary" size="sm" className="rounded-full h-9 px-4 flex gap-2 items-center transition-all" onClick={onShare}>
                                <Share size={15} strokeWidth={2.5} /> <span className="hidden sm:inline">Share</span>
                            </Button>
                            <Link to={`/trip-circle/trip/${trip._id}/edit`}>
                                <Button variant="outline" size="sm" className="rounded-full h-9 px-4 border border-white/10 hover:border-blue-500/50 transition-all flex gap-2 items-center">
                                    <Edit3 size={15} strokeWidth={2.5} /> <span className="hidden sm:inline">Edit</span>
                                </Button>
                            </Link>
                            <Button variant="destructive" size="sm" className="rounded-full h-9 px-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex gap-2 items-center" onClick={onDelete}>
                                <Trash2 size={15} strokeWidth={2.5} /> <span className="hidden sm:inline">Delete</span>
                            </Button>
                        </>
                    ) : (
                        trip.isPublic && user && (
                            <Button variant="primary" size="sm" className="rounded-full h-10 px-6 shadow-lg shadow-blue-500/20 font-black uppercase text-[10px] tracking-widest flex gap-2 items-center" onClick={onFork}>
                                <Copy size={16} strokeWidth={3} /> Copy Trip
                            </Button>
                        )
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-col gap-1">
                        {trip.destinations?.slice(0, 3).map((d: any) => (
                            <div key={d.id} className="flex items-center gap-1">
                                <span>📍</span> <span className="text-gray-900 dark:text-gray-100">{d.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />
                    <div className="flex items-center gap-2">📅 {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${trip.isPublic ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        <span>{trip.isPublic ? "🌍" : "🔒"}</span> {trip.isPublic ? "Public" : "Private"}
                    </div>
                    <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />
                    {trip.isPublic && (
                        <PostActivitySummary
                            likeCount={post?.likeCount} forkCount={post?.forkCount} commentCount={post?.commentCount}
                            isLiked={post?.likes.includes(user?.id || "")} onLike={onLikeToggle}
                        />
                    )}
                </div>

                {trip.description && <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed italic">{trip.description}</p>}

                {trip.tags && trip.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {trip.tags.map((tagId) => {
                            const config = TAG_CONFIG[tagId as keyof typeof TAG_CONFIG];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <Badge key={tagId} variant="outline" className={cn("flex items-center w-fit gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all", "bg-zinc-100 border-zinc-200 text-zinc-700", "dark:bg-zinc-900/40 dark:border-white/5 dark:text-white/80")}>
                                    <Icon size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                                </Badge>
                            );
                        })}
                    </div>
                )}

                {tripBudgetInfo && (
                    <div className="mt-6 p-5 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 max-w-2xl shadow-sm">
                        <div className="flex justify-between items-end mb-3">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Trip Budget Status</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${tripBudgetInfo.total.toLocaleString()}</span>
                                    {isOwner && <span className="text-sm text-gray-500">spent of ${tripBudgetInfo.limit.toLocaleString()}</span>}
                                </div>
                            </div>
                            {isOwner && (
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{tripBudgetInfo.isOverBudget ? "Over Budget" : "Remaining"}</p>
                                    <span className={cn("text-lg font-bold", tripBudgetInfo.isOverBudget ? "text-red-600" : "text-emerald-600")}>
                                        {tripBudgetInfo.isOverBudget ? "+" : ""}${Math.abs(tripBudgetInfo.remaining).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                        {isOwner && (
                            <>
                                <Progress value={tripBudgetInfo.percentUsed} className="h-2" indicatorClassName={tripBudgetInfo.isOverBudget ? "bg-red-500" : "bg-emerald-500"} />
                                {tripBudgetInfo.isOverBudget && <p className="text-[11px] text-red-500 mt-2 font-medium">⚠️ Careful! You've exceeded your set budget.</p>}
                            </>
                        )}
                        {!isOwner && (
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${tripBudgetInfo.total.toLocaleString()}</span>
                                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600">Estimated Price</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 font-medium">Contributors:</span>
                    <div className="flex -space-x-2 isolate">
                        {owner && <Avatar user={owner} size={28} className="ring-2 ring-white z-30" showPopover />}
                        {contributors.map((c) => <Avatar key={c.id} user={c} size={28} className="ring-2 ring-white z-20 hover:z-40 transition-all" showPopover />)}
                    </div>
                </div>
            </div>
        </Section>
    );
}