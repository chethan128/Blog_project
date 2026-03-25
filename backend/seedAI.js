const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Read JSON files
const seedData = JSON.parse(fs.readFileSync(`${__dirname}/ai_seed_data.json`, "utf-8"));

const importData = async () => {
    try {
        console.log("Seeding realistic AI users and posts...");

        for (const userData of seedData) {
            // Check if user already exists
            let existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`User ${userData.email} already exists. Skipping user creation, but will see if they need posts.`);
            } else {
                console.log(`Creating user: ${userData.name}...`);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);

                existingUser = await User.create({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    bio: userData.bio,
                    location: userData.location,
                    website: userData.website,
                    profileImage: userData.profileImage,
                    followers: [],
                    following: []
                });
            }

            // Create posts for this user
            if (userData.posts && userData.posts.length > 0) {
                console.log(`  Creating ${userData.posts.length} posts for ${userData.name}...`);
                const postsToInsert = userData.posts.map(post => {
                    return {
                        ...post,
                        author: existingUser.name,
                        viewedBy: [],
                        viewsCount: Math.floor(Math.random() * (2000 - 100) + 100), // Random views
                        likes: Math.floor(Math.random() * (150 - 5) + 5), // Random likes
                        createdAt: new Date(new Date().getTime() - Math.random() * 10000000000) // Random date in recent past
                    }
                });

                // Add posts. We don't wipe existing posts so we just append these new ones.
                await Post.insertMany(postsToInsert);
            }
        }

        console.log("AI Data successfully imported!");
        process.exit();
    } catch (err) {
        console.error("Error importing data:", err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        // Find users from the seed data
        const seedEmails = seedData.map(u => u.email);
        const seedNames = seedData.map(u => u.name);

        console.log("Removing AI users...");
        await User.deleteMany({ email: { $in: seedEmails } });

        console.log("Removing AI posts...");
        await Post.deleteMany({ author: { $in: seedNames } });

        console.log("AI Data successfully destroyed!");
        process.exit();
    } catch (err) {
        console.error("Error destroying data:", err);
        process.exit(1);
    }
}

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    destroyData();
} else {
    console.log("Please pass '-i' to import data or '-d' to destroy data");
    process.exit();
}
