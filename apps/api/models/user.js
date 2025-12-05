import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, default: null }, // null for OAuth-only users
    name: { type: String, default: null },
    googleId: { type: String, default: null, sparse: true, unique: true },
    // trips the user has access to
    trips: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip'
        }
    ],
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// User Middleware

// Export Model Schema
export default mongoose.model('User', UserSchema);
