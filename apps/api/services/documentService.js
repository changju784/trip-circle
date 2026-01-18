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
export async function parseDocument(documentId) {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error("Document not found");

    // Set to processing to show spinner in UI
    doc.status = 'processing';
    await doc.save();

    try {
        // 1. OCR Stage: Converts pixels/PDF to raw text string
        const rawText = await extractText(doc.url);

        // 2. LLM Stage: Extracts categories, times, and locations using Gemini
        const parsedResults = await parseDocumentText(rawText);

        // 3. Persistence: Save the structured JSON for the 'Edit Stop' modal
        doc.extractedData = parsedResults;
        doc.status = 'parsed';
        doc.rawText = rawText;

        await doc.save();
        return doc;
    } catch (err) {
        console.error(`AI Parsing failed for doc ${documentId}:`, err);
        doc.status = 'failed';
        await doc.save();
        throw err;
    }
}