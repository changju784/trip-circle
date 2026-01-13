import { Link } from "react-router-dom";
import { Copy, Edit3, Share, Trash2, Loader2, Wallet, Calendar, MapPin, Globe, Lock } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Avatar";
import { PostActivitySummary } from "@/components/post/PostActivitySummary";
import { useGetTripBudgetInfo } from "../hooks/use-get-trip-budget-info";
import { useGetTripOwners } from "../hooks/use-get-trip-owners";
import { useWeather } from "@/lib/weather/use-weather";
import { TAG_CONFIG } from "@/lib/const/trip-tags";
import { cn } from "@/lib/utils";
import { Trip } from "@/lib/trips/trips-api";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
    const { data: weatherData, loading: weatherLoading } = useWeather(trip.destinations?.[0]?.label, trip.startDate);

    return (
        <TooltipProvider delayDuration={200}>
            <Section
                title={trip.title}
                rightElement={
                    <div className="flex items-center gap-1">
                        {isOwner ? (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onShare}>
                                            <Share size={16} className="text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share Trip</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to={`/trip-circle/trip/${trip._id}/edit`}>
                                            <Button variant="ghost" size="sm" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                                <Edit3 size={16} className="text-muted-foreground hover:text-foreground" />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Details</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:bg-red-500/10" onClick={onDelete}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Trip</TooltipContent>
                                </Tooltip>
                            </>
                        ) : (
                            trip.isPublic && user && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={onFork} size="sm" className="rounded-full px-6 shadow-lg shadow-blue-500/20 font-black uppercase text-[10px] tracking-widest flex gap-2 items-center">
                                            <Copy size={14} /> Copy Trip
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clone to My Trips</TooltipContent>
                                </Tooltip>
                            )
                        )}
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* 1. PRIMARY METADATA ROW */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-sky-500" />
                            <span className="text-foreground font-medium">{trip.destinations?.[0]?.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="opacity-70" />
                            <span>{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</span>
                        </div>

                        {weatherLoading ? (
                            <Loader2 className="animate-spin size-3 text-zinc-400" />
                        ) : weatherData?.status === 'success' && (
                            <div className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                                    {weatherData.condition} {Math.round(weatherData.temp || 0)}°
                                </span>
                            </div>
                        )}

                        <div className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            trip.isPublic ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                            {trip.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            {trip.isPublic ? "Public" : "Private"}
                        </div>

                        {trip.isPublic && (
                            <PostActivitySummary
                                likeCount={post?.likeCount} forkCount={post?.forkCount} commentCount={post?.commentCount}
                                isLiked={post?.likes.includes(user?.id || "")} onLike={onLikeToggle}
                            />
                        )}
                    </div>

                    {/* 2. DESCRIPTION */}
                    {trip.description && (
                        <p className="text-base text-muted-foreground/80 max-w-3xl font-light italic leading-relaxed">
                            "{trip.description}"
                        </p>
                    )}

                    {/* 3. RE-DESIGNED BUDGET STATS */}
                    {tripBudgetInfo && (
                        <div className="max-w-xl space-y-3 pt-2">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-2 text-muted-foreground/60">
                                    <Wallet size={12} />
                                    <span>Budget Progress</span>
                                </div>
                                <span className={tripBudgetInfo.isOverBudget ? "text-red-500" : "text-emerald-500"}>
                                    ${tripBudgetInfo.total.toLocaleString()} / ${tripBudgetInfo.limit.toLocaleString()}
                                </span>
                            </div>
                            <Progress
                                value={tripBudgetInfo.percentUsed}
                                className="h-1.5 bg-muted"
                                indicatorClassName={tripBudgetInfo.isOverBudget ? "bg-red-500" : "bg-emerald-500"}
                            />
                        </div>
                    )}

                    {/* 4. TAGS & CONTRIBUTORS */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex flex-wrap gap-2">
                            {trip.tags?.map((tagId) => {
                                const config = TAG_CONFIG[tagId as keyof typeof TAG_CONFIG];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <Badge key={tagId} variant="outline" className="bg-muted/30 border-muted text-muted-foreground py-1 hover:text-foreground transition-all">
                                        <Icon size={12} className="mr-1.5 opacity-70" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{config.label}</span>
                                    </Badge>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-widest">Team</span>
                            <div className="flex -space-x-2">
                                {owner && <Avatar user={owner} size={28} className="ring-2 ring-background shadow-sm" showPopover />}
                                {contributors.map((c) => <Avatar key={c.id} user={c} size={28} className="ring-2 ring-background hover:z-10 transition-all shadow-sm" showPopover />)}
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </TooltipProvider>
    );
}