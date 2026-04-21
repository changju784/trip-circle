import mongoose from 'mongoose';

// Stores a single OpenAI-compatible history entry.
// - user messages:      { role: 'user', content: string }
// - assistant messages: { role: 'assistant', content: string|null, tool_calls?: [...] }
// - tool results:       { role: 'tool', tool_call_id: string, content: string }
const ChatMessageSchema = new mongoose.Schema(
    {
        role: { type: String, enum: ['user', 'assistant', 'tool'], required: true },
        content: { type: mongoose.Schema.Types.Mixed, default: null },
        tool_calls: { type: [mongoose.Schema.Types.Mixed] },
        tool_call_id: { type: String },
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
