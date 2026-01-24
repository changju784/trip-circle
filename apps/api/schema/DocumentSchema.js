import mongoose from 'mongoose';
import { StopCategoryEnum } from './const/TripConstants.js';

const DocumentSchema = new mongoose.Schema({
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
    name: { type: String, required: true },
    url: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },

    status: {
        type: String,
        enum: ['uploaded', 'processing', 'parsed', 'failed'],
        default: 'uploaded'
    },

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
        time: { type: String, default: '12:00' },
        location: {
            name: String,
            address: String
        },
        description: String,
        metadata: mongoose.Schema.Types.Mixed,
        aiInsights: {
            matchScore: { type: Number, default: 0 },
            reasoning: { type: String, default: "" }
        },
    },

    isApplied: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);