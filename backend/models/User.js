const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    bio: {
        type: String,
        default: "Sharing my thoughts and stories with the world.",
    },
    location: {
        type: String,
        default: "",
    },
    website: {
        type: String,
        default: "",
    },
    profileImage: {
        type: String,
        default: "",
    },
    followers: [{
        type: String, // Store emails of followers
    }],
    following: [{
        type: String, // Store emails user is following
    }],
    date: {
        type: Date,
        default: Date.now,
    },
    role: {
        type: String,
        enum: ['Admin', 'Author', 'Reader'],
        default: 'Reader',
    },
    status: {
        type: String,
        enum: ['Active', 'Blocked'],
        default: 'Active',
    },
});

module.exports = mongoose.model('User', UserSchema);
