const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ImportantLink = require('../models/ImportantLink');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ============================================
// ADMIN ROUTES
// ============================================

// Get all important links (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const links = await ImportantLink.find({ isActive: true })
      .populate('course', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: links.length,
      data: links
    });
  } catch (error) {
    console.error('Error fetching important links:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching links',
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

// Create important link (Admin)
router.post('/', auth, async (req, res) => {
  try {
    const { title, url, description, course, category } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!title || !url || !course) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, URL and course'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const newLink = new ImportantLink({
      title: title.trim(),
      url: url.trim(),
      description: description ? description.trim() : '',
      course,
      category: category || 'Study Material',
      createdBy: req.user.id,
      isActive: true
    });

    await newLink.save();

    const populatedLink = await ImportantLink.findById(newLink._id)
      .populate('course', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      data: populatedLink
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update important link
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description, course, category } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid link ID' });
    }

    const link = await ImportantLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    link.title = title ? title.trim() : link.title;
    link.url = url ? url.trim() : link.url;
    link.description = description !== undefined ? description.trim() : link.description;
    link.category = category || link.category;
    
    if (course && mongoose.Types.ObjectId.isValid(course)) {
      link.course = course;
    }

    await link.save();

    const updatedLink = await ImportantLink.findById(id)
      .populate('course', 'name code')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Link updated successfully',
      data: updatedLink
    });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete important link (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid link ID' });
    }

    const link = await ImportantLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    link.isActive = false;
    await link.save();

    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// 🔥 STUDENT ROUTES (FIXED - 3 SOURCES LIKE ASSIGNMENT/QUIZ)
// ============================================

// Get important links for student's enrolled courses
router.get('/student/my-links', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    console.log('🔍 Important Links fetch for user:', userId);
    
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
    
    console.log('🔥 FINAL enrolledCourseIds for important links:', enrolledCourseIds);

    if (enrolledCourseIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    // Convert to ObjectIds
    const objectIds = enrolledCourseIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No valid course IDs found'
      });
    }

    // Get links for enrolled courses
    const links = await ImportantLink.find({
      course: { $in: objectIds },
      isActive: true
    })
      .populate('course', 'name code description')
      .sort({ category: 1, createdAt: -1 });

    console.log(`📚 Found ${links.length} important links for user`);

    res.json({
      success: true,
      count: links.length,
      data: links
    });
    
  } catch (error) {
    console.error('❌ Error fetching student links:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching links',
      error: error.message
    });
  }
});

// Get links for a specific course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    // Check if user is enrolled (using 3 sources)
    let isEnrolled = false;
    
    // Source 1: User.enrolledCourses
    const user = await User.findById(userId).select('enrolledCourses');
    if (user && user.enrolledCourses) {
      isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);
    }
    
    // Source 2: LiveEnrollment
    if (!isEnrolled) {
      try {
        const LiveEnrollment = require('../models/LiveEnrollment');
        const liveEnrollment = await LiveEnrollment.findOne({
          userId: userId,
          courseId: courseId,
          status: 'active'
        });
        isEnrolled = !!liveEnrollment;
      } catch (e) {}
    }
    
    // Source 3: Course.enrolledStudentIds
    if (!isEnrolled) {
      const course = await Course.findOne({
        _id: courseId,
        enrolledStudentIds: userId
      });
      isEnrolled = !!course;
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'instructor';
    
    if (!isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not enrolled in this course.'
      });
    }

    const links = await ImportantLink.find({
      course: courseId,
      isActive: true
    }).sort({ category: 1, createdAt: -1 });

    res.json({
      success: true,
      count: links.length,
      data: links
    });
  } catch (error) {
    console.error('Error fetching course links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;