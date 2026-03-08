const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ImportantLink = require('../models/ImportantLink');
const Course = require('../models/Course');
const User = require('../models/User'); // ✅ Use User model like assignments
const auth = require('../middleware/auth');

// @route   GET /api/important-links
// @desc    Get all important links (Admin)
// @access  Private (Admin/Instructor)
router.get('/', auth, async (req, res) => {
  try {
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

// @route   GET /api/important-links/student/my-links
// @desc    Get important links for student's enrolled courses
// @access  Private (Student)
router.get('/student/my-links', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('Fetching links for student:', studentId);

    // ✅ FIXED: Use User model with enrolledCourses array (like assignment system)
    const user = await User.findById(studentId).select('enrolledCourses email');
    
    console.log('User found:', user ? 'YES' : 'NO');
    console.log('User enrolledCourses:', user?.enrolledCourses);
    console.log('User email:', user?.email);

    if (!user || !user.enrolledCourses || user.enrolledCourses.length === 0) {
      console.log('No enrolled courses found in User model');
      
      // Fallback: Try to find user by email in LiveEnrollment
      const liveEnrollments = await LiveEnrollment.find({
        email: user?.email || req.user.email,
        status: 'active'
      }).select('course');

      console.log('LiveEnrollment fallback:', liveEnrollments.length);

      if (liveEnrollments.length > 0) {
        // Get course names and find their ObjectIds
        const courseNames = liveEnrollments.map(e => e.course);
        const courses = await Course.find({
          title: { $in: courseNames }
        }).select('_id');
        
        const enrolledCourseIds = courses.map(c => c._id.toString());
        console.log('Courses from LiveEnrollment:', enrolledCourseIds);

        // Get links for these courses
        const links = await ImportantLink.find({
          course: { $in: enrolledCourseIds },
          isActive: true
        })
          .populate('course', 'name code description')
          .sort({ category: 1, createdAt: -1 });

        return res.json({
          success: true,
          count: links.length,
          data: links,
          source: 'liveenrollment'
        });
      }

      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No enrolled courses found'
      });
    }

    // Use enrolledCourses from User model (like assignment system)
    const enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
    console.log('Enrolled course IDs from User:', enrolledCourseIds);

    // Get links for enrolled courses
    const links = await ImportantLink.find({
      course: { $in: enrolledCourseIds },
      isActive: true
    })
      .populate('course', 'name code description')
      .sort({ category: 1, createdAt: -1 });

    console.log('Found links for student:', links.length);

    res.json({
      success: true,
      count: links.length,
      data: links,
      source: 'user.enrolledCourses'
    });
  } catch (error) {
    console.error('Error fetching student links:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching links',
      error: error.message
    });
  }
});

// @route   GET /api/important-links/course/:courseId
// @desc    Get links for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    // Check if user is enrolled or is admin/instructor
    const isAdmin = req.user.role === 'admin' || req.user.role === 'instructor';
    
    if (!isAdmin) {
      // Check enrollment in User.enrolledCourses (like assignment system)
      const user = await User.findById(req.user.id).select('enrolledCourses');
      
      const isEnrolled = user?.enrolledCourses?.some(id => id.toString() === courseId);
      
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Not enrolled in this course.'
        });
      }
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/important-links
// @desc    Create new important link
// @access  Private (Admin/Instructor)
router.post('/', auth, async (req, res) => {
  try {
    const { title, url, description, course, category } = req.body;

    // Validation
    if (!title || !url || !course) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, URL and course'
      });
    }

    // Validate course exists
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create link
    const newLink = new ImportantLink({
      title: title.trim(),
      url: url.trim(),
      description: description ? description.trim() : '',
      course,
      category: category || 'Study Material',
      createdBy: req.user.id
    });

    await newLink.save();

    // Populate and return
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
    res.status(500).json({
      success: false,
      message: 'Server error while creating link',
      error: error.message
    });
  }
});

// @route   PUT /api/important-links/:id
// @desc    Update important link
// @access  Private (Admin/Instructor)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description, course, category } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link ID'
      });
    }

    const link = await ImportantLink.findById(id);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Update fields
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
    res.status(500).json({
      success: false,
      message: 'Server error while updating link',
      error: error.message
    });
  }
});

// @route   DELETE /api/important-links/:id
// @desc    Soft delete important link
// @access  Private (Admin/Instructor)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link ID'
      });
    }

    const link = await ImportantLink.findById(id);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Soft delete
    link.isActive = false;
    await link.save();

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting link',
      error: error.message
    });
  }
});

module.exports = router;