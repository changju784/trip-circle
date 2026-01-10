import { useAuth } from "@/auth/hook/use-auth";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useEffect } from 'react';
import { UserBadge } from '@/components/profile/UserBadge';

export default function ProfilePage() {
    const { user } = useAuth();
    const [likedPosts, setLikedPosts] = useState([]);
    const [fullUser, setFullUser] = useState<any>(null);

    useEffect(() => {
        if (user?.id) {
            // Fetch full user details to get gamification stats and badges
            // The user object from useAuth might be a JWT payload only, so we refresh it
            fetch(`/api/users/${user.id}`).then(res => res.json()).then(data => setFullUser(data));

            // Fetch liked posts
            fetch(`/api/posts/liked?userId=${user.id}`)
                .then(res => res.json())
                .then(data => setLikedPosts(data))
                .catch(err => console.error(err));
        }
    }, [user?.id]);

    if (!user) return null;

    const stats = fullUser?.gamification || { tripScore: 0, totalLikesReceived: 0, tripsForked: 0, stopsAdded: 0 };
    const badges = fullUser?.badges || [];

    return (
        <div className="min-h-screen">
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />

                {/* Profile Header & Stats */}
                <div className="bg-card p-6 rounded-lg shadow-sm border mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                        <Avatar user={{ id: user.id, username: user.username, email: user.email, name: user.name }} size={96} />
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.username || user.name || "Traveler"}</h2>
                            <p className="text-sm text-muted-foreground mb-4">Joined {new Date(user.dateCreated || Date.now()).toLocaleDateString()}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-primary/5 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-primary">{stats.tripScore}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">TripScore</div>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{stats.totalLikesReceived}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{stats.tripsForked}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Forks</div>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{stats.stopsAdded}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Stops</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badges Section */}
                    {badges.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Badges</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {badges.map((badge: any) => (
                                    <UserBadge key={badge.id} badge={badge} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-medium">{user.email || "-"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">User ID</div>
                            <div className="font-medium break-all text-xs">{user.id}</div>
                        </div>
                    </div>
                </div>

                {/* Liked Trips Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Liked Trips</h3>
                    {likedPosts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground bg-card rounded-lg border border-dashed">
                            <p>No liked trips yet. Go explore!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {likedPosts.map((post: any) => (
                                <div key={post._id} className="bg-card rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {post.tripId.thumbnail && (
                                        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${post.tripId.thumbnail})` }} />
                                    )}
                                    <div className="p-4">
                                        <h4 className="font-medium truncate">{post.tripId.title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.tripId.description}</p>
                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>By {post.userId?.username || 'Unknown'}</span>
                                            <span>❤️ {post.likeCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


