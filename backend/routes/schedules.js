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
// 🔥 NEW: CHECK SCHEDULE CONFLICTS
// ==========================================
router.post('/check-conflict', async (req, res) => {
    try {
        const { courseId, sessionDate, time, duration, excludeId } = req.body;
        
        if (!courseId || !sessionDate || !time) {
            return res.json({ success: true, conflicts: [] });
        }

        const date = new Date(sessionDate);
        const [hours, minutes] = time.split(':').map(Number);
        
        // Create date objects for comparison
        const classStart = new Date(date);
        classStart.setHours(hours, minutes, 0, 0);
        
        const classEnd = new Date(classStart);
        classEnd.setMinutes(classEnd.getMinutes() + (parseInt(duration) || 60));

        // Find all schedules for this course on this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let query = {
            courseId: courseId,
            sessionDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        // Exclude current schedule if editing
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existingSchedules = await Schedule.find(query);

        // Check for time overlaps
        const conflicts = existingSchedules.filter(schedule => {
            const [sHours, sMinutes] = schedule.time.split(':').map(Number);
            const scheduleStart = new Date(date);
            scheduleStart.setHours(sHours, sMinutes, 0, 0);
            
            const scheduleEnd = new Date(scheduleStart);
            scheduleEnd.setMinutes(scheduleEnd.getMinutes() + (schedule.duration || 60));

            // Check overlap
            return (classStart < scheduleEnd && classEnd > scheduleStart);
        });

        res.json({
            success: true,
            conflicts: conflicts.map(c => ({
                _id: c._id,
                title: c.title,
                time: c.time,
                duration: c.duration
            }))
        });

    } catch (err) {
        console.error('Conflict Check Error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// 🔥 NEW: GET SCHEDULES BY COURSE AND WEEK (For Week Edit)
// ==========================================
router.get('/course/:courseId/week/:weekNumber', auth, async (req, res) => {
    try {
        const { courseId, weekNumber } = req.params;
        
        const schedules = await Schedule.find({ 
            courseId: courseId,
            weekNumber: parseInt(weekNumber)
        })
        .populate('courseId', 'title thumbnail')
        .sort({ sessionDate: 1, time: 1 });

        res.json({ 
            success: true, 
            count: schedules.length,
            data: schedules 
        });
    } catch (err) {
        console.error('Get Week Schedules Error:', err);
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
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid schedule ID format' 
            });
        }

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
// 🔥 CREATE SINGLE SCHEDULE (FIXED)
// ==========================================
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const {
            title,
            courseId,
            day,
            time,
            duration,
            type,
            topic,
            description,
            meetingLink,
            color,
            instructor,
            notifyStudents,
            sessionDate,
            weekNumber,
            sessionNumber
        } = req.body;

        // Validation
        if (!title || !courseId || !day || !time || !sessionDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, courseId, day, time, sessionDate'
            });
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM format (24-hour)'
            });
        }

        // Check for conflicts
        const date = new Date(sessionDate);
        const [hours, minutes] = time.split(':').map(Number);
        const classStart = new Date(date);
        classStart.setHours(hours, minutes, 0, 0);
        
        const classEnd = new Date(classStart);
        classEnd.setMinutes(classEnd.getMinutes() + (parseInt(duration) || 60));

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingSchedules = await Schedule.find({
            courseId: courseId,
            sessionDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const conflicts = existingSchedules.filter(schedule => {
            const [sHours, sMinutes] = schedule.time.split(':').map(Number);
            const scheduleStart = new Date(date);
            scheduleStart.setHours(sHours, sMinutes, 0, 0);
            
            const scheduleEnd = new Date(scheduleStart);
            scheduleEnd.setMinutes(scheduleEnd.getMinutes() + (schedule.duration || 60));

            return (classStart < scheduleEnd && classEnd > scheduleStart);
        });

        // Calculate week number based on course start date if not provided
        let calculatedWeekNumber = weekNumber;
        if (!calculatedWeekNumber) {
            const course = await Course.findById(courseId);
            if (course && course.startDate) {
                const courseStart = new Date(course.startDate);
                const diffTime = Math.abs(date - courseStart);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                calculatedWeekNumber = Math.ceil(diffDays / 7) || 1;
            } else {
                calculatedWeekNumber = 1;
            }
        }

        const scheduleData = {
            title: title.trim(),
            courseId,
            day,
            time,
            duration: parseInt(duration) || 60,
            type: type || 'live',
            status: 'upcoming',
            topic: topic ? topic.trim() : title.trim(),
            description: description || '',
            meetingLink: meetingLink || '',
            showLinkBeforeMinutes: 15,
            color: color || '#000B29',
            instructor: instructor || '',
            notifyStudents: notifyStudents !== false,
            sessionDate: new Date(sessionDate),
            weekNumber: calculatedWeekNumber,
            sessionNumber: sessionNumber || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const schedule = new Schedule(scheduleData);
        await schedule.save();

        // Populate course info for response
        await schedule.populate('courseId', 'title');

        // Emit socket event if available
        const io = req.app.get('io');
        if (io && schedule.courseId) {
            io.to(`course_${schedule.courseId._id}`).emit('scheduleCreated', {
                courseId: schedule.courseId._id,
                schedule: schedule
            });
        }

        res.status(201).json({ 
            success: true, 
            message: conflicts.length > 0 ? 'Schedule created with time conflict warning' : 'Schedule created successfully',
            data: schedule,
            conflicts: conflicts.length > 0 ? conflicts.map(c => c.title) : undefined
        });

    } catch (err) {
        console.error('Create Schedule Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// ==========================================
// 🔥 BATCH CREATE FROM WEEK-WISE DATA
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
            schedules,
            instructor,
            color,
            notifyStudents
        } = req.body;

        // Validate required fields
        if (!courseId || !schedules || !Array.isArray(schedules)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: courseId, schedules array'
            });
        }

        // Validate each schedule
        for (const sched of schedules) {
            if (!sched.sessionDate || !sched.time || !sched.topic) {
                return res.status(400).json({
                    success: false,
                    message: 'Each schedule must have sessionDate, time, and topic'
                });
            }
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
            sessionDate: new Date(sched.sessionDate),
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
// 🔥 NEW: UPDATE OR CREATE WEEK SCHEDULES (For Week Edit)
// ==========================================
router.post('/week-update/:courseId/:weekNumber', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        const { courseId, weekNumber } = req.params;
        const { days, instructor, color, notifyStudents } = req.body;

        if (!days || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Days array is required'
            });
        }

        // Get existing schedules for this week
        const existingSchedules = await Schedule.find({
            courseId: courseId,
            weekNumber: parseInt(weekNumber)
        });

        const results = {
            created: [],
            updated: [],
            deleted: []
        };

        // Process each day
        for (let i = 0; i < days.length; i++) {
            const dayData = days[i];
            
            if (!dayData.enabled || !dayData.topic.trim()) continue;

            const scheduleData = {
                title: `Week ${weekNumber} - ${dayData.topic}`,
                courseId: courseId,
                weekNumber: parseInt(weekNumber),
                sessionNumber: i + 1,
                day: dayData.day,
                time: dayData.time,
                duration: parseInt(dayData.duration) || 60,
                type: dayData.type || 'live',
                status: 'upcoming',
                topic: dayData.topic,
                description: `${dayData.topic} - Week ${weekNumber} ${dayData.day} class`,
                color: color || '#000B29',
                instructor: instructor || '',
                notifyStudents: notifyStudents !== false,
                sessionDate: new Date(dayData.date),
                updatedAt: new Date()
            };

            if (dayData._isExisting && dayData._originalId) {
                // Update existing
                const updated = await Schedule.findByIdAndUpdate(
                    dayData._originalId,
                    scheduleData,
                    { new: true }
                );
                if (updated) results.updated.push(updated);
            } else {
                // Create new
                scheduleData.createdAt = new Date();
                const created = new Schedule(scheduleData);
                await created.save();
                results.created.push(created);
            }
        }

        // Delete removed schedules
        const currentIds = days
            .filter(d => d._isExisting && d._originalId)
            .map(d => d._originalId);

        const toDelete = existingSchedules.filter(s => !currentIds.includes(s._id.toString()));
        
        for (const sched of toDelete) {
            await Schedule.findByIdAndDelete(sched._id);
            results.deleted.push(sched._id);
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`course_${courseId}`).emit('weekScheduleUpdated', {
                courseId,
                weekNumber: parseInt(weekNumber),
                results
            });
        }

        res.json({
            success: true,
            message: `Week ${weekNumber} updated successfully`,
            data: {
                created: results.created.length,
                updated: results.updated.length,
                deleted: results.deleted.length,
                schedules: [...results.created, ...results.updated]
            }
        });

    } catch (err) {
        console.error('Week Update Error:', err);
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

        // Validate ID format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid schedule ID format' 
            });
        }

        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        // Ensure sessionDate is Date object
        if (updateData.sessionDate) {
            updateData.sessionDate = new Date(updateData.sessionDate);
        }

        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            updateData,
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

        // Validate ID format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid schedule ID format' 
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

// ==========================================
// 🔥 NEW: GET UPCOMING SCHEDULES (For Dashboard)
// ==========================================
router.get('/dashboard/upcoming', auth, async (req, res) => {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const schedules = await Schedule.find({
            sessionDate: {
                $gte: now,
                $lte: tomorrow
            },
            status: { $in: ['upcoming', 'ongoing'] }
        })
        .populate('courseId', 'title thumbnail')
        .sort({ sessionDate: 1, time: 1 })
        .limit(10);

        res.json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (err) {
        console.error('Get Upcoming Error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;