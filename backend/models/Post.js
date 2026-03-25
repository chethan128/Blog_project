const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: String, // Storing image as Base64 string for now
        default: null,
    },
    tags: {
        type: [String],
        default: [],
    },
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: [{
        type: String, // Store user IDs
    }],
    viewedBy: [{
        type: String, // Store user IDs to ensure unique views
    }],
    viewsCount: {
        type: Number,
        default: 0,
    },
    comments: [
        {
            text: String,
            date: { type: Date, default: Date.now },
            author: { type: String, default: "Guest" }
        }
    ],
    author: {
        type: String,
        default: "Anonymous",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Published',
    },
    category: {
        type: String,
        default: 'General',
    },
});

module.exports = mongoose.model('Post', postSchema);
