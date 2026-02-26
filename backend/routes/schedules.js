const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ==========================================
// GET ALL SCHEDULES (Admin)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('courseId', 'title duration category')
            .sort({ sessionDate: 1, time: 1 });

        res.json({ 
            success: true, 
            data: schedules 
        });
    } catch (err) {
        console.error('Get Schedules Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// GET SINGLE SCHEDULE
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('courseId', 'title duration category enrolledStudentIds');

        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Schedule not found' 
            });
        }

        res.json({ 
            success: true, 
            data: schedule 
        });
    } catch (err) {
        console.error('Get Schedule Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// GET SCHEDULES BY BATCH ID
// ==========================================
router.get('/batch/:batchId', async (req, res) => {
    try {
        const schedules = await Schedule.find({ batchId: req.params.batchId })
            .populate('courseId', 'title thumbnail')
            .sort({ sessionDate: 1, time: 1 });

        res.json({ 
            success: true, 
            data: schedules 
        });
    } catch (err) {
        console.error('Get Batch Schedules Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// GET SCHEDULES BY COURSE (For Students)
// ==========================================
router.get('/course/:courseId', async (req, res) => {
    try {
        const schedules = await Schedule.find({ 
            courseId: req.params.courseId,
            status: { $ne: 'cancelled' }
        })
        .populate('courseId', 'title thumbnail')
        .sort({ sessionDate: 1, time: 1 });

        res.json({ 
            success: true, 
            data: schedules 
        });
    } catch (err) {
        console.error('Get Course Schedules Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// GET STUDENT'S SCHEDULES WITH LINK VISIBILITY CHECK
// ==========================================
router.get('/my-schedules/student', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('enrolledCourses');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const courseIds = user.enrolledCourses.map(c => c._id);
        const now = new Date();
        
        const schedules = await Schedule.find({ 
            courseId: { $in: courseIds },
            status: { $ne: 'cancelled' }
        })
        .populate('courseId', 'title thumbnail')
        .sort({ weekNumber: 1, sessionNumber: 1, sessionDate: 1, time: 1 });

        // Process schedules to control meeting link visibility
        const processedSchedules = schedules.map(schedule => {
            const scheduleObj = schedule.toObject();
            const sessionDateTime = new Date(schedule.sessionDate);
            const [hours, minutes] = schedule.time.split(':').map(Number);
            sessionDateTime.setHours(hours, minutes, 0, 0);
            
            const showLinkTime = new Date(sessionDateTime.getTime() - (schedule.showLinkBeforeMinutes * 60000));
            
            // Only show meeting link if it's time
            if (now < showLinkTime) {
                delete scheduleObj.meetingLink;
                scheduleObj.linkVisible = false;
                scheduleObj.linkAvailableAt = showLinkTime;
                scheduleObj.countdownMinutes = Math.ceil((showLinkTime - now) / 60000);
            } else {
                scheduleObj.linkVisible = true;
            }
            
            return scheduleObj;
        });

        res.json({ 
            success: true, 
            data: processedSchedules 
        });
    } catch (err) {
        console.error('Get My Schedules Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// 🔥 NEW: BATCH CREATE FROM WEEK-WISE DATA
// ==========================================
router.post('/batch-create', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const { 
            courseId, 
            startDate, 
            durationWeeks,
            schedules, // Array of schedule objects from frontend
            instructor,
            color,
            notifyStudents
        } = req.body;

        // Validate required fields
        if (!courseId || !startDate || !schedules || !Array.isArray(schedules)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: courseId, startDate, schedules array'
            });
        }

        // Generate batch ID
        const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add batchId and other common fields to each schedule
        const schedulesToInsert = schedules.map((sched, index) => ({
            ...sched,
            batchId,
            courseId,
            instructor: instructor || sched.instructor || '',
            color: color || sched.color || '#000B29',
            notifyStudents: notifyStudents !== false,
            status: 'upcoming',
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Save all schedules
        const createdSchedules = await Schedule.insertMany(schedulesToInsert);

        // Notify students if needed
        if (notifyStudents) {
            const io = req.app.get('io');
            if (io) {
                io.to(`course_${courseId}`).emit('batchScheduleCreated', {
                    courseId,
                    batchId,
                    count: createdSchedules.length
                });
            }
        }

        res.status(201).json({ 
            success: true, 
            message: `${createdSchedules.length} schedules created successfully`,
            data: {
                batchId,
                count: createdSchedules.length,
                schedules: createdSchedules
            }
        });
    } catch (err) {
        console.error('Batch Create Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// UPDATE SCHEDULE (Admin only)
// ==========================================
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('courseId', 'title');

        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Schedule not found' 
            });
        }

        const io = req.app.get('io');
        if (io && schedule.courseId) {
            io.to(`course_${schedule.courseId._id}`).emit('scheduleUpdated', {
                courseId: schedule.courseId._id,
                schedule: schedule
            });
        }

        res.json({ 
            success: true, 
            message: 'Schedule updated successfully',
            data: schedule 
        });
    } catch (err) {
        console.error('Update Schedule Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// DELETE SCHEDULE (Admin only)
// ==========================================
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const schedule = await Schedule.findByIdAndDelete(req.params.id);

        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Schedule not found' 
            });
        }

        const io = req.app.get('io');
        if (io && schedule.courseId) {
            io.to(`course_${schedule.courseId}`).emit('scheduleCancelled', {
                courseId: schedule.courseId,
                scheduleId: req.params.id
            });
        }

        res.json({ 
            success: true, 
            message: 'Schedule deleted successfully' 
        });
    } catch (err) {
        console.error('Delete Schedule Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// DELETE ENTIRE BATCH
// ==========================================
router.delete('/batch/:batchId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const result = await Schedule.deleteMany({ batchId: req.params.batchId });

        res.json({ 
            success: true, 
            message: `${result.deletedCount} schedules deleted`,
            count: result.deletedCount
        });
    } catch (err) {
        console.error('Delete Batch Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

module.exports = router;