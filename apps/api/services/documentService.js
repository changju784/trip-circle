import Trip from '../schema/TripSchema.js';
import Document from '../schema/DocumentSchema.js';
import { uploadToBlob, deleteFromBlob } from '../utils/blobStorage.js';

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

    try {
        await deleteFromBlob(doc.url);
    } catch (err) {
        console.error("Blob deletion failed:", err);
    }

    await Document.findByIdAndDelete(documentId);

    trip.documents = trip.documents.filter(id => id.toString() !== documentId);
    await trip.save();

    return Trip.findById(tripId).populate('documents');
}