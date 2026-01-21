import Trip from '../schema/TripSchema.js';
import Document from '../schema/DocumentSchema.js';
import { uploadToBlob, deleteFromBlob } from '../utils/blobStorage.js';
import { extractText } from '../utils/ocrEngine.js';
import { parseDocumentText } from '../utils/llmParser.js';

export async function uploadDocument({ tripId, userId, file }) {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    const timestamp = Date.now();
    const filename = `documents/${tripId}/${timestamp}-${file.originalname}`;

    const { url } = await uploadToBlob(file.buffer, filename, file.mimetype);

    const newDoc = await Document.create({
        tripId,
        userId,
        name: file.originalname,
        url,
        contentType: file.mimetype,
        size: file.size,
        status: 'uploaded'
    });

    trip.documents.push(newDoc._id);
    await trip.save();

    return Trip.findById(tripId).populate('documents');
}

export async function deleteDocument({ tripId, documentId }) {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    const doc = await Document.findById(documentId);
    if (!doc) return false;

    // Delete from storage and DB in parallel for speed
    await Promise.all([
        deleteFromBlob(doc.url).catch(err => console.error("Blob deletion failed:", err)),
        Document.findByIdAndDelete(documentId)
    ]);

    trip.documents = trip.documents.filter(id => id.toString() !== documentId);
    await trip.save();

    return Trip.findById(tripId).populate('documents');
}

/**
 * Main AI Pipeline: OCR -> LLM -> Structured Data
 */
// services/documentService.js
export async function parseDocument(documentId) {
    // Populate tripId to get dates and destinations
    const doc = await Document.findById(documentId).populate('tripId');
    if (!doc) throw new Error("Document not found");

    doc.status = 'processing';
    await doc.save();

    try {
        const rawText = await extractText(doc.url);

        // Build the context object for the AI
        const tripContext = {
            startDate: doc.tripId.startDate,
            endDate: doc.tripId.endDate,
            destinations: doc.tripId.destinations
        };

        // Pass context to the parser
        const parsedResults = await parseDocumentText(rawText, tripContext);

        doc.extractedData = parsedResults;
        doc.status = 'parsed';
        doc.rawText = rawText;

        await doc.save();
        return doc;
    } catch (err) {
        doc.status = 'failed';
        await doc.save();
        throw err;
    }
}