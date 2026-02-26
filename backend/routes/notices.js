const express = require('express');
const router = express.Router();

// Models
const Notice = require('../models/Notice');

// Middleware - with error handling
let protect, admin;
try {
  const auth = require('../middleware/auth');
  protect = auth.protect;
  admin = auth.admin;
} catch (err) {
  console.error('Auth middleware error:', err.message);
  // Fallback dummy middleware
  protect = (req, res, next) => next();
  admin = (req, res, next) => next();
}

// @desc    Create new notice
// @route   POST /api/notices
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, content, type, targetAudience, priority, expiryDate } = req.body;

    const notice = await Notice.create({
      title,
      content,
      type,
      targetAudience: targetAudience || [],
      priority: priority || 0,
      expiryDate: expiryDate || null,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all notices (Admin)
// @route   GET /api/notices
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('targetAudience', 'name')
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get notices for student
// @route   GET /api/notices/student/my-notices
// @access  Private
router.get('/student/my-notices', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    
    const courseIds = student.enrolledCourses ? student.enrolledCourses.map(c => c._id) : [];
    
    const currentDate = new Date();

    const notices = await Notice.find({
      $or: [
        { targetAudience: { $in: courseIds } },
        { targetAudience: { $size: 0 } }
      ],
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: currentDate } }
      ]
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(20);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = notices.filter(n => new Date(n.createdAt) > last24Hours).length;

    res.json({
      success: true,
      count: notices.length,
      newCount,
      data: notices
    });
  } catch (error) {
    console.error('Get student notices error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;