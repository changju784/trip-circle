import mongoose from 'mongoose';

// --- STOP SUBSCHEMA ---
const StopSchema = new mongoose.Schema(
    {
        id: { type: String, trim: true },              // frontend-generated id
        title: { type: String, trim: true },           // ← no longer required
        time: { type: String },
        locationName: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        description: { type: String }
    },
    { _id: false } // prevents _id for each stop (cleaner)
);

// --- DAY SUBSCHEMA ---
const DaySchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },          // must exist
        stops: { type: [StopSchema], default: [] }     // can be empty
    },
    { _id: false }
);

// --- TRIP SCHEMA ---
const TripSchema = new mongoose.Schema({
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    destinations: [
        {
            id: { type: String, trim: true },
            label: { type: String, trim: true }
        }
    ],

    isPublic: { type: Boolean, default: false, index: true },
    thumbnail: { type: String, default: null },

    days: {
        type: [DaySchema],
        default: []
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, default: 0 },

    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// TEXT INDEX FOR SEARCH
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

// ADDITIONAL INDEXES
TripSchema.index({ isPublic: 1, dateCreated: -1 });
TripSchema.index({ 'members': 1 });

export default mongoose.model('Trip', TripSchema);
