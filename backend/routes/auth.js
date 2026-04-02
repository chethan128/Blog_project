const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists, please login.' });
        }

        user = new User({
            name,
            email,
            password,
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                name: user.name, // adding name to payload for easy frontend access
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        bio: user.bio,
                        location: user.location,
                        website: user.website,
                        profileImage: user.profileImage
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Compare password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                name: user.name,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        bio: user.bio,
                        location: user.location,
                        website: user.website,
                        profileImage: user.profileImage
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/profile/:email
// @desc    Get public profile by email
// @access  Public
router.get('/profile/:email', async (req, res) => {
    try {
        const user = await User.findOne({
            $or: [{ email: req.params.email }, { name: req.params.email }]
        }).select('-password -resetPasswordToken -resetPasswordExpire');
        if (!user) {
            return res.status(404).json({ msg: 'User profile not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/auth/follow/:email
// @desc    Follow or unfollow a user
// @access  Private
router.put('/follow/:email', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findOne({
            $or: [{ email: req.params.email }, { name: req.params.email }]
        });

        if (!targetUser) {
            return res.status(404).json({ msg: 'Target user not found' });
        }

        if (currentUser.email === targetUser.email) {
            return res.status(400).json({ msg: 'You cannot follow yourself' });
        }

        // Check if currently following
        const isFollowing = currentUser.following.includes(targetUser.email);

        if (isFollowing) {
            // Unfollow logic
            currentUser.following = currentUser.following.filter(email => email !== targetUser.email);
            targetUser.followers = targetUser.followers.filter(email => email !== currentUser.email);
        } else {
            // Follow logic
            currentUser.following.push(targetUser.email);
            targetUser.followers.push(currentUser.email);
        }

        await currentUser.save();
        await targetUser.save();

        // Create notification on follow (not unfollow)
        if (!isFollowing) {
            await Notification.create({
                type: 'follow',
                sender: currentUser._id,
                receiver: targetUser._id,
                message: `${currentUser.name} started following you`
            });
        }

        res.json({ following: !isFollowing });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { bio, location, website, profileImage } = req.body;

    // Build profile object
    const profileFields = {};
    if (bio !== undefined) profileFields.bio = bio;
    if (location !== undefined) profileFields.location = location;
    if (website !== undefined) profileFields.website = website;
    if (profileImage !== undefined) profileFields.profileImage = profileImage;

    try {
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update
        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @route   POST api/auth/forgotpassword
// @desc    Forgot Password - generates token and logs reset URL
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'There is no user with that email' });
        }

        // Generate JWT token with 15 minutes expiry
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '15m' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save();

        // Create reset url (matching the frontend route)
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        // Send email with Nodemailer
        try {
            console.log(`Attempting to send reset email to: ${user.email}`);
            
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: `"Pixie Pages Support" <${process.env.EMAIL_USERNAME}>`,
                to: user.email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl}`,
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Please click on the link below to verify it's you.</p>
                    <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
                    <p><br>Or use this link: <a href="${resetUrl}">${resetUrl}</a></p>
                    <p style="color: #64748B; font-size: 14px; margin-top: 20px;">If you did not request this, please ignore this email. Note: Emails can sometimes end up in the spam folder, so be sure to check there if needed.</p>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email successfully sent: %s', info.messageId);
            
            res.status(200).json({ msg: 'Password reset link sent to email' });

        } catch (emailError) {
            console.error('❌ Error sending reset email. Stack trace:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ 
                msg: 'Error sending email. Please ensure your Gmail App Password and username in .env are correct.' 
            });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/resetpassword/:token
// @desc    Reset Password
// @access  Public
router.put('/resetpassword/:token', async (req, res) => {
    try {
        const token = req.params.token;

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch (err) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        // Find user by ID from decoded JWT, and ensure the token matches the one in DB
        const user = await User.findOne({
            _id: decoded.id,
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // Clear token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password successfully reset' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
