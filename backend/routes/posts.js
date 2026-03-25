const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Get all posts (sorted newest first by default), optionally filtered by category
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        const posts = await Post.find(filter).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get posts by a specific user email
router.get('/user/:email', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.email }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new post
router.post('/', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            image: req.body.image,
            tags: req.body.tags || [],
            category: req.body.category || 'General',
            author: user.email // Enforce author from the verified token
        });

        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update post (Protected Route - Author Only)
router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (post.author !== user.email) {
            return res.status(403).json({ message: 'User not authorized to edit this post' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete post (Protected Route - Author Only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Verify that the user attempting to delete is the original author
        // We compare the post author string against the decoded token's user email
        // Note: The User model doesn't store email directly in req.user by default from our auth middleware
        // Let's fetch the user to get their email if needed, or rely on token contents if we put email in it.
        // In backend/routes/auth.js login/register, the token payload is simply { user: { id: user.id } }.
        // So we must fetch the user by ID first.
        const User = require('../models/User'); // Required to fetch the user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // The post author field currently stores the email string (e.g., 'test@example.com')
        if (post.author !== user.email) {
            return res.status(403).json({ message: 'User not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: err.message });
    }
});

// Like/Unlike post (Protected Route)
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user has already liked the post
        const index = post.likedBy.indexOf(req.user.id);

        if (index === -1) {
            // User hasn't liked it yet, so add them
            post.likedBy.push(req.user.id);
            post.likes = post.likedBy.length; // Keep standard 'likes' count sync'd for backwards compatibility
        } else {
            // User already liked it, so remove them (unlike)
            post.likedBy.splice(index, 1);
            post.likes = post.likedBy.length;
        }

        await post.save();
        res.json(post);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// Record post view (Protected Route)
router.put('/:id/view', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if author is trying to view their own post
        if (post.author === user.email) {
            return res.json({ message: 'Author view, not counted', viewsCount: post.viewsCount });
        }

        // Check if user has already viewed the post
        if (!post.viewedBy.includes(req.user.id)) {
            post.viewedBy.push(req.user.id);
            post.viewsCount = post.viewedBy.length;
            await post.save();
        }

        res.json({ viewsCount: post.viewsCount });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add comment (Protected)
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        post.comments.push({
            text: req.body.text,
            author: user.email, // Use authenticated user's email instead of relying on frontend payload
            date: new Date()
        });

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
