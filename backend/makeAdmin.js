const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.error('❌ Please provide an email to promote: node makeAdmin.js your@email.com');
    process.exit(1);
}

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pixie-pages');
        const user = await User.findOne({ email: emailToPromote });
        
        if (!user) {
            console.error(`❌ User with email ${emailToPromote} not found.`);
            process.exit(1);
        }

        user.role = 'Admin';
        await user.save();
        
        console.log(`✅ Success! User ${emailToPromote} has been promoted to Admin.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

makeAdmin();
