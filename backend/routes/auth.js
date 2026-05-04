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
// 🔥 RESEND EMAIL SERVICE (DOMAIN VERIFIED)
// ==========================================

// ✅ Send OTP Email
async function sendOTPEmail(toEmail, userName, otpCode) {
    try {
        console.log('📧 Sending OTP via Resend to:', toEmail);
        
        const response = await axios.post('https://api.resend.com/emails', {
            from: 'SkillsMind <noreply@skillsmind.online>',
            to: [toEmail],
            subject: 'Your SkillsMind OTP Code',
            html: `
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
                            <p style="font-size: 16px; color: #555;">Your verification code:</p>
                            <div class="otp-code">${otpCode}</div>
                            <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ OTP sent via Resend:', response.data.id);
        return { success: true, messageId: response.data.id };
        
    } catch (error) {
        console.error('❌ Resend error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ✅ Send Reset Email
async function sendResetEmail(toEmail, userName, otpCode) {
    try {
        console.log('📧 Sending reset OTP via Resend to:', toEmail);
        
        const response = await axios.post('https://api.resend.com/emails', {
            from: 'SkillsMind Support <noreply@skillsmind.online>',
            to: [toEmail],
            subject: 'SkillsMind | Password Reset Request',
            html: `
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
                            <p style="font-size: 16px; color: #555;">Use this code to reset your password:</p>
                            <div class="otp-code">${otpCode}</div>
                            <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Reset OTP sent via Resend:', response.data.id);
        return { success: true, messageId: response.data.id };
        
    } catch (error) {
        console.error('❌ Resend reset error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ✅ Send Welcome Email
async function sendWelcomeEmail(toEmail, userName) {
    try {
        console.log('📧 Sending welcome email via Resend to:', toEmail);
        
        const response = await axios.post('https://api.resend.com/emails', {
            from: 'SkillsMind <noreply@skillsmind.online>',
            to: [toEmail],
            subject: `Welcome to SkillsMind, ${userName}! 🎉`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
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
                            <p>We are thrilled to have you join <b>SkillsMind</b>.</p>
                            <center><a href="https://skillsmind.online/login" class="btn">Go to Dashboard</a></center>
                        </div>
                    </div>
                </body>
                </html>
            `
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Welcome email sent via Resend:', response.data.id);
        return { success: true, messageId: response.data.id };
        
    } catch (error) {
        console.error('❌ Welcome email error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ==========================================
// ROUTES
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

        const emailResult = await sendOTPEmail(cleanEmail, null, otp);
        
        if (!emailResult.success) {
            console.error("Failed to send OTP:", emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

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
// 🔥 UPDATED REGISTER ROUTE WITH REFERRAL CODE CREATION
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, referralCode } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name, email: cleanEmail, password: hashedPassword });
        await user.save();
        
        delete otpStore[cleanEmail]; 

        sendWelcomeEmail(cleanEmail, name).catch(e => {
            console.log("Welcome email failed (non-critical):", e.message);
        });
        
        // 🔥🔥🔥 CREATE REFERRAL CODE FOR NEW USER 🔥🔥🔥
        try {
            const Referral = require('../models/Referral');
            const namePart = name.substring(0, 3).toUpperCase();
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const newReferralCode = `${namePart}${randomPart}`;
            
            const newReferral = new Referral({
                referrerId: user._id,
                referralCode: newReferralCode,
                referredFriends: []
            });
            
            await newReferral.save();
            console.log(`✅ Referral code created for new user: ${newReferralCode}`);
        } catch (refErr) {
            console.error('Referral creation error (non-critical):', refErr.message);
        }
        
        // 🔥🔥🔥 TRACK IF USER SIGNED UP VIA REFERRAL 🔥🔥🔥
        if (referralCode) {
            try {
                const Referral = require('../models/Referral');
                const referral = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
                
                if (referral) {
                    const existingFriend = referral.referredFriends.find(f => f.friendEmail === cleanEmail);
                    
                    if (!existingFriend) {
                        referral.referredFriends.push({
                            friendEmail: cleanEmail,
                            friendName: name,
                            status: 'signed_up',
                            signedUpAt: new Date()
                        });
                        referral.totalReferrals = referral.referredFriends.length;
                        await referral.save();
                        console.log(`✅ Referral tracked: ${name} signed up using ${referralCode}`);
                    }
                }
            } catch (refError) {
                console.error('Referral tracking error (non-critical):', refError.message);
            }
        }
        
        res.status(201).json({ success: true, message: "SkillsMind registration successful!" });
    } catch (err) { 
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error during registration" }); 
    }
});

// ==========================================
// 🔥 UPDATED LOGIN ROUTE WITH REFERRAL CODE CREATION FOR EXISTING USERS
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "Invalid Credentials" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Credentials" });
        
        // 🔥🔥🔥 CREATE REFERRAL CODE IF DOESN'T EXIST (FOR EXISTING USERS) 🔥🔥🔥
        try {
            const Referral = require('../models/Referral');
            let existingReferral = await Referral.findOne({ referrerId: user._id });
            
            if (!existingReferral) {
                const namePart = user.name.substring(0, 3).toUpperCase();
                const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
                const newReferralCode = `${namePart}${randomPart}`;
                
                const newReferral = new Referral({
                    referrerId: user._id,
                    referralCode: newReferralCode,
                    referredFriends: []
                });
                
                await newReferral.save();
                console.log(`✅ Referral code created for existing user: ${newReferralCode}`);
            }
        } catch (refErr) {
            console.error('Referral creation error (non-critical):', refErr.message);
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
                }, 
                message: `Welcome back to SkillsMind, ${user.name}!` 
            });
        });
    } catch (err) { 
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server Error during login" }); 
    }
});

router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

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