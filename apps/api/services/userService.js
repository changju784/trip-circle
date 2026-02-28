import bcrypt from 'bcrypt';
import User from '../schema/UserSchema.js';
import Trip from '../schema/TripSchema.js';

const SALT_ROUNDS = 10;

const sanitizeUser = (user) => {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};


export async function getAllUsers() {
    return await User.find().select('-password').sort({ dateCreated: -1 });
}


export async function getUserById(id) {
    return await User.findById(id).select('-password');
}


export async function createUser({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    return sanitizeUser(user);
}


export async function updateUser(id, updates) {
    // Check for duplicate email or username among other users
    for (const field of Object.keys(updates)) {
        const existing = await User.findOne({ [field]: updates[field], _id: { $ne: id } });
        if (existing) return { error: `DUPLICATE_${field.toUpperCase()}` };
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return null;
    return user;
}


export async function deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) return null;

    await Trip.updateMany({ members: id }, { $pull: { members: id } });
    return user;
}


export async function getUserTrips(id) {
    const user = await User.findById(id).populate('trips');
    if (!user) return null;
    return user.trips;
}


export async function searchUsers(query) {
    return await User.find({
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    }).select('username email');
}


export async function followUser(targetId, currentUserId) {
    if (targetId === currentUserId) return { error: 'SELF_FOLLOW' };

    const target = await User.findById(targetId);
    if (!target) return { error: 'USER_NOT_FOUND' };

    if (target.followers.map(String).includes(currentUserId)) {
        return { error: 'ALREADY_FOLLOWING' };
    }

    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } });
    await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });

    return { message: 'Followed successfully' };
}


export async function unfollowUser(targetId, currentUserId) {
    if (targetId === currentUserId) return { error: 'SELF_UNFOLLOW' };

    const target = await User.findById(targetId);
    if (!target) return { error: 'USER_NOT_FOUND' };

    if (!target.followers.map(String).includes(currentUserId)) {
        return { error: 'NOT_FOLLOWING' };
    }

    await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } });
    await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });

    return { message: 'Unfollowed successfully' };
}


export async function getFollowers(id) {
    const user = await User.findById(id).populate('followers', 'username name email');
    if (!user) return null;
    return user.followers;
}


export async function getFollowing(id) {
    const user = await User.findById(id).populate('following', 'username name email');
    if (!user) return null;
    return user.following;
}
