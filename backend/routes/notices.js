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

// Get all courses for Admin Dropdown
router.get('/courses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const courses = await Course.find({ isHide: false })
      .select('_id title code name instructor category')
      .sort({ title: 1 });

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all notices (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const notices = await Notice.find({ isActive: true })
      .populate('course', 'name code title')
      .populate('targetCourses', 'name code title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create notice (Admin)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, type, course, targetCourses, audience, priority, expiryDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const noticeData = {
      title: title.trim(),
      content: content.trim(),
      type: type || 'General',
      audience: audience || 'all',
      priority: priority || 0,
      createdBy: req.user.id,
      isActive: true
    };

    // Handle course assignment
    if (course && course !== 'all' && mongoose.Types.ObjectId.isValid(course)) {
      noticeData.course = course;
    }

    // Handle multiple target courses
    if (targetCourses && Array.isArray(targetCourses) && targetCourses.length > 0) {
      const validCourseIds = targetCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validCourseIds.length > 0) {
        noticeData.targetCourses = validCourseIds;
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

    res.status(201).json({ success: true, message: 'Notice created', data: populatedNotice });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update notice
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, course, targetCourses, audience, priority, expiryDate, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
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
      notice.course = course;
    }

    if (targetCourses !== undefined) {
      if (Array.isArray(targetCourses) && targetCourses.length > 0) {
        notice.targetCourses = targetCourses.filter(id => mongoose.Types.ObjectId.isValid(id));
      } else {
        notice.targetCourses = [];
      }
    }

    if (expiryDate) {
      notice.expiryDate = new Date(expiryDate);
    }

    await notice.save();

    const updatedNotice = await Notice.findById(id)
      .populate('course', 'name code title')
      .populate('targetCourses', 'name code title')
      .populate('createdBy', 'name email');

    res.json({ success: true, message: 'Notice updated', data: updatedNotice });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete notice (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    notice.isActive = false;
    await notice.save();

    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// 🔥 STUDENT ROUTES (FIXED - 3 SOURCES LIKE ASSIGNMENT/QUIZ)
// ============================================

// Get student's notices based on enrolled courses
router.get('/student/my-notices', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    console.log('🔍 Notice fetch for user:', userId);
    
    // 🔥🔥🔥 CRITICAL FIX: Get enrolled courses from 3 sources 🔥🔥🔥
    let enrolledCourseIds = [];
    
    // Source 1: User model (enrolledCourses)
    const user = await User.findById(userId).select('enrolledCourses');
    if (user && user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
      enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
      console.log('✅ Source 1 - User.enrolledCourses:', enrolledCourseIds.length);
    }
    
    // Source 2: LiveEnrollment (status: active)
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
      console.log('✅ Source 2 - LiveEnrollment:', liveEnrollments.length);
    } catch (e) {
      console.log('⚠️ LiveEnrollment fetch error:', e.message);
    }
    
    // Source 3: Course.enrolledStudentIds (backup)
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
      console.log('✅ Source 3 - Course.enrolledStudentIds:', coursesWithStudent.length);
    } catch (e) {
      console.log('⚠️ Course fetch error:', e.message);
    }

    // Remove duplicates
    enrolledCourseIds = [...new Set(enrolledCourseIds)];
    
    console.log('🔥 FINAL enrolledCourseIds for notices:', enrolledCourseIds);

    // Build query
    let query = { isActive: true };
    
    let courseConditions = [
      { course: null, targetCourses: { $size: 0 } } // General notices
    ];

    if (enrolledCourseIds.length > 0) {
      courseConditions.push(
        { course: { $in: enrolledCourseIds } },
        { targetCourses: { $in: enrolledCourseIds } }
      );
    }

    query.$or = courseConditions;

    console.log('📋 Query:', JSON.stringify(query, null, 2));

    let notices = await Notice.find(query)
      .populate('course', 'name code title')
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    // Filter expiry date
    const now = new Date();
    notices = notices.filter(notice => {
      if (!notice.expiryDate) return true;
      return new Date(notice.expiryDate) > now;
    });

    console.log(`📚 Found ${notices.length} notices for user`);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = notices.filter(n => new Date(n.createdAt) > yesterday).length;

    const noticesWithReadStatus = notices.map(notice => ({
      ...notice.toObject(),
      isRead: notice.readBy?.some(r => r.user.toString() === userId) || false
    }));

    res.json({
      success: true,
      count: notices.length,
      newCount: newCount,
      data: noticesWithReadStatus
    });
    
  } catch (error) {
    console.error('❌ Error fetching student notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices',
      error: error.message
    });
  }
});

// Mark notice as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const alreadyRead = notice.readBy?.some(r => r.user.toString() === userId);
    
    if (!alreadyRead) {
      notice.readBy.push({ user: userId, readAt: new Date() });
      await notice.save();
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;