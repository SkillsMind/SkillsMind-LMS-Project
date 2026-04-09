const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile'); 
const auth = require('../middleware/auth');

// --- Memory storage for OTPs ---
const otpStore = {}; 

// ==========================================
// 🔥 BREVO EMAIL SERVICE (NO SMTP/NODEMAILER)
// ==========================================

// ✅ Send OTP Email using Brevo API
async function sendOTPEmail(toEmail, userName, otpCode) {
    try {
        console.log('📧 Sending OTP to:', toEmail);
        
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
                subject: 'Your SkillsMind OTP Code',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #eee; }
                            .header { background-color: #000B29; padding: 40px 20px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 35px; letter-spacing: 4px; text-transform: uppercase; font-weight: 900; }
                            .content { padding: 40px 30px; line-height: 1.6; color: #333; text-align: center; }
                            .otp-code { font-size: 48px; font-weight: bold; color: #E30613; letter-spacing: 10px; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 10px; display: inline-block; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>SkillsMind</h1>
                                <p style="color: #E30613; margin: 10px 0 0 0; font-weight: bold; font-size: 12px; letter-spacing: 2px;">PREMIUM LEARNING EXPERIENCE</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #000B29;">Verify Your Account</h2>
                                <p style="font-size: 16px; color: #555;">Welcome to SkillsMind! Use the secure verification code below to complete your registration.</p>
                                <div class="otp-code">${otpCode}</div>
                                <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes for security reasons.</p>
                            </div>
                            <div style="background-color: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eee;">
                                <p style="color: #999; font-size: 12px; margin: 0;">© 2026 SkillsMind Education System. All Rights Reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ OTP email sent successfully to:', toEmail);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('❌ Brevo API error:', data);
            return { success: false, error: data.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('❌ Email send failed:', error.message);
        return { success: false, error: error.message };
    }
}

// ✅ Send Welcome Email using Brevo API
async function sendWelcomeEmail(toEmail, userName) {
    try {
        console.log('📧 Sending welcome email to:', toEmail);
        
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
                                <center>
                                    <a href="https://skillsmind.online/login" class="btn">Go to Dashboard</a>
                                </center>
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

// ✅ Send Password Reset Email using Brevo API
async function sendResetEmail(toEmail, userName, otpCode) {
    try {
        console.log('📧 Sending reset OTP to:', toEmail);
        
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
                    name: 'SkillsMind Support'
                },
                to: [{
                    email: toEmail,
                    name: userName || 'Student'
                }],
                subject: 'SkillsMind | Password Reset Request',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #eee; }
                            .header { background-color: #000B29; padding: 40px 20px; text-align: center; }
                            .header h1 { color: #ffffff; margin: 0; font-size: 35px; letter-spacing: 4px; text-transform: uppercase; font-weight: 900; }
                            .content { padding: 40px 30px; line-height: 1.6; color: #333; text-align: center; }
                            .otp-code { font-size: 48px; font-weight: bold; color: #000B29; letter-spacing: 10px; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 10px; display: inline-block; border-bottom: 4px solid #E30613; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>SkillsMind</h1>
                                <p style="color: #E30613; margin: 10px 0 0 0; font-weight: bold; font-size: 12px; letter-spacing: 2px;">PREMIUM LEARNING EXPERIENCE</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #000B29;">Password Reset Request</h2>
                                <p style="font-size: 16px; color: #555;">Hello <b>${userName || 'Student'}</b>,</p>
                                <p style="font-size: 16px; color: #555;">You requested to reset your password. Use the following code to proceed:</p>
                                <div class="otp-code">${otpCode}</div>
                                <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
                                <p style="font-size: 13px; color: #999; margin-top: 30px;">If you didn't request this, please ignore this email or contact support.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Reset OTP sent successfully to:', toEmail);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('❌ Brevo API error:', data);
            return { success: false, error: data.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('❌ Reset email failed:', error.message);
        return { success: false, error: error.message };
    }
}

// ==========================================
// 2. SEND OTP ROUTE (REGISTER)
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

        // ✅ Use Brevo API (NOT nodemailer)
        const emailResult = await sendOTPEmail(cleanEmail, null, otp);
        
        if (!emailResult.success) {
            console.error("Failed to send OTP:", emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error("SkillsMind OTP Error:", error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// --- 3. VERIFY OTP ROUTE ---
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
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
});

// ==========================================
// 4. FORGOT PASSWORD - SEND OTP (🔥 FIXED)
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        
        console.log('Forgot password requested for:', cleanEmail);
        
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found in SkillsMind" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[cleanEmail] = { 
            otp, 
            expires: Date.now() + 10 * 60 * 1000 
        };

        // ✅ Use Brevo API (NOT nodemailer/transporter)
        const emailResult = await sendResetEmail(cleanEmail, user.name, otp);
        
        if (!emailResult.success) {
            console.error("Failed to send reset OTP:", emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send reset code. Please try again.' });
        }

        console.log('✅ Reset OTP sent successfully');
        res.status(200).json({ success: true, message: 'Password reset OTP sent!' });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: 'Error sending reset code' });
    }
});

// --- 5. VERIFY RESET OTP ---
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
        console.error("Verify reset OTP error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- 6. RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        delete otpStore[cleanEmail];
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Failed to update password" });
    }
});

// --- 7. GOOGLE LOGIN ---
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
// 8. REGISTER ROUTE (WITH WELCOME EMAIL)
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

        // ✅ Send welcome email using Brevo (fire and forget - don't fail registration if email fails)
        sendWelcomeEmail(cleanEmail, name).catch(e => {
            console.log("Welcome email failed (non-critical):", e.message);
        });
        
        res.status(201).json({ success: true, message: "SkillsMind registration successful!" });
    } catch (err) { 
        console.error("SkillsMind Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error during registration" }); 
    }
});

// --- 9. LOGIN ROUTE ---
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
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server Error during login" }); 
    }
});

// --- 10. GET ALL USERS ---
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- 11. GET USER ---
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('enrolledCourses', 'title thumbnail category');
        
        res.json(user);
    } catch (err) { 
        res.status(500).json({ success: false, message: "Server Error" }); 
    }
});

// --- 12. DELETE USER ---
router.delete('/delete-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        await StudentProfile.findOneAndDelete({ user: userId });
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Delete failed" });
    }
});

// --- 13. DELETE ENROLMENT ---
router.delete('/delete-enrolment/:id', async (req, res) => {
    try {
        const profileId = req.params.id;
        const deletedProfile = await StudentProfile.findByIdAndDelete(profileId);
        if (!deletedProfile) return res.status(404).json({ success: false, message: "Record not found" });
        res.status(200).json({ success: true, message: "Submission deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Deletion error" });
    }
});

// --- 14. GET ALL STUDENT PROFILES ---
router.get('/all-profiles', async (req, res) => {
    try {
        const profiles = await StudentProfile.find().populate({
            path: 'user',
            model: User,
            select: 'name email'
        });
        res.json({ success: true, profiles });
    } catch (err) {
        console.error("Fetch Profiles Error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch profiles" });
    }
});

// --- 15. GET ME ---
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpires')
            .populate('enrolledCourses', 'title thumbnail category');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user: user });
    } catch (error) {
        console.error('Auth/me error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;