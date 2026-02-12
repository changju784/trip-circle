import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import authMiddleware from '../middleware/auth.js';

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
  uploadDocument,
  deleteDocument,
  parseDocument
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
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Get all user trips'
  res.json(await getAllTrips());
});

router.get('/explore', async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Explore trips with search and filters'
  // #swagger.description = 'Fetches a list of public trips with optional search query and filters. Supports pagination and sorting.'
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

router.post('/', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Create a new trip'
  // #swagger.description = 'Creates a new trip with the provided details. Required fields: title, startDate, endDate.'
  if (!req.body.title || !req.body.startDate || !req.body.endDate) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  res.status(201).json(await createTrip(req.body));
});

router.post('/share', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Share a trip with another user'
  // #swagger.description = 'Shares a trip with another user by email. The request body should contain the tripId and the recipient email.'
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

router.post('/fork', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Fork a trip'
  // #swagger.description = 'Creates a copy of an existing trip under the user\'s account. The request body should contain the tripId of the trip to fork.'
  const trip = await forkTrip(req.body.tripId, req.user.userId, req.body);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.status(201).json({ message: 'Trip forked successfully', trip });
});

router.post('/backfill-posts', authMiddleware, async (_, res) => {
  res.json(await backfillPosts());
});

router.get('/:id', async (req, res) => {
  const trip = await getTripById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  const trip = await updateTrip(id, req.body);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid trip id' });
  }

  const trip = await deleteTrip(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ message: 'Trip deleted', id: trip._id });
});

router.post('/:id/documents', authMiddleware, upload.single('file'), async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'Upload trip document'
  // #swagger.description = 'Uploads an image or PDF (max 10MB) to the trip.'
  try {
    const trip = await uploadDocument({
      tripId: req.params.id,
      userId: req.user.userId,
      file: req.file
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

router.delete('/:id/documents/:documentId', authMiddleware, async (req, res) => {
  const trip = await deleteDocument({
    tripId: req.params.id,
    documentId: req.params.documentId
  });

  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

/**
 * @route POST /api/trips/:id/documents/:documentId/parse
 * @desc Triggers the AI OCR + LLM parsing pipeline for an existing document
 */
router.post('/:id/documents/:documentId/parse', authMiddleware, async (req, res) => {
  // #swagger.tags = ['Trips']
  // #swagger.summary = 'AI Document Parsing'
  // #swagger.description = 'Triggers the AI OCR pipeline to extract data from a document.'
  try {
    const { documentId } = req.params;

    // Trigger the intelligent pipeline
    const parsedDocument = await parseDocument(documentId);

    // Return the document with the new 'extractedData' for the frontend modal
    res.json(parsedDocument);
  } catch (err) {
    console.error("Parsing route error:", err);
    res.status(500).json({
      error: 'Failed to parse document',
      details: err.message
    });
  }
});

export default router;
