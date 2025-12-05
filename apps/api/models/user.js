import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
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

// Export Model Schema
export default mongoose.model('User', UserSchema);
