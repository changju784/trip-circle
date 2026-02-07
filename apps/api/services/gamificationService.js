import User from '../schema/UserSchema.js';
import Trip from '../schema/TripSchema.js';
import Post from '../schema/PostSchema.js';

const BADGES = [
    { id: 'first_trip', name: 'First Steps', icon: '🌱', condition: (stats) => stats.stopsAdded > 0 },
    { id: 'creator', name: 'Trip Creator', icon: '🗺️', condition: (stats) => stats.stopsAdded >= 10 },
    { id: 'frequent_flyer', name: 'Frequent Flyer', icon: '✈️', condition: (stats) => stats.stopsAdded >= 50 },
    { id: 'influencer', name: 'Influencer', icon: '🌟', condition: (stats) => stats.totalLikesReceived >= 10 },
    { id: 'trendsetter', name: 'Trendsetter', icon: '🔥', condition: (stats) => stats.tripsForked >= 5 },
];

export async function updateUserGamification(userId) {
    if (!userId) return;

    try {
        // 1. Calculate Stats
        // Get all trips where user is a member (simplification for "stops added")
        // Ideally we check ownership, but members[0] is usually owner.
        // We'll aggregate stops from all trips where user is a member.
        const userTrips = await Trip.find({ members: userId });

        let stopsAdded = 0;
        userTrips.forEach(trip => {
            trip.days.forEach(day => {
                stopsAdded += day.stops.length;
            });
        });

        // Get posts for these trips to count likes and forks
        // We need posts where userId is the author (owner of the trip context in the post)
        const userPosts = await Post.find({ userId: userId });

        let totalLikesReceived = 0;
        let tripsForked = 0;

        userPosts.forEach(post => {
            totalLikesReceived += post.likeCount || 0;
            tripsForked += post.forkCount || 0;
        });

        const tripScore = (totalLikesReceived * 10) + (tripsForked * 20) + stopsAdded;

        const stats = {
            tripScore,
            totalLikesReceived,
            tripsForked,
            stopsAdded
        };

        // 2. Check Badges
        const user = await User.findById(userId);
        if (!user) return;

        const currentBadges = user.badges || [];
        const currentBadgeIds = new Set(currentBadges.map(b => b.id));
        const newBadges = [];

        BADGES.forEach(badge => {
            if (!currentBadgeIds.has(badge.id) && badge.condition(stats)) {
                newBadges.push({
                    id: badge.id,
                    name: badge.name,
                    icon: badge.icon,
                    dateEarned: new Date()
                });
            }
        });

        // 3. Update User
        if (newBadges.length > 0 ||
            user.gamification.tripScore !== tripScore ||
            user.gamification.totalLikesReceived !== totalLikesReceived
        ) {
            await User.findByIdAndUpdate(userId, {
                $set: { gamification: stats },
                $push: { badges: { $each: newBadges } }
            });
        }

    } catch (err) {
        console.error('Error updating gamification:', err);
    }
}
