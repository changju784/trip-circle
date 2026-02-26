import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../schema/UserSchema.js';
import Trip from '../schema/TripSchema.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};


router.get('/', async (req, res) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'List all users'
  try {
    const users = await User.find().select('-password').sort({ dateCreated: -1 });
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
    const user = await User.findById(id).select('-password');
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const allowedUpdates = ['username', 'email'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  try {
    for (const field of Object.keys(updates)) {
      const value = updates[field];
      const existing = await User.findOne({ [field]: value, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If username was updated, issue a refreshed JWT that contains the current username
    if (updates.username) {
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({ user, token });
    }

    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


router.get('/:id/trips', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await User.findById(id).populate('trips');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.trips);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // remove user from all trips' members arrays
    await Trip.updateMany(
      { members: id },
      { $pull: { members: id } }
    );

    res.json({ message: 'User deleted', id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search/:query', async (req, res) => {
  const q = req.params.query.trim();

  if (!q) return res.json([]);

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).select("username email");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// POST /api/users/:id/follow — Follow a user
router.post('/:id/follow', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Follow a user'
  const targetId = String(req.params.id);
  const currentUserId = String(req.user.userId);

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (targetId === currentUserId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  try {
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.followers.map(String).includes(currentUserId)) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } });
    await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });

    res.json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// DELETE /api/users/:id/follow — Unfollow a user
router.delete('/:id/follow', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Unfollow a user'
  const targetId = String(req.params.id);
  const currentUserId = String(req.user.userId);

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (targetId === currentUserId) {
    return res.status(400).json({ error: 'You cannot unfollow yourself' });
  }

  try {
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (!target.followers.map(String).includes(currentUserId)) {
      return res.status(409).json({ error: 'You are not following this user' });
    }

    await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } });
    await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/users/:id/followers — Get a user's followers
router.get('/:id/followers', async (req, res) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get followers of a user'
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await User.findById(id).populate('followers', 'username name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/users/:id/following — Get users that a user follows
router.get('/:id/following', async (req, res) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get users followed by a user'
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await User.findById(id).populate('following', 'username name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


export default router;
