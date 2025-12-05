import mongoose from 'mongoose';

// Trip Schema
const TripSchema = new mongoose.Schema({
    // users who can access and edit this trip
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // multiple destinations supported
    destinations: [
        {
            id: { type: String, trim: true },
            label: { type: String, trim: true }
        }
    ],

    // public/private flag
    isPublic: { type: Boolean, default: false, index: true },

    // optional thumbnail
    thumbnail: { type: String, default: null },

    // trip days with stops
    days: [
        {
            date: { type: Date, required: true },
            stops: [
                {
                    id: { type: String, trim: true },
                    title: { type: String, required: true },
                    time: { type: String },
                    locationName: { type: String },
                    lat: { type: Number },
                    lng: { type: Number },
                    description: { type: String }
                }
            ]
        }
    ],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, default: 0 },

    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// text index for fast search
TripSchema.index(
    {
        title: 'text',
        description: 'text',
        'destinations.label': 'text'
    },
    {
        weights: {
            title: 10,
            'destinations.label': 5,
            description: 1
        },
        name: 'trip_search_index'
    }
);

// additional indexes for filtering and access
TripSchema.index({ isPublic: 1, dateCreated: -1 });
TripSchema.index({ 'members': 1 });

// Export Model Schema
export default mongoose.model('Trip', TripSchema);
