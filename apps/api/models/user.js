import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
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
