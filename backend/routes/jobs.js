const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ============================================
// ADMIN ROUTES
// ============================================

// Get all jobs (Admin)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const jobs = await Job.find({ isActive: true })
            .populate('relevantCourses', 'name code title')
            .populate('createdBy', 'name email')
            .sort({ postedAt: -1 });

        res.json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: error.message
        });
    }
});

// Get courses for admin dropdown
router.get('/courses', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const courses = await Course.find({ isHide: false })
            .select('_id title code name')
            .sort({ title: 1 });

        res.json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create job (Admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const {
            title,
            company,
            type,
            description,
            requirements,
            skills,
            relevantCourses,
            location,
            salary,
            applicationUrl,
            deadline
        } = req.body;

        if (!title || !company || !description || !applicationUrl || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (!relevantCourses || relevantCourses.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one relevant course'
            });
        }

        const courseIds = relevantCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (courseIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course IDs provided'
            });
        }

        const validCourses = await Course.find({ _id: { $in: courseIds } });
        if (validCourses.length !== courseIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more selected courses do not exist'
            });
        }

        const newJob = new Job({
            title: title.trim(),
            company: company.trim(),
            type: type || 'Job',
            description: description.trim(),
            requirements: Array.isArray(requirements) ? requirements : 
                requirements ? requirements.split('\n').filter(r => r.trim()) : [],
            skills: Array.isArray(skills) ? skills : 
                skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
            relevantCourses: courseIds,
            location: location?.trim() || 'Not specified',
            salary: salary?.trim() || 'Not disclosed',
            applicationUrl: applicationUrl.trim(),
            deadline: new Date(deadline),
            createdBy: req.user.id,
            isActive: true
        });

        await newJob.save();

        const populatedJob = await Job.findById(newJob._id)
            .populate('relevantCourses', 'name code title')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            data: populatedJob
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating job',
            error: error.message
        });
    }
});

// Update job (Admin)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
        }

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const updateData = { ...req.body };
        
        if (updateData.requirements && typeof updateData.requirements === 'string') {
            updateData.requirements = updateData.requirements.split('\n').filter(r => r.trim());
        }
        if (updateData.skills && typeof updateData.skills === 'string') {
            updateData.skills = updateData.skills.split(',').map(s => s.trim()).filter(s => s);
        }
        if (updateData.relevantCourses) {
            updateData.relevantCourses = updateData.relevantCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('relevantCourses', 'name code title')
            .populate('createdBy', 'name email');

        res.json({
            success: true,
            message: 'Job updated successfully',
            data: updatedJob
        });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating job',
            error: error.message
        });
    }
});

// Delete job (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
        }

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        job.isActive = false;
        await job.save();

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting job',
            error: error.message
        });
    }
});

// ============================================
// 🔥 STUDENT ROUTES (STRONG SYSTEM - 3 SOURCES)
// ============================================

// Get available jobs for student based on enrolled courses
router.get('/student/available', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        
        console.log('🔍 Jobs fetch for user:', userId);
        
        // 🔥🔥🔥 CRITICAL FIX: Get enrolled courses from 3 sources 🔥🔥🔥
        let enrolledCourseIds = [];
        
        // Source 1: User model (enrolledCourses)
        const user = await User.findById(userId).select('enrolledCourses email');
        if (user && user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
            enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
            console.log('✅ Source 1 - User.enrolledCourses:', enrolledCourseIds.length, 'courses');
        }
        
        // Source 2: LiveEnrollment (status: active)
        try {
            const LiveEnrollment = require('../models/LiveEnrollment');
            const liveEnrollments = await LiveEnrollment.find({
                userId: userId,
                status: 'active'
            }).select('courseId');
            
            console.log('✅ Source 2 - LiveEnrollment found:', liveEnrollments.length);
            
            liveEnrollments.forEach(enrollment => {
                if (enrollment.courseId) {
                    const courseIdStr = enrollment.courseId.toString();
                    if (!enrolledCourseIds.includes(courseIdStr)) {
                        enrolledCourseIds.push(courseIdStr);
                    }
                }
            });
        } catch (e) {
            console.log('⚠️ LiveEnrollment fetch error:', e.message);
        }
        
        // Source 3: Course.enrolledStudentIds (backup)
        try {
            const coursesWithStudent = await Course.find({
                enrolledStudentIds: userId
            }).select('_id title');
            
            console.log('✅ Source 3 - Course.enrolledStudentIds:', coursesWithStudent.length, 'courses');
            
            coursesWithStudent.forEach(course => {
                const courseIdStr = course._id.toString();
                if (!enrolledCourseIds.includes(courseIdStr)) {
                    enrolledCourseIds.push(courseIdStr);
                }
            });
        } catch (e) {
            console.log('⚠️ Course fetch error:', e.message);
        }

        // Remove duplicates
        enrolledCourseIds = [...new Set(enrolledCourseIds)];
        
        console.log('🔥 FINAL enrolledCourseIds for jobs:', enrolledCourseIds);

        if (enrolledCourseIds.length === 0) {
            console.log('❌ No enrolled courses found');
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: 'No enrolled courses found'
            });
        }

        // Convert to ObjectIds
        const courseObjectIds = enrolledCourseIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        // Get matching jobs
        const jobs = await Job.find({
            relevantCourses: { $in: courseObjectIds },
            isActive: true,
            deadline: { $gte: new Date() }
        })
        .populate('relevantCourses', 'title code')
        .sort({ postedAt: -1 });

        console.log(`📚 Found ${jobs.length} matching jobs for user`);

        res.json({
            success: true,
            count: jobs.length,
            data: jobs,
            debug: {
                enrolledCourseCount: enrolledCourseIds.length,
                matchingJobsCount: jobs.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching student jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: error.message
        });
    }
});

// Get jobs by type for student
router.get('/student/by-type/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const userId = req.user.id || req.user._id;
        
        console.log('🔍 Jobs fetch by type:', type, 'for user:', userId);
        
        // 🔥 Get enrolled courses from 3 sources
        let enrolledCourseIds = [];
        
        // Source 1: User model
        const user = await User.findById(userId).select('enrolledCourses');
        if (user && user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
            enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
        }
        
        // Source 2: LiveEnrollment
        try {
            const LiveEnrollment = require('../models/LiveEnrollment');
            const liveEnrollments = await LiveEnrollment.find({
                userId: userId,
                status: 'active'
            }).select('courseId');
            
            liveEnrollments.forEach(enrollment => {
                if (enrollment.courseId) {
                    const courseIdStr = enrollment.courseId.toString();
                    if (!enrolledCourseIds.includes(courseIdStr)) {
                        enrolledCourseIds.push(courseIdStr);
                    }
                }
            });
        } catch (e) {}
        
        // Source 3: Course.enrolledStudentIds
        try {
            const coursesWithStudent = await Course.find({
                enrolledStudentIds: userId
            }).select('_id');
            
            coursesWithStudent.forEach(course => {
                const courseIdStr = course._id.toString();
                if (!enrolledCourseIds.includes(courseIdStr)) {
                    enrolledCourseIds.push(courseIdStr);
                }
            });
        } catch (e) {}

        enrolledCourseIds = [...new Set(enrolledCourseIds)];
        
        if (enrolledCourseIds.length === 0) {
            return res.json({ success: true, count: 0, data: [] });
        }

        const courseObjectIds = enrolledCourseIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        const jobs = await Job.find({
            relevantCourses: { $in: courseObjectIds },
            type: type,
            isActive: true,
            deadline: { $gte: new Date() }
        })
        .populate('relevantCourses', 'title code')
        .sort({ postedAt: -1 });

        res.json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        console.error('Error fetching jobs by type:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;