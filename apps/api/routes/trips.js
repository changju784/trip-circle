import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Trip from '../schema/TripSchema.js';
import User from '../schema/UserSchema.js';
import Post from '../schema/PostSchema.js';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { uploadToBlob, deleteFromBlob } from '../utils/blobStorage.js';

const router = express.Router();
dotenv.config();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find().sort({ dateCreated: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/trips/explore?q=searchterm
// uses atlas search for autocomplete + weighted relevance scoring
router.get('/explore', async (req, res) => {
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    const limitNum = parseInt(String(limit));
    const skipNum = parseInt(String(skip));

    // no query - return recent public trips
    if (!q || !String(q).trim()) {
      const trips = await Trip.find({ isPublic: true })
        .sort({ dateCreated: -1 })
        .limit(limitNum)
        .skip(skipNum)
        .select('title description destinations startDate endDate thumbnail dateCreated members')
        .lean();
      return res.json(trips);
    }

    const searchQuery = String(q).trim();

    // dynamic score threshold: lower for short queries, higher for long ones
    // short queries (1-3 chars) are often partial matches with lower scores
    const minScore = searchQuery.length <= 3 ? 0.5 : 1;

    // atlas search with autocomplete + fuzzy matching for typo tolerance
    const trips = await Trip.aggregate([
      {
        $search: {
          index: 'trip_search', // name of your atlas search index
          compound: {
            should: [
              // autocomplete for prefix matching (search-as-you-type)
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'title',
                  score: { boost: { value: 10 } }, // title weight: 10x
                  fuzzy: { maxEdits: 1 } // allow 1 character typo
                }
              },
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'destinations.label',
                  score: { boost: { value: 5 } }, // destinations weight: 5x
                  fuzzy: { maxEdits: 1 }
                }
              },
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'description',
                  score: { boost: { value: 1 } }, // description weight: 1x
                  fuzzy: { maxEdits: 1 }
                }
              },
              // text search for whole word matching (better for typos in complete words)
              {
                text: {
                  query: searchQuery,
                  path: 'title',
                  score: { boost: { value: 8 } },
                  fuzzy: { maxEdits: 2 } // allow up to 2 character typos for text search
                }
              },
              {
                text: {
                  query: searchQuery,
                  path: 'destinations.label',
                  score: { boost: { value: 4 } },
                  fuzzy: { maxEdits: 2 }
                }
              },
              {
                text: {
                  query: searchQuery,
                  path: 'description',
                  score: { boost: { value: 0.5 } },
                  fuzzy: { maxEdits: 2 }
                }
              }
            ],
            filter: [
              { equals: { path: 'isPublic', value: true } }
            ],
            minimumShouldMatch: 1 // require at least one should clause to match
          }
        }
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' }
        }
      },
      {
        $match: {
          score: { $gte: minScore } // dynamic threshold based on query length
        }
      },
      {
        $limit: limitNum + skipNum // get enough to support skip
      },
      {
        $skip: skipNum
      },
      {
        $project: {
          title: 1,
          description: 1,
          destinations: 1,
          startDate: 1,
          endDate: 1,
          thumbnail: 1,
          dateCreated: 1,
          members: 1,
          score: 1
        }
      }
    ]);

    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/trips/search/autocomplete?q=prefix
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    const query = String(q || '').trim();
    if (!query || query.length < 2) return res.json([]);

    const suggestions = await Trip.find({
      isPublic: true,
      $or: [
        { title: { $regex: `^${query}`, $options: 'i' } },
        { 'destinations.label': { $regex: query, $options: 'i' } }
      ]
    })
      .limit(5)
      .select('title destinations')
      .lean();

    const results = new Set();
    suggestions.forEach(t => {
      if (t.title) results.add(t.title);
      (t.destinations || []).forEach(d => {
        if (d?.label && d.label.toLowerCase().includes(query.toLowerCase())) {
          results.add(d.label);
        }
      });
    });

    res.json(Array.from(results).slice(0, 5));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

function generateDays(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const days = [];

  const current = new Date(s);
  while (current <= e) {
    days.push({
      date: current.toISOString(),
      stops: []
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}


router.post('/', async (req, res) => {
  const { title, description, destinations, isPublic, thumbnail, days, startDate, endDate, budget, members } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'missing required fields: title, startDate, endDate' });
  }

  try {
    const days = generateDays(startDate, endDate);

    const trip = new Trip({
      title,
      description: description || "",
      destinations: destinations || [],
      isPublic: isPublic ?? false,
      thumbnail: thumbnail || null,
      days,
      startDate,
      endDate,
      members
    });

    await trip.save();

    // sync members
    if (members?.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { $addToSet: { trips: trip._id } }
      );
    }

    // Create post if trip is public
    if (isPublic && members?.length > 0) {
      try {
        const post = new Post({
          tripId: trip._id,
          userId: members[0], // First member is the owner
          likes: [],
          comments: [],
          forkCount: 0,
          likeCount: 0,
          commentCount: 0
        });
        await post.save();
      } catch (postErr) {
        console.error('Failed to create post for public trip:', postErr);
        // Don't fail the trip creation if post creation fails
      }
    }

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


router.post('/share', async (req, res) => {
  const { tripId, email } = req.body;

  if (!tripId || !email) {
    return res.status(400).json({ error: 'Missing required fields: tripId, email' });
  }

  try {
    const userId = await User.findOne({ email }).select('_id');
    if (!userId) {
      return res.status(404).json({ error: 'User with provided email not found' });
    }
    const trip = await Trip.findByIdAndUpdate(tripId,
      { $addToSet: { members: userId } },
      { new: true });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await User.findByIdAndUpdate(userId,
      { $addToSet: { trips: tripId } },
      { new: true });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "tripcircle <no-reply@resend.dev>",
      to: email,
      subject: "New Trip Shared With You",
      html: `<p>The trip ${trip.title} has been shared with you and you are able to make edits!</p>`
    });

    if (result.data) {
      return res.json({ message: 'Trip shared successfully' });
    }
    else {
      return res.status(result.error.statusCode).json({ message: result.error.message });
    }
  }
  catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/fork', async (req, res) => {
  const { tripId } = req.body;
  const userId = req.user.userId;

  if (!tripId || !userId) {
    return res.status(400).json({ error: "Missing required fields: tripId, userId" });
  }

  try {
    // Find the original trip
    const originalTrip = await Trip.findById(tripId);
    if (!originalTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Create a plain JS object clone
    const tripData = originalTrip.toObject();

    // Remove the original _id so MongoDB generates a new one
    delete tripData._id;

    // Override the members field
    tripData.members = [userId];

    // Optionally: update fields like title so the clone is distinguishable
    tripData.title = `${tripData.title} (Copy)`;

    // Create a new trip document
    const newTrip = new Trip(tripData);
    await newTrip.save();

    await User.findByIdAndUpdate(userId,
      { $addToSet: { trips: newTrip._id } },
      { new: true });

    res.status(201).json({
      message: "Trip forked successfully",
      trip: newTrip
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  const allowedUpdates = ['title', 'description', 'destinations', 'isPublic', 'thumbnail', 'days', 'startDate', 'endDate', 'budget', 'members'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  try {
    const oldTrip = await Trip.findById(id);
    if (!oldTrip) return res.status(404).json({ error: 'Trip not found' });

    // if members are being updated, sync with users
    if (updates.members !== undefined) {
      const oldMembers = oldTrip.members.map(m => m.toString());
      const newMembers = updates.members.map(m => String(m));

      // find members to add and remove
      const membersToAdd = newMembers.filter(m => !oldMembers.includes(m));
      const membersToRemove = oldMembers.filter(m => !newMembers.includes(m));

      // add trip to new members
      if (membersToAdd.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToAdd } },
          { $addToSet: { trips: id } }
        );
      }

      // remove trip from removed members
      if (membersToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToRemove } },
          { $pull: { trips: id } }
        );
      }
    }

    // Handle post creation/deletion when isPublic changes
    if (updates.isPublic !== undefined && updates.isPublic !== oldTrip.isPublic) {
      const finalMembers = updates.members || oldTrip.members;

      if (updates.isPublic && finalMembers.length > 0) {
        // Trip becoming public - create post if it doesn't exist
        try {
          const existingPost = await Post.findOne({ tripId: id });
          if (!existingPost) {
            const post = new Post({
              tripId: id,
              userId: finalMembers[0],
              likes: [],
              comments: [],
              forkCount: 0,
              likeCount: 0,
              commentCount: 0
            });
            await post.save();
          }
        } catch (postErr) {
          console.error('Failed to create post for public trip:', postErr);
        }
      } else if (!updates.isPublic) {
        // Trip becoming private - delete post if it exists
        try {
          await Post.findOneAndDelete({ tripId: id });
        } catch (postErr) {
          console.error('Failed to delete post for private trip:', postErr);
        }
      }
    }

    const trip = await Trip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// POST /api/trips/backfill-posts - Create posts for all public trips that don't have one
// This route must come before /:id to avoid route conflicts
router.post('/backfill-posts', async (req, res) => {
  try {
    // Find all public trips with members
    const publicTrips = await Trip.find({
      isPublic: true,
      members: { $exists: true, $ne: [] }
    });

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const trip of publicTrips) {
      try {
        // Check if post already exists
        const existingPost = await Post.findOne({ tripId: trip._id });
        if (existingPost) {
          skipped++;
          continue;
        }

        // Create new post
        const post = new Post({
          tripId: trip._id,
          userId: trip.members[0],
          likes: [],
          comments: [],
          forkCount: 0,
          likeCount: 0,
          commentCount: 0
        });
        await post.save();
        created++;
      } catch (err) {
        errors.push({ tripId: trip._id, error: err.message });
      }
    }

    res.json({
      message: 'Backfill completed',
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({ error: 'Backfill failed', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // remove trip from all members' trips arrays
    await User.updateMany(
      { _id: { $in: trip.members } },
      { $pull: { trips: id } }
    );

    res.json({ message: 'Trip deleted', id: trip._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/trips/:id/receipts - Upload receipt to trip
router.post('/:id/receipts', upload.single('receipt'), async (req, res) => {
  const tripId = String(req.params.id);

  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `receipts/${tripId}/${timestamp}-${req.file.originalname}`;

    // Upload to Vercel Blob
    const { url } = await uploadToBlob(
      req.file.buffer,
      filename,
      req.file.mimetype
    );

    // Create receipt object
    const receipt = {
      id: `receipt-${timestamp}`,
      name: req.file.originalname,
      url,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      dayDate: req.body.dayDate ? new Date(req.body.dayDate) : null
    };

    // Add receipt to trip
    trip.receipts.push(receipt);
    await trip.save();

    // Return the full updated trip object
    res.status(201).json(trip);
  } catch (err) {
    console.error('Receipt upload error:', err);
    res.status(500).json({
      error: 'Failed to upload receipt',
      details: err.message
    });
  }
});

// DELETE /api/trips/:id/receipts/:receiptId - Delete receipt from trip
router.delete('/:id/receipts/:receiptId', async (req, res) => {
  const tripId = String(req.params.id);
  const receiptId = String(req.params.receiptId);

  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Find the receipt
    const receiptIndex = trip.receipts.findIndex(r => r.id === receiptId);
    if (receiptIndex === -1) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const receipt = trip.receipts[receiptIndex];

    // Delete from Vercel Blob
    try {
      await deleteFromBlob(receipt.url);
    } catch (blobErr) {
      console.error('Failed to delete from blob storage:', blobErr);
      // Continue anyway to remove from database
    }

    // Remove receipt from trip
    trip.receipts.splice(receiptIndex, 1);
    await trip.save();

    // Return the full updated trip object
    res.json(trip);
  } catch (err) {
    console.error('Receipt deletion error:', err);
    res.status(500).json({
      error: 'Failed to delete receipt',
      details: err.message
    });
  }
});

export default router;
