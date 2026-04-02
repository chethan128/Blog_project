require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("Testing Nodemailer config...");
    console.log("EMAIL_USER ->", process.env.EMAIL_USER);
    console.log("EMAIL_PASS length ->", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("Verifying connection to Gmail SMTP...");
        await transporter.verify();
        console.log("✅ Connection successfully verified!");

    } catch (err) {
        console.error("❌ Connection failed!");
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        
        if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted')) {
            console.log("\n💡 THIS MEANS YOUR GMAIL CREDENTIALS ARE WRONG OR YOU ARE NOT USING AN APP PASSWORD.");
        }
    }
}

testEmail();
