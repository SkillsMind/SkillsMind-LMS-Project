const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Course = require('../models/Course');
const User = require('../models/User');
const StudentCourse = require('../models/StudentCourse');
const LiveEnrollment = require('../models/LiveEnrollment');
const auth = require('../middleware/auth');

// ==========================================
// HELPER: Get Student's Enrolled Course IDs
// ==========================================
const getStudentCourseIds = async (studentId) => {
    const courseIds = [];
    
    // Method 1: User.enrolledCourses
    const user = await User.findById(studentId).select('enrolledCourses email');
    if (user?.enrolledCourses?.length > 0) {
        courseIds.push(...user.enrolledCourses.map(id => id.toString()));
    }
    
    // Method 2: StudentCourse model
    const studentCourses = await StudentCourse.find({
        $or: [
            { studentId: new mongoose.Types.ObjectId(studentId) },
            { studentId: studentId }
        ],
        status: { $in: ['active', 'completed', 'enrolled'] }
    }).populate('courseId', '_id');
    
    studentCourses.forEach(sc => {
        if (sc.courseId?._id) courseIds.push(sc.courseId._id.toString());
    });
    
    // Method 3: LiveEnrollment (by email)
    if (user?.email) {
        const liveEnrollments = await LiveEnrollment.find({ email: user.email });
        for (const enrollment of liveEnrollments) {
            if (enrollment.course) {
                const course = await Course.findOne({ title: enrollment.course });
                if (course) courseIds.push(course._id.toString());
            }
        }
    }
    
    // Method 4: Course.enrolledStudentIds
    const coursesWithStudent = await Course.find({
        enrolledStudentIds: { $in: [new mongoose.Types.ObjectId(studentId), studentId] }
    });
    coursesWithStudent.forEach(c => courseIds.push(c._id.toString()));
    
    return [...new Set(courseIds)];
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// @route   GET /api/jobs
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

// @route   POST /api/jobs
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

        // Validation
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

        // Validate courses exist
        const courseIds = relevantCourses.map(id => 
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
        ).filter(id => id !== null);

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

        // Create job
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
            createdBy: req.user.id
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

// @route   PUT /api/jobs/:id
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
            updateData.relevantCourses = updateData.relevantCourses.map(id => 
                mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
            ).filter(id => id !== null);
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

// @route   DELETE /api/jobs/:id
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

// ==========================================
// STUDENT ROUTES (REAL-TIME)
// ==========================================

// @route   GET /api/jobs/student/available
router.get('/student/available', auth, async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Get enrolled courses using helper
        const courseIds = await getStudentCourseIds(studentId);
        
        if (courseIds.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: 'No enrolled courses found'
            });
        }

        const courseObjectIds = courseIds.map(id => new mongoose.Types.ObjectId(id));

        // Get matching jobs
        const jobs = await Job.find({
            relevantCourses: { $in: courseObjectIds },
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
        console.error('Error fetching student jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: error.message
        });
    }
});

// @route   GET /api/jobs/student/by-type/:type
router.get('/student/by-type/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const studentId = req.user.id;
        
        const courseIds = await getStudentCourseIds(studentId);
        const courseObjectIds = courseIds.map(id => new mongoose.Types.ObjectId(id));

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