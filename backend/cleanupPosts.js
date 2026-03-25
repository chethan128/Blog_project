const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Post = require("./models/Post");
const User = require("./models/User");

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected successfully');

        try {
            // Get all unique authors from posts
            const posts = await Post.find();
            const users = await User.find();

            const validAuthorIdentifiers = new Set();
            users.forEach(user => {
                validAuthorIdentifiers.add(user.email);
                validAuthorIdentifiers.add(user.name);
            });

            console.log(`Found ${posts.length} total posts.`);

            let deletedCount = 0;
            const postsToDelete = [];

            for (const post of posts) {
                if (!post.author || (!validAuthorIdentifiers.has(post.author) && post.author !== "Admin")) {
                    postsToDelete.push(post._id);
                    console.log(`Flagging post for deletion: "${post.title}" by author "${post.author || 'Unknown'}"`);
                }
            }

            if (postsToDelete.length > 0) {
                const result = await Post.deleteMany({ _id: { $in: postsToDelete } });
                console.log(`Successfully deleted ${result.deletedCount} dummy/orphaned posts.`);
            } else {
                console.log("No dummy posts found to delete. All posts belong to valid users.");
            }

        } catch (err) {
            console.error("Error during cleanup:", err);
        } finally {
            process.exit();
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit();
    });
