var mongoose = require('mongoose');

// Trip Schema
var TripSchema = new mongoose.Schema({
    editors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    title : { type: String, required: true, trim: true },
    location : { type: String, required: true, trim: true },
    description : { type: String, default: '' },
    days : [
        {
            date: { type: Date, required: true },
            activities: [
                {
                    title: { type: String, required: true },
                    time: { type: String, required: true },
                    description: { type: String, required: true },
                    location: { type: String, required: true }
                }
            ]
        }
    ],
    startDate : { type: Date, required: true },
    endDate : { type: Date, required: true },
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// Trip Middleware

// Export Model Schema
module.exports = mongoose.model('Trip', TripSchema);