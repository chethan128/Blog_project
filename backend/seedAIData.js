/**
 * Seed Script: Transfers AI seed data into MongoDB
 * - Creates user accounts with hashed passwords (bcrypt)
 * - Inserts all blog posts linked to each user's email
 * - Each user can log in with their email + "password123"
 *
 * Usage: node seedAIData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');

const aiSeedData = require('./ai_seed_data.json');
const blogsData = require('./blogs.json');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pixie-pages';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // ── 1. Seed users & posts from ai_seed_data.json ──
        console.log('\n📦 Seeding AI users & posts from ai_seed_data.json...');

        for (const userData of aiSeedData) {
            // Check if user already exists
            let existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);

                existingUser = await User.create({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    bio: userData.bio || '',
                    location: userData.location || '',
                    website: userData.website || '',
                    profileImage: userData.profileImage || '',
                    role: 'Author',
                    status: 'Active',
                });
                console.log(`  👤 Created user: ${userData.name} (${userData.email})`);
            } else {
                console.log(`  ⏭️  User already exists: ${userData.email}`);
            }

            // Insert posts for this user
            if (userData.posts && userData.posts.length > 0) {
                for (const postData of userData.posts) {
                    // Check if post with same title by same author already exists
                    const existingPost = await Post.findOne({
                        title: postData.title,
                        author: userData.email
                    });

                    if (!existingPost) {
                        // Map comment authors to use email format if they match a seed user name
                        const mappedComments = (postData.comments || []).map(c => ({
                            text: c.text,
                            author: c.author || 'Guest',
                            date: new Date()
                        }));

                        await Post.create({
                            title: postData.title,
                            content: postData.content,
                            image: postData.image || null,
                            tags: postData.tags || [],
                            comments: mappedComments,
                            author: userData.email,
                            status: 'Published',
                            category: postData.tags?.[0] || 'General',
                            likes: Math.floor(Math.random() * 50) + 5,
                            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
                        });
                        console.log(`    📝 Created post: "${postData.title}"`);
                    } else {
                        console.log(`    ⏭️  Post already exists: "${postData.title}"`);
                    }
                }
            }
        }

        // ── 2. Seed posts from blogs.json ──
        console.log('\n📦 Seeding posts from blogs.json...');

        // Collect unique author emails from blogs.json
        const blogAuthors = [...new Set(blogsData.map(b => b.author))];

        // Ensure each author has a user account
        for (const authorEmail of blogAuthors) {
            let existingUser = await User.findOne({ email: authorEmail });
            if (!existingUser) {
                const name = authorEmail.split('@')[0].replace(/[_.-]/g, ' ');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt);

                await User.create({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    email: authorEmail,
                    password: hashedPassword,
                    role: 'Author',
                    status: 'Active',
                });
                console.log(`  👤 Created user for blogs.json author: ${authorEmail}`);
            }
        }

        // Insert blog posts
        for (const blog of blogsData) {
            const existingPost = await Post.findOne({
                title: blog.title,
                author: blog.author
            });

            if (!existingPost) {
                await Post.create({
                    title: blog.title,
                    content: blog.content,
                    image: blog.image || null,
                    tags: blog.tags || [],
                    author: blog.author,
                    likes: blog.likes || 0,
                    status: 'Published',
                    category: blog.tags?.[0] || 'General',
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
                });
                console.log(`    📝 Created post: "${blog.title}"`);
            } else {
                console.log(`    ⏭️  Post already exists: "${blog.title}"`);
            }
        }

        // ── Summary ──
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        console.log('\n────────────────────────────────────────');
        console.log(`✅ Seeding complete!`);
        console.log(`   Total users in DB: ${totalUsers}`);
        console.log(`   Total posts in DB: ${totalPosts}`);
        console.log('────────────────────────────────────────');
        console.log('\n🔑 All seeded users can login with password: password123');
        console.log('\n📋 AI Seed Data users:');
        aiSeedData.forEach(u => console.log(`   ${u.email}  →  ${u.name}`));
        console.log('\n📋 Blogs.json authors:');
        blogAuthors.forEach(e => console.log(`   ${e}`));

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

seed();
