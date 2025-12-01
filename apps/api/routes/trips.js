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


router.post('/', async (req, res) => {
  const { title, location, description, days, startDate, endDate, editors } = req.body;

  if (!title || !location || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields: title, location, startDate, endDate' });
  }

  try {
    const trip = new Trip({ title, location, description, days, startDate, endDate, editors });
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

  const allowedUpdates = ['title', 'location', 'description', 'days', 'startDate', 'endDate', 'editors'];
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

export default router;
