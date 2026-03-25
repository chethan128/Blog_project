const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: "Pixie Pages",
    },
    siteDescription: {
        type: String,
        default: "A modern blog posting platform.",
    },
    logoUrl: {
        type: String,
        default: "",
    },
    enableComments: {
        type: Boolean,
        default: true,
    },
    seoKeywords: {
        type: String,
        default: "blog, pixie pages, stories, posts",
    },
    contactEmail: {
        type: String,
        default: "contact@pixiepages.com",
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Setting', settingSchema);
