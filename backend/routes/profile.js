const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const StudentProfile = require('../models/StudentProfile');

// --- MULTER SETUP ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'skillsmind-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- ROUTES ---

// 1. GET ALL SUBMISSIONS (Admin Dashboard)
router.get('/all-submissions', async (req, res) => {
    try {
        const submissions = await StudentProfile.find()
            .populate('user', 'name email') 
            .sort({ createdAt: -1 });
        
        console.log("✅ SkillsMind: Data fetched for Admin Dashboard");
        res.status(200).json(submissions || []); 
    } catch (error) {
        console.error("❌ Admin Fetch Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 2. DELETE SUBMISSION
router.delete('/delete-submission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProfile = await StudentProfile.findByIdAndDelete(id);
        if (!deletedProfile) return res.status(404).json({ success: false, message: "Record not found" });
        res.status(200).json({ success: true, message: "SkillsMind: Record Deleted!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Image Upload
router.post('/upload-image/:userId', upload.single('profileImage'), async (req, res) => {
    try {
        const { userId } = req.params;
        const imagePath = req.file.path.replace(/\\/g, "/");
        const updatedProfile = await StudentProfile.findOneAndUpdate(
            { user: userId }, 
            { $set: { profileImage: imagePath } }, 
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, imageUrl: imagePath, profile: updatedProfile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Check Enrollment Status
router.get('/check/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await StudentProfile.findOne({ user: userId });
        res.status(200).json({ exists: !!profile, profile });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 5. Submit/Update Profile (FIXED & MAPPING SYNCED)
router.post('/submit', async (req, res) => {
    console.log("📥 [BACKEND] Received data from Frontend:", req.body);

    try {
        const { userId, user, ...profileData } = req.body;
        const finalUserId = userId || user;

        if (!finalUserId) {
            console.error("❌ SkillsMind: User ID is missing in request body");
            return res.status(400).json({ success: false, message: "User ID missing" });
        }

        // --- MAPPING LOGIC START ---
        // Frontend names ko Model names ke sath pakka sync kar rahe hain
        const cleanData = {};
        Object.keys(profileData).forEach(key => {
            if (profileData[key] !== "" && profileData[key] !== null) {
                cleanData[key] = profileData[key];
            }
        });

        // Specific Mapping for Mismatched Fields
        if (profileData.phone) cleanData.mobile = profileData.phone; // phone ko mobile mein bhi rakho
        if (profileData.mobile) cleanData.phone = profileData.mobile; // mobile ko phone mein bhi rakho
        if (profileData.status) cleanData.education = profileData.status; // status (dropdown) ko education mein rakho
        if (profileData.education) cleanData.status = profileData.education; 
        // --- MAPPING LOGIC END ---

        const profile = await StudentProfile.findOneAndUpdate(
            { user: finalUserId }, 
            { 
                $set: { 
                    ...cleanData, 
                    user: finalUserId 
                } 
            }, 
            { 
                new: true, 
                upsert: true, 
                runValidators: false 
            } 
        );

        console.log("✅ SkillsMind: Profile Updated Successfully with Mapping!");
        res.status(200).json({ success: true, message: "SkillsMind Profile Updated!", profile });

    } catch (err) {
        console.error("❌ SkillsMind Submit Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Get Details (FULL FETCH)
router.get('/details/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // User table se email bhi nikaal rahe hain fallback ke liye
        const profile = await StudentProfile.findOne({ user: userId }).populate('user', 'email');
        
        if (!profile) return res.status(404).json({ message: "Not found" });

        console.log("✅ SkillsMind: Sending complete data to Sidebar");
        res.status(200).json(profile);
    } catch (err) {
        console.error("❌ SkillsMind Details Fetch Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;