import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';

import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  forkTrip,
  backfillPosts
} from '../services/tripService.js';

import {
  uploadReceipt,
  deleteReceipt
} from '../services/documentService.js';

import {
  exploreTrips,
  autocompleteTrips
} from '../services/tripSearchService.js';

dotenv.config();
const router = express.Router();

/* ---------- multer ---------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'application/pdf'
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type'));
  }
});

/* ---------- routes ---------- */

router.get('/', async (_, res) => {
  res.json(await getAllTrips());
});

router.get('/explore', async (req, res) => {
  const { q, limit = 20, skip = 0 } = req.query;
  const trips = await exploreTrips({
    q,
    limitNum: Number(limit),
    skipNum: Number(skip)
  });
  res.json(trips);
});

router.get('/search/autocomplete', async (req, res) => {
  res.json(await autocompleteTrips(String(req.query.q || '').trim()));
});

router.post('/', async (req, res) => {
  if (!req.body.title || !req.body.startDate || !req.body.endDate) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  res.status(201).json(await createTrip(req.body));
});

router.post('/share', async (req, res) => {
  const { tripId, email } = req.body;

  if (!tripId || !email) {
    return res.status(400).json({
      error: 'Missing required fields: tripId, email'
    });
  }

  try {
    const result = await shareTrip({ tripId, email });

    if (result?.error === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: 'User with provided email not found'
      });
    }

    if (result?.error === 'TRIP_NOT_FOUND') {
      return res.status(404).json({
        error: 'Trip not found'
      });
    }

    return res.json({
      message: 'Trip shared successfully'
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }
});

router.post('/fork', async (req, res) => {
  const trip = await forkTrip(req.body.tripId, req.user.userId, req.body);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.status(201).json({ message: 'Trip forked successfully', trip });
});

router.post('/backfill-posts', async (_, res) => {
  res.json(await backfillPosts());
});

router.put('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  const trip = await updateTrip(id, req.body);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

router.delete('/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  const trip = await deleteTrip(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ message: 'Trip deleted', id: trip._id });
});

router.get('/:id', async (req, res) => {
  const trip = await getTripById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

router.post('/:id/receipts', upload.single('receipt'), async (req, res) => {
  const trip = await uploadReceipt({
    tripId: req.params.id,
    file: req.file,
    dayDate: req.body.dayDate
  });

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.status(201).json(trip);
});

router.delete('/:id/receipts/:receiptId', async (req, res) => {
  const trip = await deleteReceipt({
    tripId: req.params.id,
    receiptId: req.params.receiptId
  });

  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

export default router;
