const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ============================================
// ADMIN ROUTES
// ============================================

// 🔥 NEW: Get all courses for Admin Dropdown
// @route   GET /api/notices/courses
router.get('/courses', auth, async (req, res) => {
  try {
    console.log('📡 /api/notices/courses called by:', req.user.id, 'Role:', req.user.role);
    
    // Check if admin/instructor
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // ✅ FIXED: isHide: false matlab course active hai (tumhare model mein isActive nahi hai)
    const courses = await Course.find({ isHide: false })
      .select('_id title code name instructor category')
      .sort({ title: 1 });

    console.log('✅ Found courses:', courses.length);
    console.log('📊 First 3 courses:', courses.slice(0, 3));

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
    
  } catch (error) {
    console.error('❌ Error fetching courses for notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: error.message
    });
  }
});

// @route   GET /api/notices
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const notices = await Notice.find({ isActive: true })
      .populate('course', 'name code title')
      .populate('targetCourses', 'name code title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices',
      error: error.message
    });
  }
});

// @route   POST /api/notices
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, type, course, targetCourses, audience, priority, expiryDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const noticeData = {
      title: title.trim(),
      content: content.trim(),
      type: type || 'General',
      audience: audience || 'all',
      priority: priority || 0,
      createdBy: req.user.id
    };

    // Handle course assignment
    if (course && course !== 'all' && mongoose.Types.ObjectId.isValid(course)) {
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: 'Selected course not found'
        });
      }
      noticeData.course = course;
    }

    // Handle multiple target courses
    if (targetCourses && Array.isArray(targetCourses) && targetCourses.length > 0) {
      const validCourseIds = targetCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validCourseIds.length > 0) {
        const existingCourses = await Course.find({ 
          _id: { $in: validCourseIds }
        }).select('_id');
        
        noticeData.targetCourses = existingCourses.map(c => c._id);
      }
    }

    if (expiryDate) {
      noticeData.expiryDate = new Date(expiryDate);
    }

    const newNotice = new Notice(noticeData);
    await newNotice.save();

    const populatedNotice = await Notice.findById(newNotice._id)
      .populate('course', 'name code title')
      .populate('targetCourses', 'name code title')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: populatedNotice
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notice',
      error: error.message
    });
  }
});

// @route   PUT /api/notices/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, course, targetCourses, audience, priority, expiryDate, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID'
      });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (title) notice.title = title.trim();
    if (content) notice.content = content.trim();
    if (type) notice.type = type;
    if (audience) notice.audience = audience;
    if (priority !== undefined) notice.priority = priority;
    if (isActive !== undefined) notice.isActive = isActive;

    if (course === 'all' || course === null) {
      notice.course = null;
    } else if (course && mongoose.Types.ObjectId.isValid(course)) {
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: 'Selected course not found'
        });
      }
      notice.course = course;
    }

    if (targetCourses !== undefined) {
      if (Array.isArray(targetCourses) && targetCourses.length > 0) {
        const validCourseIds = targetCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
        const existingCourses = await Course.find({ 
          _id: { $in: validCourseIds }
        }).select('_id');
        notice.targetCourses = existingCourses.map(c => c._id);
      } else {
        notice.targetCourses = [];
      }
    }

    if (expiryDate) {
      notice.expiryDate = new Date(expiryDate);
    } else if (expiryDate === null) {
      notice.expiryDate = null;
    }

    await notice.save();

    const updatedNotice = await Notice.findById(id)
      .populate('course', 'name code title')
      .populate('targetCourses', 'name code title')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notice',
      error: error.message
    });
  }
});

// @route   DELETE /api/notices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID'
      });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    notice.isActive = false;
    await notice.save();

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notice',
      error: error.message
    });
  }
});

// ============================================
// STUDENT ROUTES
// ============================================

// @route   GET /api/notices/student/my-notices
router.get('/student/my-notices', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('Fetching notices for student:', studentId);

    const user = await User.findById(studentId).select('enrolledCourses email');
    
    console.log('User found:', user ? 'YES' : 'NO');
    console.log('User enrolledCourses:', user?.enrolledCourses);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrolledCourseIds = user.enrolledCourses?.map(id => id.toString()) || [];
    console.log('Enrolled course IDs:', enrolledCourseIds);

    let query = {
      isActive: true,
      $or: [
        { course: null, targetCourses: { $size: 0 } }
      ]
    };

    if (enrolledCourseIds.length > 0) {
      query.$or.push(
        { course: { $in: enrolledCourseIds } },
        { targetCourses: { $in: enrolledCourseIds } }
      );
    }

    const finalQuery = {
      ...query,
      $or: query.$or.map(condition => ({
        ...condition,
        $or: [
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } }
        ]
      }))
    };

    const notices = await Notice.find(finalQuery)
      .populate('course', 'name code title')
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    console.log('Found notices for student:', notices.length);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = notices.filter(n => new Date(n.createdAt) > yesterday).length;

    const noticesWithReadStatus = notices.map(notice => ({
      ...notice.toObject(),
      isRead: notice.readBy?.some(r => r.user.toString() === studentId)
    }));

    res.json({
      success: true,
      count: notices.length,
      newCount: newCount,
      data: noticesWithReadStatus
    });
  } catch (error) {
    console.error('Error fetching student notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices',
      error: error.message
    });
  }
});

// @route   PUT /api/notices/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID'
      });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const alreadyRead = notice.readBy?.some(r => r.user.toString() === userId);
    
    if (!alreadyRead) {
      notice.readBy.push({ user: userId, readAt: new Date() });
      await notice.save();
    }

    res.json({
      success: true,
      message: 'Marked as read'
    });
  } catch (error) {
    console.error('Error marking notice as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;