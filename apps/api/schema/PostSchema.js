import mongoose from 'mongoose';

// Post Schema
const PostSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
        unique: true  // One post per trip
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            commentText: { type: String, required: true },
            dateCreated: { type: Date, default: Date.now }
        }
    ],
    forkCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// Index for faster queries
PostSchema.index({ dateCreated: -1 });
PostSchema.index({ tripId: 1 });

// Export Model Schema
export default mongoose.model('Post', PostSchema);