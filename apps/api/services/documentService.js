import Trip from '../schema/TripSchema.js';
import { uploadToBlob, deleteFromBlob } from '../utils/blobStorage.js';

export async function uploadReceipt({ tripId, file, dayDate }) {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    const timestamp = Date.now();
    const filename = `receipts/${tripId}/${timestamp}-${file.originalname}`;

    const { url } = await uploadToBlob(
        file.buffer,
        filename,
        file.mimetype
    );

    trip.receipts.push({
        id: `receipt-${timestamp}`,
        name: file.originalname,
        url,
        contentType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        dayDate: dayDate ? new Date(dayDate) : null
    });

    await trip.save();
    return trip;
}

export async function deleteReceipt({ tripId, receiptId }) {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    const index = trip.receipts.findIndex(r => r.id === receiptId);
    if (index === -1) return false;

    const receipt = trip.receipts[index];

    try {
        await deleteFromBlob(receipt.url);
    } catch { }

    trip.receipts.splice(index, 1);
    await trip.save();

    return trip;
}
