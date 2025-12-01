import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// User Middleware

// Export Model Schema
export default mongoose.model('User', UserSchema);