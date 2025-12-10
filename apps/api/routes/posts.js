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

// GET /api/posts/search?q=... - Search posts via associated trip fields
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    const query = String(q || '').trim();
    const limitNum = parseInt(String(limit));
    const skipNum = parseInt(String(skip));

    if (!query) {
      return res.json([]);
    }

    // dynamic score threshold: lower for short queries, higher for long ones
    const minScore = query.length <= 3 ? 0.5 : 1;

    // Search trips (public only) using Atlas Search, then fetch posts for those trips
    const tripResults = await Trip.aggregate([
      {
        $search: {
          index: 'trip_search',
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: 'title',
                  score: { boost: { value: 10 } },
                  fuzzy: { maxEdits: 1 }
                }
              },
              {
                autocomplete: {
                  query,
                  path: 'destinations.label',
                  score: { boost: { value: 5 } },
                  fuzzy: { maxEdits: 1 }
                }
              },
              {
                autocomplete: {
                  query,
                  path: 'description',
                  score: { boost: { value: 1 } },
                  fuzzy: { maxEdits: 1 }
                }
              },
              {
                text: {
                  query,
                  path: 'title',
                  score: { boost: { value: 8 } },
                  fuzzy: { maxEdits: 2 }
                }
              },
              {
                text: {
                  query,
                  path: 'destinations.label',
                  score: { boost: { value: 4 } },
                  fuzzy: { maxEdits: 2 }
                }
              },
              {
                text: {
                  query,
                  path: 'description',
                  score: { boost: { value: 0.5 } },
                  fuzzy: { maxEdits: 2 }
                }
              }
            ],
            filter: [
              { equals: { path: 'isPublic', value: true } }
            ],
            minimumShouldMatch: 1
          }
        }
      },
      { $addFields: { score: { $meta: 'searchScore' } } },
      { $match: { score: { $gte: minScore } } },
      { $limit: limitNum + skipNum },
      { $skip: skipNum },
      {
        $project: {
          title: 1,
          description: 1,
          destinations: 1,
          startDate: 1,
          endDate: 1,
          thumbnail: 1,
          dateCreated: 1,
          members: 1
        }
      }
    ]);

    const tripIds = tripResults.map(t => t._id);
    if (tripIds.length === 0) {
      return res.json([]);
    }

    const orderMap = new Map(tripIds.map((id, idx) => [String(id), idx]));

    const posts = await Post.find({ tripId: { $in: tripIds } })
      .populate('userId', 'username email')
      .populate('tripId')
      .lean();

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
