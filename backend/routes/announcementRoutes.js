const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const StudentCourse = require('../models/StudentCourse');
const auth = require('../middleware/auth');

// GET: Student ke liye relevant announcements
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const enrollments = await StudentCourse.find({ 
            studentId: req.params.studentId,
            status: 'active'
        });
        
        const courseIds = enrollments.map(e => e.courseId);

        // Targeted announcements fetch karo
        const announcements = await Announcement.find({
            $or: [
                { targetAudience: 'all' },
                { targetAudience: 'enrolled', courseId: { $in: courseIds } },
                { targetAudience: 'specific-course', courseId: { $in: courseIds } }
            ],
            isActive: true,
            $or: [
                { expiryDate: { $exists: false } },
                { expiryDate: { $gte: new Date() } }
            ]
        })
        .populate('courseId', 'title')
        .populate('createdBy', 'name')
        .sort({ priority: -1, createdAt: -1 });

        const formattedAnnouncements = announcements.map(a => ({
            id: a._id,
            title: a.title,
            content: a.content,
            category: a.category,
            priority: a.priority,
            targetAudience: a.targetAudience,
            courseName: a.courseId?.title || 'All Courses',
            postedBy: a.createdBy?.name || 'Admin',
            attachments: a.attachments,
            createdAt: a.createdAt,
            isNew: (new Date() - a.createdAt) < 24 * 60 * 60 * 1000 // 24 hours
        }));

        res.json({ success: true, announcements: formattedAnnouncements });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;