const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Search posts (must be before /:id to avoid conflict)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.json([]);
        }
        const posts = await Post.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } }).limit(20);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get trending posts (most liked + viewed in last 7 days)
router.get('/trending', async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } })
            .sort({ likes: -1, viewsCount: -1 })
            .limit(6);
        
        // If not enough recent posts, fallback to all-time popular
        if (posts.length < 3) {
            const allTimeTrending = await Post.find()
                .sort({ likes: -1, viewsCount: -1 })
                .limit(6);
            return res.json(allTimeTrending);
        }
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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

// Get related posts (same category, exclude current)
router.get('/:id/related', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const related = await Post.find({
            _id: { $ne: post._id },
            $or: [
                { category: post.category },
                { tags: { $in: post.tags || [] } }
            ]
        })
        .sort({ likes: -1, createdAt: -1 })
        .limit(4);
        
        res.json(related);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new post
router.post('/', auth, async (req, res) => {
    try {
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
            author: user.email
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

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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

// Like/Unlike post (Protected Route) — also creates notification
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const index = post.likedBy.indexOf(req.user.id);

        if (index === -1) {
            post.likedBy.push(req.user.id);
            post.likes = post.likedBy.length;

            // Create notification for post author (if not self-liking)
            const liker = await User.findById(req.user.id);
            const postAuthor = await User.findOne({ email: post.author });
            if (postAuthor && postAuthor._id.toString() !== req.user.id) {
                await Notification.create({
                    type: 'like',
                    sender: req.user.id,
                    receiver: postAuthor._id,
                    post: post._id,
                    message: `${liker.name} liked your post "${post.title}"`
                });
            }
        } else {
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

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (post.author === user.email) {
            return res.json({ message: 'Author view, not counted', viewsCount: post.viewsCount });
        }

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

// Add comment (Protected) — also creates notification
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        post.comments.push({
            text: req.body.text,
            author: user.email,
            date: new Date()
        });

        const updatedPost = await post.save();

        // Create notification for post author (if not self-commenting)
        const postAuthor = await User.findOne({ email: post.author });
        if (postAuthor && postAuthor._id.toString() !== req.user.id) {
            await Notification.create({
                type: 'comment',
                sender: req.user.id,
                receiver: postAuthor._id,
                post: post._id,
                message: `${user.name} commented on your post "${post.title}"`
            });
        }

        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get stats (public) for home page
router.get('/stats/overview', async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalComments = await Post.aggregate([
            { $project: { commentCount: { $size: { $ifNull: ['$comments', []] } } } },
            { $group: { _id: null, total: { $sum: '$commentCount' } } }
        ]);
        res.json({
            totalPosts,
            totalUsers,
            totalComments: totalComments[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
