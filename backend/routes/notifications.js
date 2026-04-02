const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get all notifications for authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user.id })
            .populate('sender', 'name email profileImage')
            .populate('post', 'title')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            receiver: req.user.id,
            read: false
        });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark all notifications as read
router.put('/read', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { receiver: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
