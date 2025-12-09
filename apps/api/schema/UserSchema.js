import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, default: null }, // null for OAuth-only users
    name: { type: String, default: null },
    googleId: { type: String, sparse: true, required: false },
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

// Export Model Schema
export default mongoose.model('User', UserSchema);
