const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile'); 
const auth = require('../middleware/auth');

// ✅ IMPORT BREVO EMAIL SERVICE
const { sendOTPEmail } = require('../services/emailService');

// --- Memory storage for OTPs ---
const otpStore = {}; 

// ==========================================
// PRE-DEFINED PREMIUM TEMPLATES (SKILLSMIND)
// ==========================================

const getEmailLayout = (content) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #eee;">
        <div style="background-color: #000B29; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 35px; letter-spacing: 4px; text-transform: uppercase; font-weight: 900;">SkillsMind</h1>
            <div style="height: 3px; width: 60px; background-color: #E30613; margin: 15px auto;"></div>
            <p style="color: #E30613; margin: 0; font-weight: bold; font-size: 12px; letter-spacing: 2px;">PREMIUM LEARNING EXPERIENCE</p>
        </div>
        <div style="padding: 40px 30px; line-height: 1.6; color: #333;">
            ${content}
        </div>
        <div style="background-color: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">© 2026 SkillsMind Education System. All Rights Reserved.</p>
            <p style="color: #bbb; font-size: 11px; margin: 5px 0 0 0;">This is an automated security email from SkillsMind.</p>
        </div>
    </div>
`;

// ==========================================
// 2. SEND OTP ROUTE - ✅ UPDATED WITH BREVO
// ==========================================
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser && existingUser.password) {
            return res.status(400).json({ success: false, message: "User already exists. Please login." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[cleanEmail] = {
            otp: otp,
            expires: Date.now() + 10 * 60 * 1000 
        };

        // ✅ BREVO API SE EMAIL BHEJO (Nodemailer ki jagah)
        const emailResult = await sendOTPEmail(cleanEmail, null, otp);
        
        if (!emailResult.success) {
            console.error("Failed to send OTP email:", emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error("SkillsMind OTP Error:", error);
        res.status(500).json({ success: false, message: 'SkillsMind server cannot send email right now.' });
    }
});

// --- 3. VERIFY OTP ROUTE --- (Same as before)
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        if (!otpStore[cleanEmail]) {
            return res.status(400).json({ success: false, message: "OTP expired or not requested" });
        }

        const storedData = otpStore[cleanEmail];

        if (storedData.expires < Date.now()) {
            delete otpStore[cleanEmail];
            return res.status(400).json({ success: false, message: "OTP has expired" });
        }

        if (storedData.otp === otp.toString()) {
            return res.status(200).json({ success: true, message: "Account verified successfully!" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP code" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Verification failed due to server error" });
    }
});

// ==========================================
// 4. FORGOT PASSWORD - SEND OTP - ✅ UPDATED WITH BREVO
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found in SkillsMind" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[cleanEmail] = { otp, expires: Date.now() + 10 * 60 * 1000 };

        // ✅ BREVO API SE EMAIL BHEJO
        const emailResult = await sendOTPEmail(cleanEmail, user.name, otp);
        
        if (!emailResult.success) {
            console.error("Failed to send reset OTP:", emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send reset code. Please try again.' });
        }

        res.status(200).json({ success: true, message: 'Password reset OTP sent!' });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: 'Error sending reset code' });
    }
});

// --- 5. FORGOT PASSWORD - VERIFY OTP --- (Same as before)
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const stored = otpStore[cleanEmail];

        if (!stored || stored.otp !== otp.toString() || stored.expires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        res.status(200).json({ success: true, message: "OTP Verified! Now change password." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- 6. FORGOT PASSWORD - UPDATE PASSWORD --- (Same as before)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        delete otpStore[email.trim().toLowerCase()];
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update password" });
    }
});

// --- 7. GOOGLE LOGIN ROUTE --- (Same as before - working hai)
router.post('/google-login', async (req, res) => {
    try {
        const { token } = req.body;
        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        const { name, email, picture, sub } = googleRes.data;

        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            user = new User({
                name,
                email: email.trim().toLowerCase(),
                googleId: sub,
                profilePic: picture,
                password: await bcrypt.hash(Math.random().toString(36), 10)
            });
            await user.save();
        }

        const profile = await StudentProfile.findOne({ user: user.id });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                success: true, 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role,
                    profileId: profile ? profile._id : null 
                } 
            });
        });
    } catch (err) {
        console.error("Google login error:", err);
        res.status(500).json({ success: false, message: "Google login failed" });
    }
});

// ==========================================
// 8. REGISTER ROUTE (WITH WELCOME EMAIL) - ✅ UPDATED WITH BREVO
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name, email: cleanEmail, password: hashedPassword });
        await user.save();
        
        delete otpStore[cleanEmail]; 

        // ✅ BREVO API SE WELCOME EMAIL BHEJO
        const welcomeEmailResult = await sendWelcomeEmail(cleanEmail, name);
        
        if (!welcomeEmailResult.success) {
            console.log("Welcome email failed (non-critical):", welcomeEmailResult.error);
            // Non-critical, don't fail registration
        }
        
        res.status(201).json({ success: true, message: "SkillsMind registration successful!" });
    } catch (err) { 
        console.error("SkillsMind Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error during registration" }); 
    }
});

// ✅ NEW: Welcome email function using Brevo
async function sendWelcomeEmail(toEmail, userName) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    email: 'skillsmind786@gmail.com',
                    name: 'SkillsMind'
                },
                to: [{
                    email: toEmail,
                    name: userName || 'Student'
                }],
                subject: `Welcome to SkillsMind, ${userName}! 🎉`,
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #eee; }
                            .header { background-color: #000B29; padding: 40px 20px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 35px; letter-spacing: 4px; text-transform: uppercase; font-weight: 900; }
                            .content { padding: 40px 30px; line-height: 1.6; color: #333; }
                            .btn { display: inline-block; background-color: #000B29; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>SkillsMind</h1>
                                <p style="color: #E30613; margin: 10px 0 0 0; font-weight: bold; font-size: 12px; letter-spacing: 2px;">PREMIUM LEARNING EXPERIENCE</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #000B29;">Welcome to the Family! 🎉</h2>
                                <p style="font-size: 16px;">Hello <b>${userName}</b>,</p>
                                <p style="font-size: 16px;">We are thrilled to have you join <b>SkillsMind</b>. Our mission is to provide you with a world-class learning experience.</p>
                                <div style="background-color: #fff5f5; border-left: 5px solid #E30613; padding: 20px; margin: 30px 0;">
                                    <p style="margin: 0; font-weight: bold; color: #333;">Start Your Journey:</p>
                                    <p style="margin: 5px 0 0 0; color: #666;">Login to your dashboard to explore our premium courses!</p>
                                </div>
                                <center><a href="https://skillsmind.online/login" class="btn">Go to Dashboard</a></center>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Welcome email sent to:', toEmail);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('❌ Brevo welcome email error:', data);
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
        return { success: false, error: error.message };
    }
}

// --- 9. LOGIN ROUTE --- (Same as before)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "Invalid Credentials" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Credentials" });
        
        const profile = await StudentProfile.findOne({ user: user.id });
        
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                success: true,
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role,
                    profileId: profile ? profile._id : null 
                }, 
                message: `Welcome back to SkillsMind, ${user.name}!` 
            });
        });
    } catch (err) { 
        res.status(500).json({ success: false, message: "Server Error during login" }); 
    }
});

// --- Baaki routes same rahenge (all-users, user, delete, etc.) ---
// ... (unchanged code for other routes)

module.exports = router;