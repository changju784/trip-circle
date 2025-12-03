import express from 'express';
import mongoose from 'mongoose';
import Trip from '../models/trip.js';

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
    const trip = new Trip({ title, description, destinations, isPublic, thumbnail, days, startDate, endDate, members });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
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
    const trip = await Trip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
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
    res.json({ message: 'Trip deleted', id: trip._id });
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

export default router;
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
