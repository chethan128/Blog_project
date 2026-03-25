const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Post = require("./models/Post");

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Read JSON files
const blogs = JSON.parse(fs.readFileSync(`${__dirname}/blogs.json`, "utf-8"));

const generateRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Add standard fields to raw JSON
const processedBlogs = blogs.map(blog => {
    return {
        ...blog,
        // Since we removed 'date' from the model earlier to use native timestamps (if applicable) 
        // or just supply a realistic string format for the date. We'll use a string standard to existing App
        date: generateRandomDate(new Date(2023, 0, 1), new Date()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        viewedBy: [],
        viewsCount: Math.floor(Math.random() * (5000 - 100) + 100), // Random starting views between 100 to 5000
    }
});

const importData = async () => {
    try {
        console.log("Emptying existing posts to prevent massive duplication...");
        await Post.deleteMany(); // Clear existing posts before seeding to ensure a clean slate, optional based on user preference

        await Post.create(processedBlogs);
        console.log("Data successfully imported!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Post.deleteMany();
        console.log("Data successfully destroyed!");
        process.exit();
    } catch (err) {
        console.error(err);
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
