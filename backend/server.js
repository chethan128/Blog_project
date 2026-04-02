require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For handling base64 image uploads

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pixie-pages')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const bookmarkRoutes = require('./routes/bookmarks');
const notificationRoutes = require('./routes/notifications');
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Pixie Pages API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
