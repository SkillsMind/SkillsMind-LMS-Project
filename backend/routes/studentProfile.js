const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const StudentCourse = require('../models/StudentCourse');
const User = require('../models/User');
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Multer config for cover photo and profile pic
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = 'uploads/profiles/';
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, 'SkillsMind-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'), false);
        }
    }
});

// GET /api/student-profile/dashboard-stats - Real-time stats
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Get all enrollments
        const enrollments = await StudentCourse.find({ studentId })
            .populate('courseId', 'title thumbnail instructor');
        
        // Calculate stats
        const activeCourses = enrollments.filter(e => e.status === 'active').length;
        const completedCourses = enrollments.filter(e => e.status === 'completed').length;
        const certificates = enrollments.filter(e => e.certificate.issued).length;
        const totalStudyHours = enrollments.reduce((acc, curr) => acc + (curr.progress.timeSpent || 0), 0);
        const avgProgress = enrollments.length > 0 
            ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress.overallPercentage || 0), 0) / enrollments.length)
            : 0;
        
        // Calculate streak (simplified - last 7 days activity)
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentActivity = enrollments.filter(e => e.progress.lastAccessed && e.progress.lastAccessed > lastWeek).length;
        const streak = recentActivity > 0 ? Math.min(recentActivity, 7) : 0;
        
        res.json({
            success: true,
            stats: {
                activeCourses,
                completedCourses,
                certificates,
                studyHours: Math.round(totalStudyHours / 60), // Convert minutes to hours
                avgProgress,
                streak,
                totalEnrollments: enrollments.length
            },
            enrollments: enrollments.map(e => ({
                _id: e._id,
                courseId: e.courseId._id,
                title: e.courseId.title,
                thumbnail: e.courseId.thumbnail,
                instructor: e.courseId.instructor?.name || 'SkillsMind',
                progress: e.progress.overallPercentage,
                status: e.status,
                enrollmentType: e.enrollmentType,
                certificate: e.certificate,
                lastAccessed: e.progress.lastAccessed
            }))
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/student-profile/activities - Recent activities
router.get('/activities', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        
        const enrollments = await StudentCourse.find({ studentId })
            .populate('courseId', 'title')
            .sort({ updatedAt: -1 })
            .limit(10);
        
        const activities = enrollments.map(e => ({
            id: e._id,
            type: e.status === 'completed' ? 'completed' : 
                  e.progress.overallPercentage > 0 ? 'in-progress' : 'enrolled',
            title: e.status === 'completed' ? 'Course Completed' : 
                   e.progress.overallPercentage > 0 ? 'Continued Learning' : 'Enrolled in Course',
            description: `${e.courseId.title}`,
            timeAgo: getTimeAgo(e.updatedAt)
        }));
        
        res.json({ success: true, activities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/student-profile/update-bio - Update bio
router.put('/update-bio', auth, async (req, res) => {
    try {
        const { bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { 'profile.bio': bio } },
            { new: true }
        );
        res.json({ success: true, bio: user.profile?.bio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/student-profile/update-education - Update education
router.put('/update-education', auth, async (req, res) => {
    try {
        const { education, institute, occupation } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { 
                'profile.education': education,
                'profile.institute': institute,
                'profile.occupation': occupation
            }},
            { new: true }
        );
        res.json({ success: true, profile: user.profile });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/student-profile/upload-cover - Upload cover photo
router.post('/upload-cover', auth, upload.single('coverPhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const coverPhotoPath = `/uploads/profiles/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { 'profile.coverPhoto': coverPhotoPath } },
            { new: true }
        );
        
        res.json({ 
            success: true, 
            coverPhoto: coverPhotoPath,
            message: 'Cover photo updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/student-profile/upload-dp - Upload profile picture
router.post('/upload-dp', auth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const profilePicPath = `/uploads/profiles/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profilePic: profilePicPath } },
            { new: true }
        );
        
        res.json({ 
            success: true, 
            profilePic: profilePicPath,
            message: 'Profile picture updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/student-profile/remove-cover - Remove cover photo
router.delete('/remove-cover', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $unset: { 'profile.coverPhoto': 1 } }
        );
        res.json({ success: true, message: 'Cover photo removed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/student-profile/remove-dp - Remove profile picture
router.delete('/remove-dp', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profilePic: '' } }
        );
        res.json({ success: true, message: 'Profile picture removed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

module.exports = router;