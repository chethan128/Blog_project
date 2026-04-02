const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const auth = require('../middleware/auth');

// Get all bookmarks for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.user.id })
            .populate('post')
            .sort({ createdAt: -1 });
        
        // Return just the posts (filtered out any null posts from deleted posts)
        const posts = bookmarks
            .filter(b => b.post !== null)
            .map(b => ({
                ...b.post.toJSON(),
                bookmarkId: b._id,
                bookmarkedAt: b.createdAt
            }));
        
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Toggle bookmark on/off for a post
router.post('/:postId', auth, async (req, res) => {
    try {
        const existing = await Bookmark.findOne({
            user: req.user.id,
            post: req.params.postId
        });

        if (existing) {
            await existing.deleteOne();
            return res.json({ bookmarked: false, message: 'Bookmark removed' });
        }

        const bookmark = new Bookmark({
            user: req.user.id,
            post: req.params.postId
        });
        await bookmark.save();
        res.json({ bookmarked: true, message: 'Post bookmarked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Check if a post is bookmarked
router.get('/check/:postId', auth, async (req, res) => {
    try {
        const existing = await Bookmark.findOne({
            user: req.user.id,
            post: req.params.postId
        });
        res.json({ bookmarked: !!existing });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
