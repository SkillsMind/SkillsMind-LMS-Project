const express = require('express');
const router = express.Router();
const CareerOpportunity = require('../models/Job');
const { protect, admin } = require('../middleware/auth');

// @desc    Create new job/internship
// @route   POST /api/careers
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      title, company, type, description, requirements,
      skills, relevantCourses, location, salary, applicationUrl, deadline
    } = req.body;

    const job = await CareerOpportunity.create({
      title,
      company,
      type,
      description,
      requirements: requirements || [],
      skills: skills || [],
      relevantCourses: relevantCourses || [],
      location,
      salary,
      applicationUrl,
      deadline,
      postedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all jobs (Admin)
// @route   GET /api/careers
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const jobs = await CareerOpportunity.find()
      .populate('relevantCourses', 'name')
      .populate('postedBy', 'name')
      .sort({ postedAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get jobs for student (matching enrolled courses)
// @route   GET /api/careers/student/my-jobs
// @access  Private
router.get('/student/my-jobs', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    
    const courseIds = student.enrolledCourses ? student.enrolledCourses.map(c => c._id) : [];
    
    const currentDate = new Date();

    const jobs = await CareerOpportunity.find({
      relevantCourses: { $in: courseIds },
      isActive: true,
      deadline: { $gt: currentDate }
    })
    .sort({ postedAt: -1 })
    .limit(50);

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get student jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get jobs by type (Student)
// @route   GET /api/careers/student/by-type/:type
// @access  Private
router.get('/student/by-type/:type', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    
    const courseIds = student.enrolledCourses ? student.enrolledCourses.map(c => c._id) : [];
    
    const currentDate = new Date();

    const jobs = await CareerOpportunity.find({
      type: req.params.type,
      relevantCourses: { $in: courseIds },
      isActive: true,
      deadline: { $gt: currentDate }
    }).sort({ postedAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs by type error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update job
// @route   PUT /api/careers/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const job = await CareerOpportunity.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/careers/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const job = await CareerOpportunity.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;