const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const SibApiV3Sdk = require('@getbrevo/brevo');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile'); 
const auth = require('../middleware/auth');

// --- Memory storage for OTPs ---
const otpStore = {}; 

// ==========================================
// BREVO HTTPS API SETUP (NOT SMTP)
// ==========================================
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Debug: Check if API key is loaded
console.log('🔑 Brevo API Key loaded:', process.env.BREVO_API_KEY ? '✅ Yes' : '❌ No');

// Function to send email via Brevo HTTPS API
async function sendEmailViaBrevo(toEmail, subject, htmlContent, userName = 'Student') {
    try {
        console.log(`📧 Attempting to send email to: ${toEmail}`);
        console.log(`📧 Subject: ${subject}`);
        
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.sender = {
            email: 'skillsmind786@gmail.com',
            name: 'SkillsMind'
        };
        
        sendSmtpEmail.to = [{
            email: toEmail,
            name: userName
        }];
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email sent successfully to ${toEmail}: ${response.messageId}`);
        return { success: true, messageId: response.messageId };
        
    } catch (error) {
        console.error('❌ Email send failed:', error.response?.body || error.message);
        return { success: false, error: error.response?.body || error.message };
    }
}

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
// 2. SEND OTP ROUTE (UPDATED WITH BREVO API)
// ==========================================
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('📨 /send-otp called for:', email);
        
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser && existingUser.password) {
            return res.status(400).json({ success: false, message: "User already exists. Please login." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔢 Generated OTP:', otp);
        
        otpStore[cleanEmail] = {
            otp: otp,
            expires: Date.now() + 10 * 60 * 1000 
        };

        const emailHtml = getEmailLayout(`
            <h2 style="color: #000B29; text-align: center;">Verify Your Account</h2>
            <p style="text-align: center; font-size: 16px; color: #555;">Welcome to SkillsMind! Use the secure verification code below to complete your registration.</p>
            <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; padding: 20px 40px; background-color: #f1f1f1; border-radius: 12px; border: 2px dashed #000B29;">
                    <h1 style="color: #E30613; letter-spacing: 12px; font-size: 50px; margin: 0; font-weight: 900;">${otp}</h1>
                </div>
            </div>
            <p style="text-align: center; font-size: 14px; color: #888;">This code will expire in 10 minutes for security reasons.</p>
        `);

        const emailResult = await sendEmailViaBrevo(cleanEmail, 'SkillsMind | Account Verification Code', emailHtml);
        
        if (emailResult.success) {
            console.log('✅ OTP sent successfully to:', cleanEmail);
            res.status(200).json({ success: true, message: 'OTP sent successfully!' });
        } else {
            console.error('❌ Failed to send OTP to:', cleanEmail, emailResult.error);
            res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
        }
        
    } catch (error) {
        console.error("SkillsMind OTP Error:", error);
        res.status(500).json({ success: false, message: 'SkillsMind server cannot send email right now.' });
    }
});

// --- 3. VERIFY OTP ROUTE (UNCHANGED) ---
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
// 4. FORGOT PASSWORD - SEND OTP (UPDATED WITH BREVO API)
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('📨 /forgot-password called for:', email);
        
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found in SkillsMind" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔢 Generated reset OTP:', otp);
        
        otpStore[cleanEmail] = { otp, expires: Date.now() + 10 * 60 * 1000 };

        const emailHtml = getEmailLayout(`
            <h2 style="color: #000B29; text-align: center;">Password Reset Request</h2>
            <p style="text-align: center; color: #555;">You requested to reset your password. Use the following code to proceed:</p>
            <div style="text-align: center; margin: 40px 0;">
                <h1 style="color: #000B29; letter-spacing: 10px; font-size: 45px; font-weight: 800; border-bottom: 4px solid #E30613; display: inline-block;">${otp}</h1>
            </div>
            <p style="text-align: center; font-size: 13px; color: #999;">If you didn't request this, please ignore this email or contact support.</p>
        `);

        const emailResult = await sendEmailViaBrevo(user.email, 'SkillsMind | Password Reset Request', emailHtml, user.name);
        
        if (emailResult.success) {
            console.log('✅ Reset OTP sent to:', cleanEmail);
            res.status(200).json({ success: true, message: 'Password reset OTP sent!' });
        } else {
            console.error('❌ Failed to send reset OTP:', emailResult.error);
            res.status(500).json({ success: false, message: 'Failed to send reset code' });
        }
        
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: 'Error sending reset code' });
    }
});

// --- 5. FORGOT PASSWORD - VERIFY OTP (UNCHANGED) ---
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

// --- 6. FORGOT PASSWORD - UPDATE PASSWORD (UNCHANGED) ---
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

// ==========================================
// 7. GOOGLE LOGIN ROUTE (ORIGINAL - NO CHANGES)
// ==========================================
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
        console.error("Google login error:", err.message);
        res.status(500).json({ success: false, message: "Google login failed" });
    }
});

// ==========================================
// 8. REGISTER ROUTE (UPDATED WITH BREVO API)
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

        // Welcome email via Brevo API
        const welcomeHtml = getEmailLayout(`
            <h2 style="color: #000B29;">Welcome to the Family! 🎉</h2>
            <p style="font-size: 16px;">Hello <b>${name}</b>,</p>
            <p style="font-size: 16px;">We are thrilled to have you join <b>SkillsMind</b>. Our mission is to provide you with a world-class learning experience and help you master the skills of the future.</p>
            <div style="background-color: #fff5f5; border-left: 5px solid #E30613; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-weight: bold; color: #333;">Start Your Journey:</p>
                <p style="margin: 5px 0 0 0; color: #666;">Login to your dashboard to explore our premium courses and start learning today!</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://www.skillsmind.online/login" style="background-color: #000B29; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Go to Dashboard</a>
            </div>
        `);
        
        await sendEmailViaBrevo(cleanEmail, `Welcome to SkillsMind, ${name}! 🎉`, welcomeHtml, name).catch(e => console.log("Welcome Email Error:", e));
        
        res.status(201).json({ success: true, message: "SkillsMind registration successful!" });
    } catch (err) { 
        console.error("SkillsMind Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error during registration" }); 
    }
});

// --- 9. LOGIN ROUTE (UNCHANGED) ---
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

// --- 10. GET ALL USERS (UNCHANGED) ---
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ==========================================
// /user ROUTE (UNCHANGED)
// ==========================================
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

// --- DELETE USER (UNCHANGED) ---
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

// --- DELETE ENROLMENT/PROFILE (UNCHANGED) ---
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

// --- GET ALL STUDENT PROFILES (UNCHANGED) ---
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
        res.status(500).json({ success: false, message: "SkillsMind: Failed to fetch profiles" });
    }
});

// ==========================================
// /me ROUTE (UNCHANGED)
// ==========================================
router.get('/me', auth, async (req, res) => {
    try {
        console.log('=== AUTH /ME CALLED ===');
        
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpires')
            .populate('enrolledCourses', 'title thumbnail category');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log('✅ User found:', user.email);
        console.log('✅ Enrolled courses:', user.enrolledCourses?.length || 0);

        res.json({
            success: true,
            user: user
        });
        
    } catch (error) {
        console.error('❌ Auth/me error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;