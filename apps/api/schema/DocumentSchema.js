import mongoose from 'mongoose';
import { StopCategoryEnum } from './const/TripConstants.js';

const DocumentSchema = new mongoose.Schema({
    // --- RELATIONSHIPS ---
    id: { type: String },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // --- FILE METADATA (From your original ReceiptSchema) ---
    name: { type: String, required: true },         // original file name
    url: { type: String, required: true },          // Vercel Blob / S3 URL
    contentType: { type: String, required: true },  // MIME type
    size: { type: Number, required: true },         // file size in bytes
    uploadedAt: { type: Date, default: Date.now },

    // --- PARSING STATE ---
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'parsed', 'failed'],
        default: 'uploaded'
    },

    // --- EXTRACTED DATA (For AI Suggestions) ---
    extractedData: {
        category: {
            type: String,
            enum: StopCategoryEnum,
            default: 'none'
        },
        vendor: String,
        amount: Number,
        currency: String,
        date: Date,
        time: String,
        location: {
            name: String,
            address: String
        },
        description: String,
        metadata: mongoose.Schema.Types.Mixed,
        aiInsights: {
            matchScore: { type: Number, default: 1 },
            reasoning: { type: String, default: "" }
        },
    },

    // --- UI/UX LOGIC ---
    isApplied: { type: Boolean, default: false }, // Has user approved this suggestion?
    rawText: String, // Store OCR text for debugging/transparency
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);