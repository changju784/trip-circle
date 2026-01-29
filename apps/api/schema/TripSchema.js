import mongoose from 'mongoose';

// --- RECEIPT SUBSCHEMA ---
const ReceiptSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },          // frontend-generated id
        name: { type: String, required: true },        // file name
        url: { type: String, required: true },         // Vercel Blob URL
        contentType: { type: String, required: true }, // MIME type
        size: { type: Number, required: true },        // file size in bytes
        uploadedAt: { type: Date, default: Date.now },
        dayDate: { type: Date }                        // optional: which day this receipt is for
    },
    { _id: false }
);

// --- STOP SUBSCHEMA ---
const StopCategoryEnum = [
    'dining', 'lodging', 'sightseeing', 'activity',
    'shopping', 'transit', 'nightlife', 'other', 'none'
];

const StopSchema = new mongoose.Schema(
    {
        id: { type: String, trim: true },              // frontend-generated id
        title: { type: String, trim: true },           // ← no longer required
        time: { type: String },
        category: {
            type: String,
            enum: StopCategoryEnum,
            default: 'none'
        },
        locationName: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        price: { type: Number, default: 0, min: 0 },
        description: { type: String }
    },
    { _id: false } // prevents _id for each stop (cleaner)
);

// --- DAY SUBSCHEMA ---
const DaySchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },          // must exist
        stops: { type: [StopSchema], default: [] },     // can be empty
    },
    { _id: false }
);

// --- TRIP SCHEMA ---
const TripTagsEnum = [
    'spring', 'summer', 'fall', 'winter',           // season
    'solo', 'couple', 'family', 'friends',          // group type
    'budget', 'luxury', 'adventure',                // style
    'nature', 'city break', 'beach', 'foodie',      // vibe
    'relaxing', 'photography', 'hiking', 'historic' // activity
];

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
            label: { type: String, trim: true },
            lat: { type: Number },
            lng: { type: Number },
        }
    ],

    tags: {
        type: [String],
        enum: TripTagsEnum,
        default: [],
        index: true
    },

    isPublic: { type: Boolean, default: false, index: true },
    thumbnail: { type: String, default: null },

    days: {
        type: [DaySchema],
        default: []
    },

    receipts: {
        type: [ReceiptSchema],
        default: []
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    totalPrice: { type: Number, default: 0, min: 0 },
    budget: { type: Number, default: 0, min: 0 },

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
        'destinations.label': 'text',
        tags: 'text'
    },
    {
        weights: {
            title: 10,
            'destinations.label': 5,
            description: 1,
            tags: 3,
        },
        name: 'trip_search_index'
    }
);

// ADDITIONAL INDEXES
TripSchema.index({ isPublic: 1, dateCreated: -1 });
TripSchema.index({ 'members': 1 });

export default mongoose.model('Trip', TripSchema);
