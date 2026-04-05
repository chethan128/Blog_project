const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Setting = require('../models/Setting');

// Apply middleware to all routes in this router
router.use(auth, authAdmin);

// ========================
// ANALYTICS & DASHBOARD
// ========================
router.get('/analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const publishedPosts = await Post.countDocuments({ status: 'Published' });
        const draftPosts = await Post.countDocuments({ status: 'Draft' });
        const postsWithComments = await Post.find({}, 'comments');
        const totalComments = postsWithComments.reduce((sum, p) => sum + (p.comments ? p.comments.length : 0), 0);

        const recentUsers = await User.find().sort({ date: -1 }).limit(5).select('-password');
        const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(5).select('title author createdAt status viewsCount');

        res.json({
            stats: { totalUsers, totalPosts, publishedPosts, draftPosts, totalComments },
            recentUsers,
            recentPosts,
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ========================
// USERS MANAGEMENT
// ========================
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ date: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (req.user.id === req.params.id && role !== 'Admin') {
            return res.status(400).json({ msg: 'You cannot demote yourself.' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Cascade delete user's posts
        await Post.deleteMany({ author: user.email });
        
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User and their associated posts deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ========================
// POSTS MANAGEMENT
// ========================
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('category', 'name').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/posts/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(post);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/posts/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ========================
// CATEGORIES MANAGEMENT
// ========================
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.post('/categories', async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        let category = new Category({ name, slug, description });
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const category = await Category.findByIdAndUpdate(req.params.id, { name, slug, description }, { new: true });
        res.json(category);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ========================
// COMMENTS MANAGEMENT
// ========================
router.get('/comments', async (req, res) => {
    try {
        const posts = await Post.find({}, 'title comments');
        let allComments = [];

        posts.forEach(post => {
            if (post.comments && post.comments.length > 0) {
                post.comments.forEach(c => {
                    allComments.push({
                        _id: c._id,
                        text: c.text,
                        author: c.author,
                        createdAt: c.date,
                        post: { _id: post._id, title: post.title }
                    });
                });
            }
        });

        allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(allComments);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/comments/:id', async (req, res) => {
    try {
        const commentId = req.params.id;
        const post = await Post.findOneAndUpdate(
            { "comments._id": commentId },
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        res.json({ msg: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ========================
// SETTINGS
// ========================
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/settings', async (req, res) => {
    try {
        const settingsData = req.body;
        settingsData.updatedAt = Date.now();
        let settings = await Setting.findOne();
        if (settings) {
            settings = await Setting.findByIdAndUpdate(settings._id, settingsData, { new: true });
        } else {
            settings = new Setting(settingsData);
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
