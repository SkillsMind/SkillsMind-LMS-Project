const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models - ✅ FIXED: Use correct model names
const Announcement = require('../models/Announcement');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
// ✅ FIXED: Use CareerOpportunity (new model name)
const CareerOpportunity = require('../models/Job');
// ✅ FIXED: Use Schedule model
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const StudentCourse = require('../models/StudentCourse');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// ==========================================
// 📊 ADMIN DASHBOARD STATS
// ==========================================
router.get('/dashboard-stats', auth, isAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCourses = await Course.countDocuments();
        const totalAssignments = await Assignment.countDocuments({ isActive: true });
        const totalQuizzes = await Quiz.countDocuments({ isActive: true });
        
        res.json({
            success: true,
            stats: {
                totalStudents,
                totalCourses,
                totalAssignments,
                totalQuizzes
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 👥 GET STUDENTS BY COURSE (For Dropdown)
// ==========================================
router.get('/students-by-course/:courseId', auth, isAdmin, async (req, res) => {
    try {
        const enrollments = await StudentCourse.find({ 
            courseId: req.params.courseId,
            status: 'active'
        }).populate('studentId', 'name email');

        const students = enrollments.map(e => ({
            id: e.studentId._id,
            name: e.studentId.name,
            email: e.studentId.email,
            enrollmentDate: e.enrollmentDate
        }));

        res.json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 📝 ASSIGNMENTS MANAGEMENT
// ==========================================

// Get all assignments (Admin view)
router.get('/assignments', auth, isAdmin, async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate('courseId', 'title')
            .populate('instructorId', 'name')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, assignments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create assignment
router.post('/assignments', auth, isAdmin, async (req, res) => {
    try {
        const { title, description, courseId, type, totalMarks, dueDate } = req.body;
        
        const assignment = new Assignment({
            title,
            description,
            courseId,
            instructorId: req.user.id,
            type,
            totalMarks,
            dueDate: new Date(dueDate),
            isActive: true
        });
        
        await assignment.save();
        
        // Notify enrolled students
        const enrolledStudents = await StudentCourse.find({ 
            courseId: courseId,
            status: 'active'
        }).distinct('studentId');
        
        const notifications = enrolledStudents.map(sid => ({
            recipientId: sid,
            title: 'New Assignment',
            message: `Assignment "${title}" posted`,
            type: 'assignment',
            relatedTo: { model: 'Assignment', id: assignment._id }
        }));
        
        await Notification.insertMany(notifications);
        
        res.status(201).json({ success: true, assignment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete assignment
router.delete('/assignments/:id', auth, isAdmin, async (req, res) => {
    try {
        await Assignment.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// ✅ ATTENDANCE MANAGEMENT
// ==========================================

// Get attendance for a course on specific date
router.get('/attendance/:courseId', auth, isAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        const searchDate = new Date(date);
        
        // Get enrolled students
        const enrollments = await StudentCourse.find({ 
            courseId: req.params.courseId,
            status: 'active'
        }).populate('studentId', 'name email');

        // Get existing attendance for that date
        const existingAttendance = await Attendance.find({
            courseId: req.params.courseId,
            date: {
                $gte: new Date(searchDate.setHours(0,0,0,0)),
                $lt: new Date(searchDate.setHours(23,59,59,999))
            }
        });

        const attendanceMap = {};
        existingAttendance.forEach(a => {
            attendanceMap[a.studentId.toString()] = a.status;
        });

        const students = enrollments.map(e => ({
            studentId: e.studentId._id,
            name: e.studentId.name,
            email: e.studentId.email,
            status: attendanceMap[e.studentId._id.toString()] || 'absent'
        }));

        res.json({ success: true, students, date });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark attendance
router.post('/attendance/mark', auth, isAdmin, async (req, res) => {
    try {
        const { courseId, date, attendanceList } = req.body;
        
        // Delete existing records for that date
        await Attendance.deleteMany({ 
            courseId: courseId, 
            date: {
                $gte: new Date(new Date(date).setHours(0,0,0,0)),
                $lt: new Date(new Date(date).setHours(23,59,59,999))
            }
        });

        // Insert new records
        const records = attendanceList.map(item => ({
            studentId: item.studentId,
            courseId: courseId,
            date: new Date(date),
            status: item.status,
            remarks: item.remarks,
            markedBy: req.user.id
        }));

        await Attendance.insertMany(records);
        
        res.json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 🎯 QUIZZES MANAGEMENT
// ==========================================

// Get all quizzes
router.get('/quizzes', auth, isAdmin, async (req, res) => {
    try {
        const quizzes = await Quiz.find()
            .populate('courseId', 'title')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create quiz
router.post('/quizzes', auth, isAdmin, async (req, res) => {
    try {
        const quiz = new Quiz({
            ...req.body,
            instructorId: req.user.id
        });
        await quiz.save();
        res.status(201).json({ success: true, quiz });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete quiz
router.delete('/quizzes/:id', auth, isAdmin, async (req, res) => {
    try {
        await Quiz.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Quiz deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 📢 ANNOUNCEMENTS/NOTICES
// ==========================================

// Get all announcements
router.get('/announcements', auth, isAdmin, async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('courseId', 'title')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, announcements });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create announcement
router.post('/announcements', auth, isAdmin, async (req, res) => {
    try {
        const announcement = new Announcement({
            ...req.body,
            createdBy: req.user.id
        });
        await announcement.save();
        
        // Send notifications based on target audience
        if (req.body.targetAudience === 'all') {
            const students = await User.find({ role: 'student' }).distinct('_id');
            const notifications = students.map(sid => ({
                recipientId: sid,
                title: 'New Announcement',
                message: req.body.title,
                type: 'announcement',
                relatedTo: { model: 'Announcement', id: announcement._id }
            }));
            await Notification.insertMany(notifications);
        }
        
        res.status(201).json({ success: true, announcement });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 💼 JOBS & LINKS - ✅ FIXED: Use CareerOpportunity model
// ==========================================

// ✅ FIXED: Use CareerOpportunity instead of JobInternship
router.post('/jobs', auth, isAdmin, async (req, res) => {
    try {
        const job = new CareerOpportunity({
            ...req.body,
            postedBy: req.user.id
        });
        await job.save();
        res.status(201).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ NOTE: Important Links ke liye separate routes hain - /api/important-links
// Ye admin.js mein sirf basic routes hain
router.post('/links', auth, isAdmin, async (req, res) => {
    try {
        // ✅ FIX: Use correct model
        const ImportantLink = require('../models/ImportantLink');
        const link = new ImportantLink({
            ...req.body,
            createdBy: req.user.id
        });
        await link.save();
        res.status(201).json({ success: true, link });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 📅 SCHEDULE - ✅ FIXED: Use Schedule model
// ==========================================

router.post('/schedule', auth, isAdmin, async (req, res) => {
    try {
        const schedule = new Schedule({
            ...req.body,
            instructor: req.user.id
        });
        await schedule.save();
        res.status(201).json({ success: true, schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;