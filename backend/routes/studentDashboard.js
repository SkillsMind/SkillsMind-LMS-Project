const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// All Models
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const StudentCourse = require('../models/StudentCourse');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

// ✅ NEW: Import CareerOpportunity model (new name)
const CareerOpportunity = require('../models/Job');
const ImportantLink = require('../models/ImportantLink');
const Schedule = require('../models/Schedule');

// Auth Middleware
const auth = require('../middleware/auth');

// ==========================================
// GET /api/student-dashboard/overview/:studentId
// ==========================================
router.get('/overview/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        console.log('Dashboard API called for student:', studentId);
        console.log('Authenticated user from token:', req.user.id);

        // Security check
        if (req.user.id !== studentId) {
            console.log('Access denied: User ID mismatch');
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only view your own dashboard.' 
            });
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const today = new Date();

        // 1. Get Student Profile
        const studentProfile = await StudentProfile.findOne({ user: studentObjectId })
            .populate('user', 'name email role');

        if (!studentProfile) {
            console.log('Profile not found for user:', studentId);
            return res.status(404).json({ 
                success: false, 
                message: 'Student profile not found. Please complete your profile first.' 
            });
        }

        // 2. Get Enrolled Courses
        const enrolledCourses = await StudentCourse.find({ 
            studentId: studentObjectId,
            status: { $in: ['active', 'completed'] }
        }).populate('courseId', 'title thumbnail instructor duration level syllabus');

        const courseIds = enrolledCourses.map(ec => ec.courseId._id);

        // 3. Get Current Course (most recent)
        let currentCourse = null;
        if (enrolledCourses.length > 0) {
            const activeEnroll = enrolledCourses.sort((a, b) => 
                (b.progress.lastAccessed || 0) - (a.progress.lastAccessed || 0)
            )[0];
            
            const courseDetails = activeEnroll.courseId;
            const completedLessons = activeEnroll.progress.completedLessons.length;
            const totalLessons = courseDetails.syllabus?.reduce((acc, week) => 
                acc + (week.lessons?.length || 0), 0) || 24;
            
            const nextClass = await Schedule.findOne({
                course: courseDetails._id,
                isActive: true
            }).sort({ startDateTime: 1 });

            currentCourse = {
                id: courseDetails._id,
                name: courseDetails.title,
                instructor: courseDetails.instructor?.name || 'Instructor',
                progress: Math.round((completedLessons / totalLessons) * 100) || activeEnroll.progress.overallPercentage,
                totalLessons: totalLessons,
                completedLessons: completedLessons,
                nextClass: nextClass ? 
                    new Date(nextClass.startDateTime).toLocaleString() 
                    : 'No upcoming classes',
                thumbnail: courseDetails.thumbnail || '/default-course.jpg',
                enrollmentType: activeEnroll.enrollmentType,
                batchInfo: activeEnroll.batchInfo,
                meetingLink: nextClass?.meetingLink || null
            };
        }

        // 4. Get Attendance Stats
        const attendanceStats = await Attendance.aggregate([
            { 
                $match: { 
                    studentId: studentObjectId,
                    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                } 
            },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const totalAttendanceDays = attendanceStats.reduce((acc, curr) => acc + curr.count, 0);
        const presentDays = attendanceStats.find(s => s._id === 'present')?.count || 0;
        const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0;

        // 5. Get Pending Assignments
        const pendingAssignments = await Assignment.find({
            courseId: { $in: courseIds },
            isActive: true,
            dueDate: { $gte: new Date() },
            'submissions.studentId': { $ne: studentObjectId }
        }).select('title dueDate courseId totalMarks');

        // 6. Get Upcoming Quizzes
        const upcomingQuizzes = await Quiz.find({
            courseId: { $in: courseIds },
            isActive: true,
            startDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            endDate: { $gte: new Date() },
            'attempts.studentId': { $ne: studentObjectId }
        }).select('title duration totalMarks startDate endDate');

        // 7. Calculate Grade
        const assignmentSubmissions = await Assignment.find({
            courseId: { $in: courseIds },
            'submissions.studentId': studentObjectId,
            'submissions.status': 'graded'
        });

        let totalMarks = 0;
        let obtainedMarks = 0;
        assignmentSubmissions.forEach(assignment => {
            const sub = assignment.submissions.find(s => s.studentId.toString() === studentId);
            if (sub) {
                totalMarks += assignment.totalMarks;
                obtainedMarks += sub.marks;
            }
        });
        
        const overallPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

        // 8. Get Announcements
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
        }).sort({ createdAt: -1 }).limit(5);

        // 9. Get Job Opportunities - ✅ FIXED: Use CareerOpportunity model
        const jobOpportunities = await CareerOpportunity.find({
            relevantCourses: { $in: courseIds },
            isActive: true,
            deadline: { $gte: new Date() }
        }).sort({ postedAt: -1 }).limit(5);

        // 10. Get Important Links
        const importantLinks = await ImportantLink.find({
            course: { $in: courseIds },
            isActive: true
        }).sort({ createdAt: -1 }).limit(8);

        // 11. Get Weekly Schedule
        const weeklySchedule = await Schedule.find({
            course: { $in: courseIds },
            isActive: true
        }).sort({ startDateTime: 1 });

        // 12. Get Notifications
        const notifications = await Notification.find({
            recipientId: studentObjectId,
            isRead: false
        }).sort({ createdAt: -1 }).limit(10);

        // Helper function for grade
        const calculateGrade = (percentage) => {
            if (percentage >= 90) return 'A+';
            if (percentage >= 85) return 'A';
            if (percentage >= 80) return 'A-';
            if (percentage >= 75) return 'B+';
            if (percentage >= 70) return 'B';
            if (percentage >= 65) return 'B-';
            if (percentage >= 60) return 'C+';
            if (percentage >= 55) return 'C';
            if (percentage >= 50) return 'D';
            return 'F';
        };

        // Compile Response
        const dashboardData = {
            success: true,
            student: {
                id: studentId,
                name: studentProfile.user.name,
                email: studentProfile.user.email,
                phone: studentProfile.phone || studentProfile.mobile,
                avatar: studentProfile.profileImage,
                joinDate: studentProfile.createdAt,
                location: studentProfile.city,
                studentId: `SM-${studentProfile.createdAt.getFullYear()}-${String(studentProfile._id).slice(-4).toUpperCase()}`
            },
            currentCourse: currentCourse,
            stats: {
                attendance: attendanceRate,
                assignmentsPending: pendingAssignments.length,
                quizzesCompleted: await Quiz.countDocuments({
                    courseId: { $in: courseIds },
                    'attempts.studentId': studentObjectId,
                    'attempts.status': 'completed'
                }),
                overallGrade: calculateGrade(overallPercentage),
                overallPercentage: Math.round(overallPercentage),
                totalCourses: enrolledCourses.length,
                completedCourses: enrolledCourses.filter(c => c.status === 'completed').length
            },
            quickAccess: {
                pendingAssignments: pendingAssignments.map(a => ({
                    id: a._id,
                    title: a.title,
                    dueDate: a.dueDate,
                    courseName: enrolledCourses.find(c => c.courseId._id.toString() === a.courseId.toString())?.courseId?.title,
                    totalMarks: a.totalMarks
                })),
                upcomingQuizzes: upcomingQuizzes.map(q => ({
                    id: q._id,
                    title: q.title,
                    startDate: q.startDate,
                    duration: q.duration,
                    totalMarks: q.totalMarks
                }))
            },
            announcements: announcements.map(a => ({
                id: a._id,
                title: a.title,
                content: a.content,
                category: a.category,
                priority: a.priority,
                createdAt: a.createdAt,
                isNew: (new Date() - a.createdAt) < 24 * 60 * 60 * 1000
            })),
            opportunities: jobOpportunities.map(j => ({
                id: j._id,
                title: j.title,
                company: j.company,
                type: j.type,
                location: j.location,
                deadline: j.deadline
            })),
            importantLinks: importantLinks.map(l => ({
                id: l._id,
                title: l.title,
                url: l.url,
                category: l.category,
                description: l.description
            })),
            weeklySchedule: weeklySchedule.map(s => ({
                id: s._id,
                title: s.title,
                courseName: enrolledCourses.find(c => c.courseId._id.toString() === s.course.toString())?.courseId?.title,
                dateTime: s.startDateTime,
                meetingLink: s.meetingLink,
                isToday: s.startDateTime ? new Date(s.startDateTime).toDateString() === new Date().toDateString() : false
            })),
            notifications: notifications.map(n => ({
                id: n._id,
                title: n.title,
                message: n.message,
                type: n.type,
                actionLink: n.actionLink
            }))
        };

        console.log('Dashboard data compiled successfully');
        res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Dashboard Overview Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load dashboard data',
            error: error.message 
        });
    }
});

// ==========================================
// PUT /api/student-dashboard/notifications/:notificationId/read
// ==========================================
router.put('/notifications/:notificationId/read', auth, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, {
            isRead: true,
            readAt: new Date()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;