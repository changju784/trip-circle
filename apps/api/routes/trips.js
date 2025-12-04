import express from 'express';
import mongoose from 'mongoose';
import Trip from '../models/trip.js';
import User from '../models/user.js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find().sort({ dateCreated: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/trips/explore?q=searchterm
router.get('/explore', async (req, res) => {
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    const baseQuery = { isPublic: true };

    if (q && String(q).trim()) {
      const trips = await Trip.find(
        { ...baseQuery, $text: { $search: String(q) } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' }, dateCreated: -1 })
        .limit(parseInt(String(limit)))
        .skip(parseInt(String(skip)))
        .select('title description destinations startDate endDate thumbnail dateCreated')
        .lean();
      return res.json(trips);
    }

    const trips = await Trip.find(baseQuery)
      .sort({ dateCreated: -1 })
      .limit(parseInt(String(limit)))
      .skip(parseInt(String(skip)))
      .select('title description destinations startDate endDate thumbnail dateCreated')
      .lean();
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


router.post('/', async (req, res) => {
  const { title, description, destinations, isPublic, thumbnail, days, startDate, endDate, members } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'missing required fields: title, startDate, endDate' });
  }

  try {
    const trip = new Trip({ title, location, description, days, startDate, endDate, members });
    await trip.save();

    // add trip to each member's trips array
    if (members && Array.isArray(members) && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { $addToSet: { trips: trip._id } }
      );
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
      { $push: { members: userId } }, 
      { new: true});
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "tripcircle <no-reply@resend.dev>",
      to: email,
      subject: "New Trip Shared With You",
      html: `<p>The trip ${trip.title} has been shared with you and you are able to make edits!</p>`
    });

    res.json({ message: 'Trip shared successfully' });
  }
  catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/fork', async (req, res) => {
  const { tripId, userId } = req.body;

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

  const allowedUpdates = ['title', 'description', 'destinations', 'isPublic', 'thumbnail', 'days', 'startDate', 'endDate', 'members'];
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

    const trip = await Trip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
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

export default router;
