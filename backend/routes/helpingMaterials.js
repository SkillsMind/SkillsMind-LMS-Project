const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const HelpingMaterial = require('../models/HelpingMaterial');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ============================================
// ADMIN / INSTRUCTOR ROUTES
// ============================================

// Get all helping materials
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { courseId, fileType, search } = req.query;
    let query = { isActive: true };

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      query.course = courseId;
    }
    if (fileType) {
      query.fileType = fileType;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { lectureTopic: { $regex: search, $options: 'i' } }
      ];
    }

    const materials = await HelpingMaterial.find(query)
      .populate('course', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get courses for dropdown
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
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const totalMaterials = await HelpingMaterial.countDocuments({ isActive: true });
    const pdfCount = await HelpingMaterial.countDocuments({ isActive: true, fileType: 'pdf' });
    const docCount = await HelpingMaterial.countDocuments({ isActive: true, fileType: { $in: ['doc', 'docx'] } });
    
    res.json({ success: true, data: { total: totalMaterials, pdf: pdfCount, documents: docCount, recent: [] } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create helping material
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, fileUrl, fileName, fileType, course, lectureTopic, weekNumber, fileSize } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!title || !fileUrl || !course) {
      return res.status(400).json({ success: false, message: 'Please provide title, file URL and course' });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const newMaterial = new HelpingMaterial({
      title: title.trim(),
      description: description ? description.trim() : '',
      fileUrl: fileUrl.trim(),
      fileName: fileName ? fileName.trim() : title.trim(),
      fileType: fileType || 'pdf',
      course,
      lectureTopic: lectureTopic ? lectureTopic.trim() : '',
      weekNumber: weekNumber || null,
      fileSize: fileSize || '',
      createdBy: req.user.id,
      isActive: true,
      downloadCount: 0,
      viewCount: 0
    });

    await newMaterial.save();

    const populatedMaterial = await HelpingMaterial.findById(newMaterial._id)
      .populate('course', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Helping material created successfully', data: populatedMaterial });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update helping material
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, fileUrl, fileName, fileType, course, lectureTopic, weekNumber, fileSize } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid material ID' });
    }

    const material = await HelpingMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    material.title = title ? title.trim() : material.title;
    material.description = description !== undefined ? description.trim() : material.description;
    material.fileUrl = fileUrl ? fileUrl.trim() : material.fileUrl;
    material.fileName = fileName ? fileName.trim() : material.fileName;
    material.fileType = fileType || material.fileType;
    material.lectureTopic = lectureTopic !== undefined ? lectureTopic.trim() : material.lectureTopic;
    material.weekNumber = weekNumber !== undefined ? weekNumber : material.weekNumber;
    material.fileSize = fileSize !== undefined ? fileSize : material.fileSize;
    
    if (course && mongoose.Types.ObjectId.isValid(course)) {
      material.course = course;
    }

    await material.save();

    const updatedMaterial = await HelpingMaterial.findById(id)
      .populate('course', 'name code')
      .populate('createdBy', 'name email');

    res.json({ success: true, message: 'Material updated successfully', data: updatedMaterial });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid material ID' });
    }

    const material = await HelpingMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    material.isActive = false;
    await material.save();

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Track download
router.post('/:id/track-download', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const material = await HelpingMaterial.findById(id);
    if (material) {
      material.downloadCount += 1;
      await material.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Track view
router.post('/:id/track-view', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const material = await HelpingMaterial.findById(id);
    if (material) {
      material.viewCount += 1;
      await material.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// 🔥 DOWNLOAD ROUTE - Google Drive Redirect
// ============================================

router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token, authorization denied' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.user?.id || decoded.id;
    const userRole = decoded.user?.role || decoded.role;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid material ID' });
    }
    
    const material = await HelpingMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    // Check access
    let hasAccess = false;
    
    if (userRole === 'admin' || userRole === 'instructor') {
      hasAccess = true;
    } else {
      const user = await User.findById(userId).select('enrolledCourses');
      if (user && user.enrolledCourses) {
        hasAccess = user.enrolledCourses.some(cid => cid.toString() === material.course.toString());
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update download count
    material.downloadCount += 1;
    await material.save();
    
    let fileUrl = material.fileUrl;
    
    // Convert Google Drive link to direct download if needed
    if (fileUrl && fileUrl.includes('drive.google.com')) {
      let fileId = '';
      const match = fileUrl.match(/\/d\/([^\/]+)/);
      if (match) {
        fileId = match[1];
        fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    
    console.log('🚀 Redirecting to:', fileUrl);
    
    // Redirect to file URL
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ success: false, message: 'Download failed: ' + error.message });
  }
});

// ============================================
// STUDENT ROUTES
// ============================================

router.get('/student/my-materials', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    let enrolledCourseIds = [];
    
    const user = await User.findById(userId).select('enrolledCourses');
    if (user && user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
      enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
    }
    
    try {
      const LiveEnrollment = require('../models/LiveEnrollment');
      const liveEnrollments = await LiveEnrollment.find({ userId: userId, status: 'active' }).select('courseId');
      liveEnrollments.forEach(enrollment => {
        if (enrollment.courseId) {
          const courseIdStr = enrollment.courseId.toString();
          if (!enrolledCourseIds.includes(courseIdStr)) enrolledCourseIds.push(courseIdStr);
        }
      });
    } catch (e) {}
    
    try {
      const coursesWithStudent = await Course.find({ enrolledStudentIds: userId }).select('_id');
      coursesWithStudent.forEach(course => {
        const courseIdStr = course._id.toString();
        if (!enrolledCourseIds.includes(courseIdStr)) enrolledCourseIds.push(courseIdStr);
      });
    } catch (e) {}

    enrolledCourseIds = [...new Set(enrolledCourseIds)];

    if (enrolledCourseIds.length === 0) {
      return res.json({ success: true, count: 0, data: [], message: 'No enrolled courses found' });
    }

    const objectIds = enrolledCourseIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));

    const materials = await HelpingMaterial.find({ course: { $in: objectIds }, isActive: true })
      .populate('course', 'name code description')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    let isEnrolled = false;
    
    const user = await User.findById(userId).select('enrolledCourses');
    if (user && user.enrolledCourses) {
      isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);
    }
    
    if (!isEnrolled) {
      try {
        const LiveEnrollment = require('../models/LiveEnrollment');
        const liveEnrollment = await LiveEnrollment.findOne({ userId: userId, courseId: courseId, status: 'active' });
        isEnrolled = !!liveEnrollment;
      } catch (e) {}
    }
    
    if (!isEnrolled) {
      const course = await Course.findOne({ _id: courseId, enrolledStudentIds: userId });
      isEnrolled = !!course;
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'instructor';
    
    if (!isEnrolled && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Not enrolled in this course.' });
    }

    const materials = await HelpingMaterial.find({ course: courseId, isActive: true }).sort({ createdAt: -1 });

    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;