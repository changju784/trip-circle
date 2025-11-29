var mongoose = require('mongoose');
const trip = require('./trip');
const user = require('./user');

// Post Schema
var PostSchema = new mongoose.Schema({
    tripId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [
        {
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

// Post Middleware

// Export Model Schema
module.exports = mongoose.model('Post', PostSchema);