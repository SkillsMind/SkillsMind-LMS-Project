const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const StudentCourse = require('../models/StudentCourse');
const ClassSchedule = require('../models/ClassSchedule');
const auth = require('../middleware/auth');

// GET: Student ki monthly attendance
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { month, year } = req.query;
        const queryDate = new Date(year || new Date().getFullYear(), month ? month - 1 : new Date().getMonth(), 1);
        const endDate = new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0);

        // Student ki courses
        const enrollments = await StudentCourse.find({ 
            studentId: req.params.studentId,
            status: 'active'
        });
        
        const courseIds = enrollments.map(e => e.courseId);

        // Attendance fetch karo
        const attendanceRecords = await Attendance.find({
            studentId: req.params.studentId,
            courseId: { $in: courseIds },
            date: { $gte: queryDate, $lte: endDate }
        }).populate('courseId', 'title');

        // Stats calculate karo
        const stats = {
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            excused: attendanceRecords.filter(r => r.status === 'excused').length,
            total: attendanceRecords.length
        };

        const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

        // Calendar format mein data
        const calendarData = attendanceRecords.map(record => ({
            date: record.date,
            status: record.status,
            courseName: record.courseId.title,
            remarks: record.remarks
        }));

        res.json({
            success: true,
            month: queryDate.getMonth() + 1,
            year: queryDate.getFullYear(),
            stats: { ...stats, percentage },
            records: calendarData
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET: Course wise attendance summary
router.get('/summary/:studentId', auth, async (req, res) => {
    try {
        const enrollments = await StudentCourse.find({ 
            studentId: req.params.studentId,
            status: 'active'
        }).populate('courseId', 'title');

        const summary = [];
        
        for (const enrollment of enrollments) {
            const records = await Attendance.find({
                studentId: req.params.studentId,
                courseId: enrollment.courseId._id
            });

            const total = records.length;
            const present = records.filter(r => r.status === 'present').length;
            
            summary.push({
                courseId: enrollment.courseId._id,
                courseName: enrollment.courseId.title,
                totalClasses: total,
                attended: present,
                percentage: total > 0 ? Math.round((present / total) * 100) : 0
            });
        }

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;