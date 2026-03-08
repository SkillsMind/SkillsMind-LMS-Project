const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const StudentCourse = require('../models/StudentCourse');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Job = require('../models/Job');
const ImportantLink = require('../models/ImportantLink');
const Schedule = require('../models/Schedule');
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');

// ==========================================
// 🔥 CLEAN HELPER: Get Student's Enrolled Courses
// ==========================================
const getStudentEnrolledCourses = async (studentId) => {
    console.log('🔍 Finding courses for student:', studentId);
    
    const user = await User.findById(studentId).select('enrolledCourses');
    
    if (!user?.enrolledCourses?.length) {
        return { courseIds: [], courses: [] };
    }

    const courseIds = user.enrolledCourses.map(id => id.toString());
    
    // Get full course details with instructor populated
    const courses = await Course.find({
        _id: { $in: courseIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).select('title code category instructor thumbnail totalLessons').populate('instructor', 'name');

    console.log(`✅ Found ${courses.length} courses`);
    return { courseIds, courses };
};

// ==========================================
// GET /api/student-dashboard/courses
// Returns: List of enrolled courses (for sidebar/dropdown)
// ==========================================
router.get('/courses', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courses } = await getStudentEnrolledCourses(studentId);

        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/student-dashboard/overview
// Returns: Dashboard data for ALL enrolled courses
// ==========================================
router.get('/overview', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseIds, courses } = await getStudentEnrolledCourses(studentId);
        
        if (!courseIds.length) {
            return res.json({
                success: true,
                courses: [],
                student: null,
                stats: {
                    totalCourses: 0,
                    totalLessons: 0,
                    pendingAssignments: 0,
                    upcomingQuizzes: 0
                },
                data: {
                    assignments: [],
                    quizzes: [],
                    announcements: [],
                    importantLinks: [],
                    schedules: [],
                    notices: [],
                    jobs: []
                }
            });
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get student profile
        const studentProfile = await StudentProfile.findOne({ user: studentObjectId });

        // Get ALL data for ALL enrolled courses
        const courseObjectIds = courseIds.map(id => new mongoose.Types.ObjectId(id));

        const [
            allJobs,
            allAssignments,
            allQuizzes,
            allAnnouncements,
            allImportantLinks,
            allSchedules,
            allNotices
        ] = await Promise.all([
            // Jobs for all courses
            Job.find({
                relevantCourses: { $in: courseObjectIds },
                isActive: true,
                deadline: { $gte: today }
            }).populate('relevantCourses', 'title code').sort({ postedAt: -1 }),

            // Assignments for all courses
            Assignment.find({
                courseId: { $in: courseObjectIds },
                isActive: true,
                dueDate: { $gte: today }
            }).select('title dueDate totalMarks courseId').populate('courseId', 'title'),

            // Quizzes for all courses
            Quiz.find({
                course: { $in: courseObjectIds },
                isActive: true,
                endDate: { $gte: today }
            }).select('title duration totalMarks course').populate('course', 'title'),

            // Announcements for all courses or global
            Announcement.find({
                $or: [
                    { targetAudience: 'all' },
                    { targetAudience: 'enrolled', courseId: { $in: courseObjectIds } }
                ],
                isActive: true
            }).sort({ createdAt: -1 }).limit(10),

            // Important Links for all courses
            ImportantLink.find({
                course: { $in: courseObjectIds },
                isActive: true
            }).sort({ createdAt: -1 }),

            // Schedules for all courses
            Schedule.find({
                courseId: { $in: courseObjectIds },
                isActive: true,
                $or: [
                    { date: { $gte: today } },
                    { isRecurring: true }
                ]
            }).sort({ date: 1, startTime: 1 }).populate('courseId', 'title'),

            // Notices for all courses
            Notice.find({
                isActive: true,
                $or: [
                    { course: { $in: courseObjectIds } },
                    { targetCourses: { $in: courseObjectIds } },
                    { course: null }
                ],
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $gte: today } }
                ]
            }).populate('course', 'title code').sort({ priority: -1, createdAt: -1 })
        ]);

        // Calculate total lessons from all courses
        const totalLessons = courses.reduce((sum, course) => sum + (course.totalLessons || 0), 0);

        // Transform courses data
        const coursesData = courses.map(course => ({
            id: course._id,
            title: course.title,
            code: course.code,
            category: course.category,
            instructor: course.instructor?.name || 'TBA',
            thumbnail: course.thumbnail,
            totalLessons: course.totalLessons || 0,
            progress: 0 // Calculate if you have progress tracking
        }));

        res.json({
            success: true,
            student: {
                id: studentId,
                name: studentProfile?.user?.name || studentProfile?.name || 'Student',
                email: studentProfile?.user?.email,
                avatar: studentProfile?.profileImage
            },
            courses: coursesData,
            stats: {
                totalCourses: courses.length,
                totalLessons: totalLessons,
                pendingAssignments: allAssignments.length,
                upcomingQuizzes: allQuizzes.length,
                unreadNotices: allNotices.filter(n => !n.readBy?.some(r => r.user.toString() === studentId)).length
            },
            data: {
                jobs: allJobs,
                assignments: allAssignments,
                quizzes: allQuizzes,
                announcements: allAnnouncements,
                importantLinks: allImportantLinks,
                schedules: allSchedules,
                notices: allNotices
            }
        });

    } catch (error) {
        console.error('❌ Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/student-dashboard/overview/:courseId
// Returns: Dashboard data for SPECIFIC course only (for detailed view)
// ==========================================
router.get('/overview/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Verify student is enrolled in this course
        const { courseIds, courses } = await getStudentEnrolledCourses(studentId);
        
        if (!courseIds.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        const courseObjectId = new mongoose.Types.ObjectId(courseId);
        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get course details
        const currentCourse = courses.find(c => c._id.toString() === courseId);

        // Get ALL data for THIS SPECIFIC COURSE ONLY
        const [
            jobs,
            assignments,
            quizzes,
            announcements,
            importantLinks,
            schedules,
            notices
        ] = await Promise.all([
            Job.find({
                relevantCourses: courseObjectId,
                isActive: true,
                deadline: { $gte: today }
            }).populate('relevantCourses', 'title code').sort({ postedAt: -1 }),

            Assignment.find({
                courseId: courseObjectId,
                isActive: true,
                dueDate: { $gte: today }
            }).select('title dueDate totalMarks'),

            Quiz.find({
                course: courseObjectId,
                isActive: true,
                endDate: { $gte: today }
            }).select('title duration totalMarks'),

            Announcement.find({
                $or: [
                    { targetAudience: 'all' },
                    { targetAudience: 'enrolled', courseId: courseObjectId }
                ],
                isActive: true
            }).sort({ createdAt: -1 }).limit(5),

            ImportantLink.find({
                course: courseObjectId,
                isActive: true
            }).sort({ createdAt: -1 }),

            Schedule.find({
                courseId: courseObjectId,
                isActive: true,
                $or: [
                    { date: { $gte: today } },
                    { isRecurring: true }
                ]
            }).sort({ date: 1, startTime: 1 }),

            Notice.find({
                isActive: true,
                $or: [
                    { course: courseObjectId },
                    { targetCourses: courseObjectId },
                    { course: null }
                ],
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $gte: today } }
                ]
            }).populate('course', 'title code').sort({ priority: -1, createdAt: -1 })
        ]);

        const studentProfile = await StudentProfile.findOne({ user: studentObjectId });

        res.json({
            success: true,
            course: {
                id: currentCourse._id,
                title: currentCourse.title,
                code: currentCourse.code,
                category: currentCourse.category,
                instructor: currentCourse.instructor?.name || currentCourse.instructor || 'TBA',
                thumbnail: currentCourse.thumbnail,
                totalLessons: currentCourse.totalLessons || 0
            },
            student: {
                id: studentId,
                name: studentProfile?.user?.name || studentProfile?.name || 'Student',
                email: studentProfile?.user?.email,
                avatar: studentProfile?.profileImage
            },
            stats: {
                totalJobs: jobs.length,
                pendingAssignments: assignments.length,
                upcomingQuizzes: quizzes.length,
                unreadNotices: notices.filter(n => !n.readBy?.some(r => r.user.toString() === studentId)).length,
                totalLessons: schedules.length,
                upcomingClasses: schedules.filter(s => new Date(s.date) >= today).length
            },
            data: {
                jobs,
                assignments,
                quizzes,
                announcements,
                importantLinks,
                schedules,
                notices
            }
        });

    } catch (error) {
        console.error('❌ Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/student-dashboard/jobs/:courseId
// Returns: Jobs for SPECIFIC course only
// ==========================================
router.get('/jobs/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const { courseIds } = await getStudentEnrolledCourses(studentId);
        
        if (!courseIds.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const jobs = await Job.find({
            relevantCourses: new mongoose.Types.ObjectId(courseId),
            isActive: true,
            deadline: { $gte: today }
        })
        .populate('relevantCourses', 'title code')
        .sort({ postedAt: -1 });

        res.json({
            success: true,
            count: jobs.length,
            data: jobs
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/student-dashboard/assignments/:courseId
// Returns: Assignments for SPECIFIC course only
// ==========================================
router.get('/assignments/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const { courseIds } = await getStudentEnrolledCourses(studentId);
        
        if (!courseIds.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        const assignments = await Assignment.find({
            courseId: new mongoose.Types.ObjectId(courseId),
            isActive: true
        }).sort({ dueDate: 1 });

        res.json({
            success: true,
            count: assignments.length,
            data: assignments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/student-dashboard/quizzes/:courseId
// Returns: Quizzes for SPECIFIC course only
// ==========================================
router.get('/quizzes/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const { courseIds } = await getStudentEnrolledCourses(studentId);
        
        if (!courseIds.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const quizzes = await Quiz.find({
            course: new mongoose.Types.ObjectId(courseId),
            isActive: true,
            endDate: { $gte: today }
        }).sort({ startDate: 1 });

        res.json({
            success: true,
            count: quizzes.length,
            data: quizzes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching quizzes',
            error: error.message
        });
    }
});

// ==========================================
// LEGACY ROUTES (for backward compatibility)
// ==========================================

// GET /api/student-dashboard/my-courses
router.get('/my-courses', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courses } = await getStudentEnrolledCourses(studentId);

        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

// PUT /api/student-dashboard/notifications/:notificationId/read
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

// PUT /api/student-dashboard/notices/:noticeId/read
router.put('/notices/:noticeId/read', auth, async (req, res) => {
    try {
        const { noticeId } = req.params;
        const userId = req.user.id;

        const notice = await Notice.findById(noticeId);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        const alreadyRead = notice.readBy?.some(r => r.user.toString() === userId);
        
        if (!alreadyRead) {
            notice.readBy.push({ user: userId, readAt: new Date() });
            await notice.save();
        }

        res.json({ success: true, message: 'Notice marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;