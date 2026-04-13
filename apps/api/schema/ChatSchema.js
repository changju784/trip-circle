import mongoose from 'mongoose';

// Stores a single Gemini-compatible history entry (user text, model text,
// function call, or function response). The 'parts' array matches the
// Content.parts format expected by the Gemini SDK so the full history can
// be reconstructed exactly for each new turn.
const ChatMessageSchema = new mongoose.Schema(
    {
        role: { type: String, enum: ['user', 'model'], required: true },
        parts: { type: [mongoose.Schema.Types.Mixed], required: true },
        timestamp: { type: Date, default: Date.now }
    },
    { _id: false }
);

const ChatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: { type: String, default: 'New Chat', trim: true },
        messages: { type: [ChatMessageSchema], default: [] },
        context: {
            referencedTripIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
            createdTripIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }]
        }
    },
    { timestamps: true }
);

export default mongoose.model('ChatSession', ChatSchema);
