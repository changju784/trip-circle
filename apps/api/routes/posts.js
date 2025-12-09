import express from 'express';
import mongoose from 'mongoose';
import Post from '../schema/PostSchema.js';
import Trip from '../schema/TripSchema.js';

const router = express.Router();

// GET /api/posts - Get all posts (for explore feed)
router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0, sort = 'recent' } = req.query;

    let sortOption = { dateCreated: -1 }; // Default: most recent
    if (sort === 'popular') {
      sortOption = { likeCount: -1, dateCreated: -1 };
    }

    const posts = await Post.find()
      .populate('userId', 'username email')
      .populate('tripId')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Filter out posts where trip doesn't exist or isn't public
    const validPosts = posts.filter(post => post.tripId && post.tripId.isPublic);

    res.json(validPosts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/:id - Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/trip/:tripId - Get post by trip ID
router.get('/trip/:tripId', async (req, res) => {
  try {
    const post = await Post.findOne({ tripId: req.params.tripId })
      .populate('userId', 'username email')
      .populate('tripId')
      .populate('comments.userId', 'username');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Get post by trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/like - Toggle like on a post
router.post('/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const likeIndex = post.likes.findIndex(id => id.equals(userIdObj));

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      // Like
      post.likes.push(userIdObj);
      post.likeCount = post.likes.length;
    }

    await post.save();

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

// POST /api/posts/:id/comments - Add a comment to a post
router.post('/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, commentText } = req.body;

    if (!userId || !commentText) {
      return res.status(400).json({ error: 'userId and commentText required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

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

// DELETE /api/posts/:id/comments/:commentId - Delete a comment from a post
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user owns the comment
    if (post.comments[commentIndex].userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
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
