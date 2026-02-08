import express from 'express';
import mongoose from 'mongoose';
import Post from '../schema/PostSchema.js';
import Trip from '../schema/TripSchema.js';
import { updateUserGamification } from '../services/gamificationService.js';
import { exploreTrips } from '../services/tripSearchService.js';

const router = express.Router();

// GET /api/posts - Get all posts (for explore feed)
router.get('/', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Get explore feed'
  // #swagger.description = 'Fetches a list of public trip posts with optional filters.'
  try {
    const { limit = 20, skip = 0, sort = 'recent', tags } = req.query;
    const tagArray = tags ? String(tags).split(',').filter(Boolean) : [];

    let postQuery = {};

    // Filter by tags if present
    if (tagArray.length > 0) {
      const matchingTrips = await Trip.find({
        tags: { $all: tagArray },
        isPublic: true
      }).select('_id');

      const tripIds = matchingTrips.map(t => t._id);
      postQuery.tripId = { $in: tripIds };
    }

    let sortOption = { dateCreated: -1 };
    if (sort === 'popular') {
      sortOption = { likeCount: -1, dateCreated: -1 };
    }

    const posts = await Post.find(postQuery)
      .populate('userId', 'username email')
      .populate('tripId')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const validPosts = posts.filter(post => post.tripId && post.tripId.isPublic);
    res.json(validPosts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/search?q=... - Search posts via associated trip fields and tags
router.get('/search', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Search posts'
  // #swagger.description = 'Searches for posts via trip titles, tags, and keywords.'
  try {
    const { q, tags, limit = 20, skip = 0 } = req.query;
    const limitNum = parseInt(String(limit));
    const skipNum = parseInt(String(skip));

    // Use the optimized tripSearchService
    const tripResults = await exploreTrips({
      q,
      tags,
      limitNum,
      skipNum
    });

    if (!tripResults || tripResults.length === 0) {
      return res.json([]);
    }

    const tripIds = tripResults.map(t => t._id);
    const orderMap = new Map(tripIds.map((id, idx) => [String(id), idx]));

    const posts = await Post.find({ tripId: { $in: tripIds } })
      .populate('userId', 'username email')
      .populate('tripId')
      .lean();

    // Maintain search relevance order from the aggregation result
    const validPosts = posts
      .filter(p => p.tripId && p.tripId.isPublic)
      .sort((a, b) => {
        const aIdx = orderMap.get(String(a.tripId._id)) ?? 0;
        const bIdx = orderMap.get(String(b.tripId._id)) ?? 0;
        return aIdx - bIdx;
      });

    res.json(validPosts);
  } catch (err) {
    console.error('Search posts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/:id - Get single post by ID
router.get('/:id', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Get a single post by ID'
  // #swagger.description = 'Fetches a specific post by its ID, including associated user and trip data.'
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/trip/:tripId - Get post by trip ID
router.get('/trip/:tripId', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Get post by trip ID'
  // #swagger.description = 'Fetches a post associated with a specific trip ID.'
  try {
    const post = await Post.findOne({ tripId: req.params.tripId })
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('Get post by trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/like - Toggle like on a post
router.post('/:id/like', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Toggle like on a post'
  // #swagger.description = 'Allows a user to like or unlike a post. The request body should contain the userId.'
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const likeIndex = post.likes.findIndex(id => id.equals(userIdObj));

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userIdObj);
      post.likeCount = post.likes.length;
    }

    await post.save();

    // Update gamification stats for the post author (trip owner)
    await updateUserGamification(post.userId);

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    res.json(updatedPost);
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/comments - Add a comment
router.post('/:id/comments', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Add a comment to a post'
  // #swagger.description = 'Allows a user to add a comment to a post. The request body should contain the userId and commentText.'
  try {
    const postId = req.params.id;
    const { userId, commentText } = req.body;

    if (!userId || !commentText || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId and commentText required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = {
      userId: new mongoose.Types.ObjectId(userId),
      commentText: commentText.trim(),
      dateCreated: new Date()
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    res.status(201).json(updatedPost);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/posts/:id/comments/:commentId - Delete a comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  // #swagger.tags = ['Social']
  // #swagger.summary = 'Delete a comment from a post'
  // #swagger.description = 'Allows a user to delete their own comment from a post. The request body should contain the userId for authorization.'
  try {
    const { id: postId, commentId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);

    if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

    if (post.comments[commentIndex].userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    post.comments.splice(commentIndex, 1);
    post.commentCount = post.comments.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    res.json(updatedPost);
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;