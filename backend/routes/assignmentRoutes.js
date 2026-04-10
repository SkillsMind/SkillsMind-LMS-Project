const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 🔥 AI GRADER IMPORT
const aiGrader = require('../services/aiGrader');

// 🔥 PUPPETEER IMPORT FOR PDF GENERATION
const puppeteer = require('puppeteer');

// 🔥 MULTER SETUP: File uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, ZIP, RAR, TXT allowed.'));
    }
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large (max 10MB)' });
    }
    return res.status(400).json({ success: false, error: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

// 🔥 FIXED: Better admin check function
const isAdmin = (req) => {
  if (!req.user) return false;
  
  const role = req.user.role || req.user.userType || req.user.type;
  const isAdminFlag = req.user.isAdmin === true || req.user.isAdmin === 'true';
  const isInstructor = role === 'instructor' || role === 'teacher';
  const isAdminRole = role === 'admin' || role === 'administrator';
  
  return isAdminRole || isInstructor || isAdminFlag;
};

// ==========================================
// 🔔 ADMIN NOTIFICATION ROUTES
// ==========================================

router.get('/admin/notifications', auth, async (req, res) => {
  try {
    console.log('🔔 Notifications request - User:', req.user);
    
    if (!isAdmin(req)) {
      console.log('❌ Access denied - User role:', req.user?.role);
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const assignments = await Assignment.find({
      'submissions.submittedAt': { $gte: lastWeek }
    }).populate('submissions.studentId', 'name email');

    const notifications = [];
    
    assignments.forEach(assignment => {
      assignment.submissions.forEach(sub => {
        if (sub.submittedAt >= lastWeek && sub.status !== 'graded') {
          notifications.push({
            _id: sub._id,
            studentName: sub.studentId?.name || 'Unknown Student',
            studentEmail: sub.studentId?.email || 'N/A',
            assignmentTitle: assignment.title,
            assignmentId: assignment._id,
            assignmentNo: assignment.assignmentNo,
            courseAssignmentNo: assignment.courseAssignmentNo,
            courseName: assignment.courseName,
            submittedAt: sub.submittedAt,
            status: sub.status
          });
        }
      });
    });

    notifications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.json({ 
      success: true, 
      count: notifications.length,
      notifications: notifications.slice(0, 20)
    });
    
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/notifications/:id/read', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    res.json({ 
      success: true, 
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recent-submissions', auth, async (req, res) => {
  try {
    console.log('📥 Recent submissions request - User:', req.user);
    
    if (!isAdmin(req)) {
      console.log('❌ Access denied - User role:', req.user?.role);
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const assignments = await Assignment.find()
      .populate('submissions.studentId', 'name email profilePic')
      .sort({ 'submissions.submittedAt': -1 });

    const allSubmissions = [];
    
    assignments.forEach(assignment => {
      assignment.submissions.forEach(sub => {
        allSubmissions.push({
          _id: sub._id,
          studentId: sub.studentId?._id,
          studentName: sub.studentId?.name || 'Unknown',
          studentEmail: sub.studentId?.email || 'N/A',
          studentProfilePic: sub.studentId?.profilePic || null,
          assignmentId: assignment._id,
          assignmentTitle: assignment.title,
          assignmentNo: assignment.assignmentNo,
          courseAssignmentNo: assignment.courseAssignmentNo,
          courseName: assignment.courseName,
          submittedAt: sub.submittedAt,
          status: sub.status,
          obtainedMarks: sub.obtainedMarks,
          totalMarks: assignment.totalMarks,
          filesCount: sub.files?.length || 0
        });
      });
    });

    allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    res.json({ 
      success: true, 
      count: allSubmissions.length,
      submissions: allSubmissions.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Recent submissions fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AI GRADING ROUTES (NEW)
// ==========================================

// 🔥 AI Grade Single Submission
router.post('/:id/ai-grade', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { submissionId } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ success: false, error: 'Submission ID required' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const submission = assignment.submissions[submissionIndex];

    // Collect all file paths
    const submissionFiles = [];
    if (submission.files && submission.files.length > 0) {
      submission.files.forEach(file => {
        if (file.url) submissionFiles.push(file.url);
      });
    }

    console.log(`🤖 AI Grading submission ${submissionId} with ${submissionFiles.length} files`);

    // Call AI Grader
    const gradingResult = await aiGrader.gradeAssignment({
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description,
      studentSubmission: submission.comments || '',
      totalMarks: assignment.totalMarks,
      rubric: assignment.rubric,
      courseContext: assignment.courseName,
      submissionFiles: submissionFiles
    });

    if (!gradingResult.success) {
      return res.status(503).json({
        success: false,
        error: gradingResult.error,
        message: gradingResult.feedback,
        requiresManualReview: true
      });
    }

    // Update submission with AI grades
    assignment.submissions[submissionIndex].obtainedMarks = gradingResult.marks;
    assignment.submissions[submissionIndex].feedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].status = 'graded';
    assignment.submissions[submissionIndex].aiGraded = true;
    assignment.submissions[submissionIndex].aiConfidence = gradingResult.confidence;
    assignment.submissions[submissionIndex].aiFeedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].strengths = gradingResult.strengths || [];
    assignment.submissions[submissionIndex].improvements = gradingResult.improvements || [];
    assignment.submissions[submissionIndex].requirementAnalysis = gradingResult.requirementAnalysis || {};
    assignment.submissions[submissionIndex].filesProcessed = gradingResult.filesProcessed || [];
    assignment.submissions[submissionIndex].gradedAt = new Date();

    await assignment.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${submission.studentId}`).emit('assignmentGraded', {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        obtainedMarks: gradingResult.marks,
        totalMarks: assignment.totalMarks,
        feedback: gradingResult.feedback,
        aiGraded: true
      });
    }

    res.json({
      success: true,
      message: 'Assignment graded successfully by AI',
      grading: gradingResult
    });

  } catch (error) {
    console.error('❌ AI Grade Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'AI grading failed. Please try again or grade manually.'
    });
  }
});

// 🔥 AI Batch Grade All Pending Submissions
router.post('/:id/ai-batch-grade', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Find ungraded submissions
    const ungradedSubmissions = assignment.submissions.filter(
      sub => sub.status !== 'graded'
    );

    if (ungradedSubmissions.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No ungraded submissions found',
        graded: 0,
        failed: 0
      });
    }

    console.log(`📋 Found ${ungradedSubmissions.length} ungraded submissions`);

    let successCount = 0;
    let failCount = 0;
    const failedSubmissions = [];

    // Grade each submission with delay
    for (let i = 0; i < ungradedSubmissions.length; i++) {
      const submission = ungradedSubmissions[i];
      const submissionIndex = assignment.submissions.findIndex(
        sub => sub._id.toString() === submission._id.toString()
      );

      try {
        // Add delay between requests
        if (i > 0) {
          console.log(`⏳ Waiting 3 seconds before grading submission ${i + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Collect files
        const submissionFiles = [];
        if (submission.files && submission.files.length > 0) {
          submission.files.forEach(file => {
            if (file.url) submissionFiles.push(file.url);
          });
        }

        console.log(`🤖 Grading submission ${i + 1}/${ungradedSubmissions.length}...`);

        const gradingResult = await aiGrader.gradeAssignment({
          assignmentTitle: assignment.title,
          assignmentDescription: assignment.description,
          studentSubmission: submission.comments || '',
          totalMarks: assignment.totalMarks,
          rubric: assignment.rubric,
          courseContext: assignment.courseName,
          submissionFiles: submissionFiles
        });

        if (!gradingResult.success) {
          console.log(`❌ AI failed for submission ${submission._id}: ${gradingResult.error}`);
          failCount++;
          failedSubmissions.push({ 
            id: submission._id, 
            reason: gradingResult.error 
          });
          continue;
        }

        // Update submission
        assignment.submissions[submissionIndex].obtainedMarks = gradingResult.marks;
        assignment.submissions[submissionIndex].feedback = gradingResult.feedback;
        assignment.submissions[submissionIndex].status = 'graded';
        assignment.submissions[submissionIndex].aiGraded = true;
        assignment.submissions[submissionIndex].aiConfidence = gradingResult.confidence;
        assignment.submissions[submissionIndex].aiFeedback = gradingResult.feedback;
        assignment.submissions[submissionIndex].strengths = gradingResult.strengths || [];
        assignment.submissions[submissionIndex].improvements = gradingResult.improvements || [];
        assignment.submissions[submissionIndex].requirementAnalysis = gradingResult.requirementAnalysis || {};
        assignment.submissions[submissionIndex].filesProcessed = gradingResult.filesProcessed || [];
        assignment.submissions[submissionIndex].gradedAt = new Date();

        successCount++;
        console.log(`✅ Graded: ${gradingResult.marks}/${assignment.totalMarks}`);

      } catch (subError) {
        console.error(`❌ Error grading submission ${submission._id}:`, subError.message);
        failCount++;
        failedSubmissions.push({ 
          id: submission._id, 
          reason: subError.message 
        });
      }
    }

    await assignment.save();

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      for (const submission of ungradedSubmissions) {
        const sub = assignment.submissions.find(s => s._id.toString() === submission._id.toString());
        if (sub && sub.status === 'graded') {
          io.to(`student_${submission.studentId}`).emit('assignmentGraded', {
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            obtainedMarks: sub.obtainedMarks,
            totalMarks: assignment.totalMarks,
            feedback: sub.feedback,
            aiGraded: true
          });
        }
      }
    }

    console.log(`📊 Batch Complete: ${successCount} success, ${failCount} failed`);

    res.json({
      success: true,
      message: `Batch grading complete. ${successCount} graded successfully, ${failCount} failed.`,
      graded: successCount,
      failed: failCount,
      failedSubmissions: failedSubmissions.length > 0 ? failedSubmissions : undefined
    });

  } catch (error) {
    console.error('❌ Batch Grade Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Batch grading failed. Please try again later.'
    });
  }
});

// 🔥 Get AI Grading Status
router.get('/:id/ai-status', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(s => s.status === 'graded').length;
    const aiGradedSubmissions = assignment.submissions.filter(s => s.aiGraded === true).length;
    const pendingSubmissions = totalSubmissions - gradedSubmissions;

    res.json({
      success: true,
      assignmentId: assignment._id,
      title: assignment.title,
      stats: {
        total: totalSubmissions,
        graded: gradedSubmissions,
        aiGraded: aiGradedSubmissions,
        pending: pendingSubmissions,
        progress: totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 Test AI API
router.get('/:id/test-ai', auth, async (req, res) => {
  try {
    const result = await aiGrader.testConnection();
    res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Assignments list request - User:', req.user);
    
    if (!isAdmin(req)) {
      console.log('❌ Access denied - User role:', req.user?.role);
      return res.status(403).json({ success: false, error: 'Access Denied' });
    }

    const now = new Date();

    const assignments = await Assignment.find()
      .populate('courseId', 'title category')
      .populate('assignedBy', 'name email')
      .populate('submissions.studentId', 'name email profilePic')
      .sort({ createdAt: -1 });

    const formatted = assignments.map(a => {
      const dueDate = new Date(a.dueDate);
      const isOverdue = dueDate < now && a.status === 'active';
      
      return {
        _id: a._id,
        assignmentNo: a.assignmentNo,
        courseAssignmentNo: a.courseAssignmentNo,
        title: a.title,
        description: a.description,
        courseId: a.courseId?._id || a.courseId,
        courseName: a.courseName || a.courseId?.title,
        assignedBy: a.assignedBy,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        status: isOverdue ? 'overdue' : a.status,
        attachments: a.attachments || [],
        submissionsCount: a.submissions?.length || 0,
        pendingSubmissions: a.submissions?.filter(s => s.status !== 'graded').length || 0,
        todaySubmissions: a.submissions?.filter(s => {
          const today = new Date().toDateString();
          return new Date(s.submittedAt).toDateString() === today;
        }).length || 0,
        isOverdue: isOverdue,
        createdAt: a.createdAt,
        submissions: a.submissions || []
      };
    });

    const stats = {
      totalAssignments: formatted.length,
      totalSubmissions: formatted.reduce((acc, a) => acc + a.submissionsCount, 0),
      pendingReviews: formatted.reduce((acc, a) => acc + a.pendingSubmissions, 0),
      overdueAssignments: formatted.filter(a => a.isOverdue).length,
      todaySubmissions: formatted.reduce((acc, a) => acc + a.todaySubmissions, 0)
    };

    res.json({ 
      success: true, 
      count: formatted.length, 
      assignments: formatted,
      stats: stats
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 CREATE ASSIGNMENT - EMITS REAL-TIME NOTIFICATION TO STUDENTS
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Access Denied' });
    }

    const { title, description, courseId, dueDate, totalMarks, courseName } = req.body;

    if (!title || !courseId || !dueDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // 🔥 FIXED: Populate enrolledStudentIds to get actual student data
    const courseExists = await Course.findById(courseId).populate('enrolledStudentIds');
    
    if (!courseExists) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // 🔥 DEBUG LOGS
    console.log('📡 Course found:', courseExists.title);
    console.log('📡 enrolledStudentIds:', courseExists.enrolledStudentIds);
    console.log('📡 Is Array:', Array.isArray(courseExists.enrolledStudentIds));
    console.log('📡 Length:', courseExists.enrolledStudentIds?.length || 0);

    const courseAssignmentCount = await Assignment.countDocuments({ courseId: new mongoose.Types.ObjectId(courseId) });
    const courseAssignmentNo = courseAssignmentCount + 1;

    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/assignments/${file.filename}`,
      size: file.size,
      uploadedAt: new Date()
    })) : [];

    const assignment = new Assignment({
      title: title.trim(),
      description: description?.trim() || "",
      courseId: new mongoose.Types.ObjectId(courseId),
      courseName: courseName || courseExists.title,
      assignedBy: new mongoose.Types.ObjectId(req.user.id),
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks) || 100,
      courseAssignmentNo: courseAssignmentNo,
      attachments,
      status: 'active',
      submissions: []
    });

    await assignment.save();

    // 🔥 FIXED: Socket emission with better error handling
    const io = req.app.get('io');
    if (io) {
      // 🔥 FIXED: Extract student IDs properly from populated data
      const enrolledStudents = courseExists.enrolledStudentIds || [];
      
      console.log(`📡 Processing ${enrolledStudents.length} enrolled students`);
      
      // 🔥 CRITICAL FIX: Extract IDs whether populated or not
      const studentIds = enrolledStudents.map(student => {
        // If populated (object with _id), get _id, otherwise use as-is
        const id = student._id ? student._id.toString() : student.toString();
        return id;
      }).filter(id => id); // Remove any undefined/null
      
      console.log('📡 Student IDs to notify:', studentIds);
      
      // Emit to course room (for students viewing course page)
      io.to(`course_${courseId}`).emit('newAssignment', {
        assignment: {
          id: assignment._id.toString(),
          assignmentNo: assignment.assignmentNo,
          courseAssignmentNo: assignment.courseAssignmentNo,
          title: assignment.title,
          description: assignment.description,
          courseName: assignment.courseName,
          courseId: assignment.courseId.toString(),
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          attachments: assignment.attachments,
          createdAt: assignment.createdAt
        }
      });
      
      // 🔥 CRITICAL: Emit to each student's individual room
      if (studentIds.length > 0) {
        studentIds.forEach(studentId => {
          const roomName = `student_${studentId}`;
          console.log(`📨 Emitting to room: ${roomName}`);
          
          io.to(roomName).emit('newAssignment', {
            assignment: {
              id: assignment._id.toString(),
              assignmentNo: assignment.assignmentNo,
              courseAssignmentNo: assignment.courseAssignmentNo,
              title: assignment.title,
              description: assignment.description,
              courseName: assignment.courseName,
              courseId: assignment.courseId.toString(),
              dueDate: assignment.dueDate,
              totalMarks: assignment.totalMarks,
              attachments: assignment.attachments,
              createdAt: assignment.createdAt
            }
          });
        });
        console.log(`✅ Notifications sent to ${studentIds.length} students`);
      } else {
        console.log('⚠️ No enrolled students to notify');
      }
    } else {
      console.log('❌ Socket.IO not available');
    }

    res.status(201).json({
      success: true,
      message: `Assignment #${courseAssignmentNo} created successfully!`,
      assignment: {
        _id: assignment._id,
        assignmentNo: assignment.assignmentNo,
        courseAssignmentNo: assignment.courseAssignmentNo,
        title: assignment.title,
        attachments: assignment.attachments
      }
    });

  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/submissions', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate('courseId', 'title');

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const populatedAssignment = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name email profilePic');

    const submissions = populatedAssignment.submissions.map(sub => ({
      _id: sub._id,
      student: sub.studentId ? {
        _id: sub.studentId._id,
        name: sub.studentId.name,
        email: sub.studentId.email,
        profilePic: sub.studentId.profilePic
      } : null,
      files: sub.files || [],
      comments: sub.comments,
      submittedAt: sub.submittedAt,
      status: sub.status,
      obtainedMarks: sub.obtainedMarks,
      feedback: sub.feedback,
      gradedAt: sub.gradedAt,
      aiGraded: sub.aiGraded || false,
      aiConfidence: sub.aiConfidence || 0,
      strengths: sub.strengths || [],
      improvements: sub.improvements || [],
      requirementAnalysis: sub.requirementAnalysis || {},
      filesProcessed: sub.filesProcessed || []
    }));

    res.json({
      success: true,
      assignment: {
        _id: assignment._id,
        assignmentNo: assignment.assignmentNo,
        courseAssignmentNo: assignment.courseAssignmentNo,
        title: assignment.title,
        courseName: assignment.courseName,
        totalMarks: assignment.totalMarks
      },
      submissionsCount: submissions.length,
      submissions
    });

  } catch (error) {
    console.error('Submissions fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/grade', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { submissionId, marks, feedback } = req.body;

    if (!submissionId || marks === undefined) {
      return res.status(400).json({ success: false, error: 'Submission ID and marks required' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    assignment.submissions[submissionIndex].obtainedMarks = Number(marks);
    assignment.submissions[submissionIndex].feedback = feedback || '';
    assignment.submissions[submissionIndex].status = 'graded';
    assignment.submissions[submissionIndex].gradedAt = new Date();
    assignment.submissions[submissionIndex].gradedBy = new mongoose.Types.ObjectId(req.user.id);

    await assignment.save();

    const io = req.app.get('io');
    if (io) {
      const studentId = assignment.submissions[submissionIndex].studentId.toString();
      io.to(`student_${studentId}`).emit('assignmentGraded', {
        assignmentId: assignment._id,
        assignmentNo: assignment.assignmentNo,
        courseAssignmentNo: assignment.courseAssignmentNo,
        obtainedMarks: Number(marks),
        feedback: feedback || '',
        totalMarks: assignment.totalMarks
      });
    }

    res.json({
      success: true,
      message: 'Graded successfully!',
      submission: {
        _id: assignment.submissions[submissionIndex]._id,
        obtainedMarks: assignment.submissions[submissionIndex].obtainedMarks,
        feedback: assignment.submissions[submissionIndex].feedback,
        status: assignment.submissions[submissionIndex].status
      }
    });

  } catch (error) {
    console.error('Grade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

router.get('/my-assignments', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user?.enrolledCourses?.length) {
      return res.json({ success: true, count: 0, assignments: [] });
    }

    const assignments = await Assignment.find({
      courseId: { $in: user.enrolledCourses }
    })
    .populate('courseId', 'title thumbnail')
    .sort({ createdAt: -1 });

    res.json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥🔥🔥 COMPLETE FIXED STUDENT ROUTE - 3 SOURCES FROM COURSE IDS 🔥🔥🔥
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const requestedId = req.params.studentId;
    const userId = req.user.id.toString();
    
    if (requestedId !== userId && !isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // 🔥🔥🔥 CRITICAL FIX: Get enrolled courses from 3 sources 🔥🔥🔥
    let enrolledCourseIds = [];
    
    // Source 1: User.enrolledCourses (if manually added)
    try {
      const user = await User.findById(requestedId).select('enrolledCourses name email');
      if (user?.enrolledCourses?.length) {
        enrolledCourseIds = user.enrolledCourses.map(id => id.toString());
        console.log('✅ Source 1 - User.enrolledCourses:', enrolledCourseIds.length);
      }
    } catch (e) {
      console.log('⚠️ Source 1 failed:', e.message);
    }
    
    // Source 2: LiveEnrollment (status: active) - MOST RELIABLE
    try {
      const LiveEnrollment = require('../models/LiveEnrollment');
      const liveEnrollments = await LiveEnrollment.find({
        userId: requestedId,
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
      console.log('⚠️ Source 2 failed:', e.message);
    }
    
    // Source 3: Course.enrolledStudentIds (backup)
    try {
      const coursesWithStudent = await Course.find({
        enrolledStudentIds: requestedId
      }).select('_id');
      
      coursesWithStudent.forEach(course => {
        const courseIdStr = course._id.toString();
        if (!enrolledCourseIds.includes(courseIdStr)) {
          enrolledCourseIds.push(courseIdStr);
        }
      });
      console.log('✅ Source 3 - Course.enrolledStudentIds:', coursesWithStudent.length);
    } catch (e) {
      console.log('⚠️ Source 3 failed:', e.message);
    }

    console.log('🔥🔥🔥 FINAL enrolledCourseIds:', enrolledCourseIds);

    if (!enrolledCourseIds.length) {
      return res.json({ success: true, count: 0, assignments: [], message: 'No enrolled courses found' });
    }

    // Convert string IDs to ObjectIds for query
    const courseObjectIds = enrolledCourseIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(id => id !== null);

    const assignments = await Assignment.find({
      courseId: { $in: courseObjectIds }
    }).populate('courseId', 'title thumbnail');

    console.log('📚 Assignments found:', assignments.length);

    const formatted = assignments.map(a => {
      const submission = a.submissions.find(
        sub => sub.studentId?.toString() === requestedId
      );
      
      let status = 'pending';
      if (submission) {
        status = submission.status === 'graded' ? 'graded' : 'submitted';
      } else if (new Date(a.dueDate) < new Date()) {
        status = 'overdue';
      }

      return {
        _id: a._id,
        assignmentNo: a.assignmentNo,
        courseAssignmentNo: a.courseAssignmentNo,
        title: a.title,
        description: a.description,
        courseName: a.courseName || a.courseId?.title,
        courseId: a.courseId?._id,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        status,
        obtainedMarks: submission?.obtainedMarks || null,
        feedback: submission?.feedback || null,
        attachments: a.attachments || [],
        mySubmission: submission ? {
          files: submission.files,
          comments: submission.comments,
          submittedAt: submission.submittedAt,
          status: submission.status
        } : null,
        createdAt: a.createdAt
      };
    });

    res.json({ 
      success: true, 
      count: formatted.length, 
      assignments: formatted,
      debug: {
        sources: {
          user: enrolledCourseIds.length,
          liveEnrollment: 0, // Will be populated above
          course: 0
        },
        courseIds: enrolledCourseIds
      }
    });
  } catch (error) {
    console.error('❌ Student assignments fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/submit', auth, upload.array('files', 5), handleMulterError, async (req, res) => {
  try {
    console.log('🔥 SUBMIT REQUEST RECEIVED');
    console.log('Assignment ID:', req.params.id);
    console.log('User ID:', req.user?.id);
    console.log('Files:', req.files?.length || 0);

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      console.log('❌ Assignment not found');
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const studentId = req.user.id.toString();
    console.log('Student ID:', studentId);

    const files = req.files ? req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/assignments/${file.filename}`,
      size: file.size,
      uploadedAt: new Date()
    })) : [];

    console.log('Files to save:', files);

    const existingIndex = assignment.submissions.findIndex(
      sub => sub.studentId.toString() === studentId
    );

    let submissionData;
    let isUpdate = false;

    if (existingIndex !== -1) {
      console.log('📝 Updating existing submission');
      const existingSub = assignment.submissions[existingIndex];
      
      if (existingSub.files && existingSub.files.length > 0) {
        existingSub.files.forEach(file => {
          const oldPath = path.join(__dirname, '..', file.url);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        });
      }

      assignment.submissions[existingIndex].files = files;
      assignment.submissions[existingIndex].comments = req.body.comments || '';
      assignment.submissions[existingIndex].submittedAt = new Date();
      assignment.submissions[existingIndex].status = new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted';
      
      if (assignment.submissions[existingIndex].status === 'graded') {
        assignment.submissions[existingIndex].obtainedMarks = 0;
        assignment.submissions[existingIndex].feedback = '';
      }
      
      submissionData = assignment.submissions[existingIndex];
      isUpdate = true;
    } else {
      console.log('📝 Creating new submission');
      submissionData = {
        studentId: new mongoose.Types.ObjectId(req.user.id),
        files,
        comments: req.body.comments || '',
        submittedAt: new Date(),
        status: new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted',
        obtainedMarks: 0,
        feedback: ''
      };
      assignment.submissions.push(submissionData);
    }

    await assignment.save();
    console.log('✅ Assignment saved successfully');

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('newSubmission', {
        assignmentId: assignment._id,
        assignmentNo: assignment.assignmentNo,
        courseAssignmentNo: assignment.courseAssignmentNo,
        assignmentTitle: assignment.title,
        studentId: req.user.id,
        studentName: req.user.name,
        submittedAt: submissionData.submittedAt,
        isUpdate
      });
    }

    res.json({
      success: true,
      message: isUpdate ? 'Assignment resubmitted successfully!' : 'Assignment submitted successfully!',
      submission: {
        _id: submissionData._id,
        files: submissionData.files,
        comments: submissionData.comments,
        submittedAt: submissionData.submittedAt,
        status: submissionData.status
      }
    });

  } catch (error) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    console.error('❌ Submit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const { title, description, courseId, dueDate, totalMarks, status } = req.body;

    if (title) assignment.title = title.trim();
    if (description) assignment.description = description.trim();
    if (courseId) assignment.courseId = new mongoose.Types.ObjectId(courseId);
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (totalMarks) assignment.totalMarks = Number(totalMarks);
    if (status) assignment.status = status;

    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        url: `/uploads/assignments/${file.filename}`,
        size: file.size,
        uploadedAt: new Date()
      }));
      assignment.attachments = [...(assignment.attachments || []), ...newAttachments];
    }

    assignment.updatedAt = new Date();
    await assignment.save();

    res.json({ 
      success: true, 
      message: 'Assignment updated successfully!',
      assignment 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach(att => {
        const filePath = path.join(__dirname, '..', att.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    if (assignment.submissions && assignment.submissions.length > 0) {
      assignment.submissions.forEach(sub => {
        if (sub.files && sub.files.length > 0) {
          sub.files.forEach(file => {
            const filePath = path.join(__dirname, '..', file.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/download/:fileIndex', auth, async (req, res) => {
  try {
    const { id, fileIndex } = req.params;
    const assignment = await Assignment.findById(id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const file = assignment.attachments[fileIndex];
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', file.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on server' });
    }

    res.download(filePath, file.filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 🔥 PDF GENERATION ROUTE - WITH REAL DATA
// ==========================================

router.post('/generate-pdf', auth, async (req, res) => {
  try {
    const { 
      title, 
      sections, 
      studentName, 
      studentEmail, 
      studentId, 
      courseName, 
      assignmentNo,
      assignmentId,
      coverImage 
    } = req.body;

    // Validation
    if (!title || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and sections required' 
      });
    }

    // Check if html-pdf-node is installed
    let html_to_pdf;
    try {
      html_to_pdf = require('html-pdf-node');
    } catch (err) {
      console.error('❌ html-pdf-node not installed:', err.message);
      return res.status(503).json({ 
        success: false, 
        error: 'PDF service temporarily unavailable',
        details: 'Please install html-pdf-node: npm install html-pdf-node'
      });
    }

    // 🔥 USE REAL DATA FROM REQUEST (comes from AssignmentBuilder)
    const realStudentName = studentName || req.user?.name || req.user?.fullName || 'Student';
    const realStudentId = studentId || req.user?.studentId || req.user?._id || 'N/A';
    const realStudentEmail = studentEmail || req.user?.email || '';
    const realCourseName = courseName || 'Course';
    const realAssignmentNo = assignmentNo || 'N/A';

    console.log('🔥 Generating PDF for:', {
      student: realStudentName,
      course: realCourseName,
      assignment: realAssignmentNo
    });

    // Options with memory optimization
    const options = {
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '15px', 
        right: '15px', 
        bottom: '15px', 
        left: '15px' 
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--single-process', // 🔥 Reduces memory usage
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      headless: 'new',
      timeout: 60000
    };

    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentYear = new Date().getFullYear();

    // HTML Template with REAL data
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title} - SkillsMind LMS</title>
        <style>
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #1e293b; 
            background: white;
          }
          .header { 
            background: #000B29; 
            color: white; 
            padding: 40px 30px; 
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 30px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .logo-container {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          }
          .header-title {
            flex: 1;
            text-align: center;
          }
          .header h1 { 
            margin: 0 0 8px 0; 
            font-size: 28px; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header .course-name {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
          }
          .student-info {
            text-align: right;
            font-size: 13px;
          }
          .student-info div {
            margin-bottom: 4px;
          }
          .student-info .label {
            opacity: 0.7;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .student-info .value {
            font-weight: 600;
            font-size: 14px;
          }
          .meta { 
            background: #f8fafc; 
            padding: 25px 30px; 
            border-left: 5px solid #000B29; 
            display: flex; 
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
            margin: 0;
          }
          .meta-item { 
            text-align: center;
            flex: 1;
            min-width: 120px;
          }
          .meta-label { 
            font-size: 11px; 
            color: #64748b; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .meta-value { 
            font-size: 15px; 
            font-weight: 700; 
            color: #0f172a;
          }
          .meta-value.status {
            color: #10b981;
          }
          .content {
            padding: 30px;
          }
          .section { 
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 { 
            color: #000B29; 
            border-bottom: 3px solid #000B29; 
            padding-bottom: 10px; 
            text-transform: uppercase;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
          }
          .section-content { 
            font-size: 14px; 
            line-height: 1.8;
            color: #374151;
            text-align: left;
          }
          .section-content p {
            margin-bottom: 12px;
          }
          .section-content img {
            max-width: 100% !important;
            max-height: 400px !important;
            height: auto !important;
            width: auto !important;
            object-fit: contain !important;
            border-radius: 8px;
            margin: 15px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: block;
            page-break-inside: avoid;
          }
          .section-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
            page-break-inside: avoid;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .section-content th,
          .section-content td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
          }
          .section-content th {
            background: #f8fafc;
            font-weight: 600;
            color: #1e293b;
          }
          .footer { 
            text-align: center; 
            padding: 25px; 
            border-top: 3px solid #e2e8f0; 
            background: #f8fafc;
            margin-top: 30px;
          }
          .footer .brand {
            color: #000B29;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .footer p {
            font-size: 12px; 
            color: #64748b;
            margin: 4px 0;
          }
          @media print {
            .section { page-break-inside: avoid; }
            img { page-break-inside: avoid; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="logo-container">📚</div>
          </div>
          <div class="header-title">
            <h1>${title}</h1>
            <p class="course-name">${realCourseName}</p>
          </div>
          <div class="student-info">
            <div>
              <div class="label">Student</div>
              <div class="value">${realStudentName}</div>
            </div>
            <div>
              <div class="label">Date</div>
              <div class="value">${currentDate}</div>
            </div>
          </div>
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Course</div>
            <div class="meta-value">${realCourseName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Assignment #</div>
            <div class="meta-value">${realAssignmentNo}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Student ID</div>
            <div class="meta-value">${realStudentId}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Status</div>
            <div class="meta-value status">Completed</div>
          </div>
        </div>
        
        <div class="content">
          ${sections.filter(s => s.content?.trim()).map(s => `
            <div class="section">
              <h2>${s.title}</h2>
              <div class="section-content">${s.content}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <div class="brand">SkillsMind Learning Management System</div>
          <p>© ${currentYear} All rights reserved</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p style="margin-top: 8px; font-size: 11px;">${realStudentEmail}</p>
        </div>
      </body>
      </html>
    `;

    const file = { content: htmlContent };
    
    console.log('🚀 Generating PDF...');
    
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    
    console.log('✅ PDF generated:', pdfBuffer.length, 'bytes');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'PDF generation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
module.exports = router;