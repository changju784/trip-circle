import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/auth.js';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserTrips,
    searchUsers,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
} from '../services/userService.js';

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


router.get('/', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'List all users'
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/:id', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get user by ID'
    // #swagger.description = 'Fetches a user\'s details by their unique ID. The response excludes the password field.'
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const user = await getUserById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Create a new user'
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Missing required fields: email, password, username' });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const user = await createUser({ username, email, password });
        res.status(201).json(user);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


router.put('/:id', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Update a user'
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    const allowedUpdates = ['username', 'email'];
    const updates = {};
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.email && !emailRegex.test(updates.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const result = await updateUser(id, updates);

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.error === 'DUPLICATE_USERNAME') return res.status(409).json({ error: 'Username already exists' });
        if (result.error === 'DUPLICATE_EMAIL') return res.status(409).json({ error: 'Email already exists' });

        if (updates.username) {
            const token = jwt.sign(
                { userId: result._id, email: result.email, username: result.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.json({ user: result, token });
        }

        res.json(result);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


router.get('/:id/trips', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get trips for a user'
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const trips = await getUserTrips(id);
        if (!trips) return res.status(404).json({ error: 'User not found' });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.delete('/:id', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Delete a user'
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const user = await deleteUser(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', id: user._id });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/search/:query', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Search users by username or email'
    const q = req.params.query.trim();
    if (!q) return res.json([]);

    try {
        const users = await searchUsers(q);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/:id/follow', authMiddleware, async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Follow a user'
    const targetId = String(req.params.id);
    const currentUserId = String(req.user.userId);

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const result = await followUser(targetId, currentUserId);
        if (result.error === 'SELF_FOLLOW') return res.status(400).json({ error: 'You cannot follow yourself' });
        if (result.error === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
        if (result.error === 'ALREADY_FOLLOWING') return res.status(409).json({ error: 'Already following this user' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.delete('/:id/follow', authMiddleware, async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Unfollow a user'
    const targetId = String(req.params.id);
    const currentUserId = String(req.user.userId);

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const result = await unfollowUser(targetId, currentUserId);
        if (result.error === 'SELF_UNFOLLOW') return res.status(400).json({ error: 'You cannot unfollow yourself' });
        if (result.error === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
        if (result.error === 'NOT_FOLLOWING') return res.status(409).json({ error: 'You are not following this user' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/:id/followers', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get followers of a user'
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const followers = await getFollowers(id);
        if (!followers) return res.status(404).json({ error: 'User not found' });
        res.json(followers);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/:id/following', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get users followed by a user'
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const following = await getFollowing(id);
        if (!following) return res.status(404).json({ error: 'User not found' });
        res.json(following);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


export default router;
