const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// ==========================================
// GET STUDENT PROFILE & SETTINGS
// ==========================================
router.get('/profile/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email: email.toLowerCase() }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const profile = await StudentProfile.findOne({ user: user._id });

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone: profile?.phone || profile?.mobile || '',
                gender: profile?.gender || 'male',
                bio: profile?.bio || '',
                city: profile?.city || '',
                institute: profile?.institute || '',
                education: profile?.education || profile?.status || '',
                profileImage: profile?.profileImage || profile?.profileImage || ''
            }
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPDATE PROFILE
// ==========================================
router.put('/profile/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        const { name, phone, bio, gender, city, institute, education } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update User name
        if (name) user.name = name;
        await user.save();

        // Update or Create Profile
        let profile = await StudentProfile.findOne({ user: user._id });
        
        if (!profile) {
            profile = new StudentProfile({
                user: user._id,
                firstName: name?.split(' ')[0] || '',
                lastName: name?.split(' ').slice(1).join(' ') || '',
                email: email,
                phone: phone,
                mobile: phone,
                gender: gender,
                bio: bio,
                city: city,
                institute: institute,
                education: education,
                status: education
            });
        } else {
            if (name) {
                profile.firstName = name.split(' ')[0];
                profile.lastName = name.split(' ').slice(1).join(' ') || '';
            }
            if (phone) {
                profile.phone = phone;
                profile.mobile = phone;
            }
            if (gender) profile.gender = gender;
            if (bio) profile.bio = bio;
            if (city) profile.city = city;
            if (institute) profile.institute = institute;
            if (education) {
                profile.education = education;
                profile.status = education;
            }
        }
        
        await profile.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: profile.phone,
                gender: profile.gender,
                bio: profile.bio,
                city: profile.city,
                institute: profile.institute,
                education: profile.education
            }
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// GET NOTIFICATION SETTINGS
// ==========================================
router.get('/notifications/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Default settings
        const defaultSettings = {
            emailNotifications: true,
            pushNotifications: true,
            courseUpdates: true,
            assignmentReminders: true,
            quizReminders: true,
            marketingEmails: false
        };

        const settings = user.settings?.notifications || defaultSettings;

        res.json({
            success: true,
            settings: settings
        });
        
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPDATE NOTIFICATION SETTINGS
// ==========================================
router.put('/notifications/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        const { settings } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize settings object
        if (!user.settings) user.settings = {};
        user.settings.notifications = settings;
        
        await user.save();

        res.json({
            success: true,
            message: 'Notification settings updated'
        });
        
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// GET PRIVACY SETTINGS
// ==========================================
router.get('/privacy/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const defaultSettings = {
            profileVisible: true,
            showProgress: true,
            showCertificates: true,
            allowMessages: true
        };

        const settings = user.settings?.privacy || defaultSettings;

        res.json({
            success: true,
            settings: settings
        });
        
    } catch (error) {
        console.error('Get privacy error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPDATE PRIVACY SETTINGS
// ==========================================
router.put('/privacy/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        const { settings } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.settings) user.settings = {};
        user.settings.privacy = settings;
        
        await user.save();

        res.json({
            success: true,
            message: 'Privacy settings updated'
        });
        
    } catch (error) {
        console.error('Update privacy error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// GET APPEARANCE SETTINGS
// ==========================================
router.get('/appearance/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const defaultSettings = {
            theme: 'light',
            fontSize: 'medium',
            compactMode: false
        };

        const settings = user.settings?.appearance || defaultSettings;

        res.json({
            success: true,
            settings: settings
        });
        
    } catch (error) {
        console.error('Get appearance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPDATE APPEARANCE SETTINGS
// ==========================================
router.put('/appearance/:email', auth, async (req, res) => {
    try {
        const { email } = req.params;
        const { settings } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.settings) user.settings = {};
        user.settings.appearance = settings;
        
        await user.save();

        res.json({
            success: true,
            message: 'Appearance settings updated'
        });
        
    } catch (error) {
        console.error('Update appearance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// CHANGE PASSWORD
// ==========================================
router.post('/change-password', auth, async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPLOAD AVATAR
// ==========================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/avatars/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

router.post('/upload-avatar/:email', auth, upload.single('avatar'), async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const imagePath = req.file.path.replace(/\\/g, "/");
        
        // Update profile with new avatar
        let profile = await StudentProfile.findOne({ user: user._id });
        if (profile) {
            profile.profileImage = imagePath;
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            imageUrl: imagePath
        });
        
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;