var mongoose = require('mongoose');

// User Schema
var UserSchema = new mongoose.Schema({
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
module.exports = mongoose.model('User', UserSchema);