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
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Text index for search
postSchema.index({ title: 'text', content: 'text' });

// Compound indexes for common queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ likes: -1, viewsCount: -1 });

// Virtual field for reading time
postSchema.virtual('readingTime').get(function () {
    if (!this.content) return 1;
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(wordCount / 200);
    return minutes < 1 ? 1 : minutes;
});

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
