const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Post = require("./models/Post");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected. Resetting likes, likedBy arrays, and comments...');
        
        const result = await Post.updateMany({}, {
            $set: {
                likes: 0,
                likedBy: [],
                comments: []
            }
        });
        
        console.log(`Successfully reset engagement for ${result.modifiedCount} posts!`);
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
