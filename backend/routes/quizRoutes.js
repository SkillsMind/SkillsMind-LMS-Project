const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { launchBrowser } = require('../utils/browser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');



// Admin check helper
const isAdmin = (req) => {
  if (!req.user) return false;
  const role = req.user.role || req.user.userType || '';
  return ['admin', 'instructor', 'teacher'].includes(role.toLowerCase());
};

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Helper function to get grade
const getGrade = (percentage) => {
  if (percentage >= 90) return { label: 'A+', color: '#16a34a' };
  if (percentage >= 80) return { label: 'A', color: '#22c55e' };
  if (percentage >= 70) return { label: 'B', color: '#3b82f6' };
  if (percentage >= 60) return { label: 'C', color: '#f59e0b' };
  if (percentage >= 50) return { label: 'D', color: '#f97316' };
  return { label: 'F', color: '#dc2626' };
};

// ==========================================
// 🔥 HELPER: Generate Course-wise Quiz Number
// ==========================================
const generateQuizNumber = async (courseId) => {
  try {
    // 🔥 Find the last quiz for THIS SPECIFIC COURSE
    const lastQuiz = await Quiz.findOne(
      { courseId: courseId }, 
      { quizNumber: 1 }
    ).sort({ createdAt: -1 }).lean();
    
    let sequenceNumber = 1;
    
    if (lastQuiz && lastQuiz.quizNumber) {
      // Extract number from existing quizNumber (e.g., "WEB-QUIZ-005" or "QUIZ-0005" -> 5)
      const match = lastQuiz.quizNumber.match(/(\d+)$/);
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Get course info for prefix
    const course = await Course.findById(courseId).select('title category').lean();
    let prefix = 'QUIZ';
    
    if (course) {
      // Create prefix from course title (e.g., "Web Development" -> "WEB")
      const courseName = course.title || course.category || 'COURSE';
      prefix = courseName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 4); // Max 4 characters
    }
    
    // Format: WEB-QUIZ-001, WEB-QUIZ-002, etc.
    const quizNumber = `${prefix}-QUIZ-${String(sequenceNumber).padStart(3, '0')}`;
    
    // 🔥 Double check if this number already exists (safety check)
    const exists = await Quiz.findOne({ quizNumber: quizNumber });
    if (exists) {
      // If exists, try with timestamp
      return `${prefix}-QUIZ-${String(sequenceNumber).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    }
    
    return quizNumber;
  } catch (error) {
    console.error('Error generating quiz number:', error);
    // Fallback: use timestamp
    return `QUIZ-${Date.now()}`;
  }
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all quizzes (Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const quizzes = await Quiz.find()
      .populate('courseId', 'title category')
      .populate('submissions.studentId', 'name email profilePic')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 CREATE NEW QUIZ (FIXED VERSION)
router.post('/', auth, async (req, res) => {
  try {
    console.log('🔵 Create Quiz Request:', req.body);

    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { title, description, courseId, duration, passingMarks, status, questions } = req.body;

    // Validation
    if (!title || !courseId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title, course, and at least one question required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, error: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Validate questions
    const validatedQuestions = questions.map((q, idx) => {
      if (!q.questionText || !q.options || q.options.length < 2) {
        throw new Error(`Question ${idx + 1}: Invalid data`);
      }
      return {
        questionText: q.questionText.trim(),
        questionType: q.questionType || 'mcq',
        options: q.options.map(opt => opt.trim()).filter(opt => opt),
        correctOption: parseInt(q.correctOption) || 0,
        marks: parseInt(q.marks) || 10,
        explanation: (q.explanation || '').trim()
      };
    });

    // 🔥 FIX: Generate course-wise unique quiz number
    const quizNumber = await generateQuizNumber(courseId);
    console.log('🆕 Generated Quiz Number:', quizNumber);

    // Create quiz object
    const quizData = {
      title: title.trim(),
      description: (description || '').trim(),
      courseId: new mongoose.Types.ObjectId(courseId),
      courseName: course.title,
      quizNumber: quizNumber, // 🔥 Explicitly set unique number
      createdBy: new mongoose.Types.ObjectId(req.user.id || req.user._id),
      duration: parseInt(duration) || 30,
      passingMarks: parseInt(passingMarks) || 50,
      status: status || 'draft',
      questions: validatedQuestions
    };

    // Create and save quiz
    const quiz = new Quiz(quizData);
    await quiz.save();
    
    console.log('✅ Quiz saved successfully:', {
      id: quiz._id,
      quizNumber: quiz.quizNumber,
      title: quiz.title
    });

    // 🔥 Notify enrolled students if quiz is active
    if (status === 'active' && course.enrolledStudentIds && course.enrolledStudentIds.length > 0) {
      try {
        const io = req.app.get('io');
        if (io) {
          course.enrolledStudentIds.forEach(studentId => {
            io.to(`student_${studentId}`).emit('newQuiz', {
              quiz: {
                id: quiz._id,
                quizNumber: quiz.quizNumber,
                title: quiz.title,
                courseName: quiz.courseName,
                duration: quiz.duration,
                totalMarks: quiz.totalMarks,
                questionCount: quiz.questions.length
              }
            });
          });
          console.log(`📢 Notifications sent to ${course.enrolledStudentIds.length} students`);
        }
      } catch (notifyError) {
        console.error('Notification error (non-critical):', notifyError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully!',
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        totalMarks: quiz.totalMarks,
        questionCount: quiz.questions.length,
        status: quiz.status
      }
    });

  } catch (error) {
    console.error('❌ Create quiz error:', error);
    
    // 🔥 Better error handling for duplicate key
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz number already exists. Please try again.',
        details: error.keyValue || error.message
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update quiz (Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Fields that can be updated
    const updatableFields = ['title', 'description', 'duration', 'passingMarks', 'status', 'questions'];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        quiz[field] = req.body[field];
      }
    });

    quiz.updatedAt = new Date();
    await quiz.save();

    res.json({ 
      success: true, 
      message: 'Quiz updated successfully!', 
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        status: quiz.status
      }
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle quiz status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { status } = req.body;
    if (!['draft', 'active', 'inactive', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: status, updatedAt: new Date() },
      { new: true }
    );

    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Notify students if activated
    if (status === 'active') {
      try {
        const course = await Course.findById(quiz.courseId);
        const io = req.app.get('io');
        if (io && course && course.enrolledStudentIds) {
          course.enrolledStudentIds.forEach(studentId => {
            io.to(`student_${studentId}`).emit('quizActivated', {
              quizId: quiz._id,
              title: quiz.title
            });
          });
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }

    res.json({ 
      success: true, 
      message: `Quiz status updated to ${status}`,
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        status: quiz.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Quiz deleted successfully',
      deletedQuiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz submissions (Admin)
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name email profilePic');

    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        questions: quiz.questions
      },
      submissions: quiz.submissions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

// 🔥 Get available quizzes for student (FIXED - Shows only enrolled course quizzes)
router.get('/my-quizzes', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get enrolled course IDs from various possible fields
    let enrolledCourseIds = [];
    
    if (user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
      enrolledCourseIds = user.enrolledCourses;
    } else if (user.courses && Array.isArray(user.courses)) {
      enrolledCourseIds = user.courses;
    } else if (user.enrolledCourseIds && Array.isArray(user.enrolledCourseIds)) {
      enrolledCourseIds = user.enrolledCourseIds;
    }

    console.log('👤 User enrolled courses:', enrolledCourseIds);

    if (enrolledCourseIds.length === 0) {
      return res.json({ 
        success: true, 
        quizzes: [],
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
        quizzes: [],
        message: 'No valid course IDs found'
      });
    }

    // 🔥 Find active quizzes for enrolled courses
    const quizzes = await Quiz.find({
      courseId: { $in: objectIds },
      status: 'active'
    })
    .select('-questions.correctOption -questions.explanation')
    .populate('courseId', 'title category')
    .sort({ createdAt: -1 });

    console.log(`📚 Found ${quizzes.length} active quizzes for user`);

    res.json({ 
      success: true, 
      count: quizzes.length,
      quizzes: quizzes.map(q => ({
        _id: q._id,
        quizNumber: q.quizNumber,
        title: q.title,
        courseName: q.courseName,
        courseId: q.courseId,
        duration: q.duration,
        totalMarks: q.totalMarks,
        questionCount: q.questions.length,
        passingMarks: q.passingMarks,
        status: q.status,
        createdAt: q.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Fetch my quizzes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single quiz for attempt
router.get('/:id/take', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctOption -questions.explanation');

    if (!quiz || quiz.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Quiz not found or inactive' });
    }

    const user = await User.findById(userId);
    const enrolledIds = (user.enrolledCourses || user.courses || [])
      .map(id => id.toString());
    
    if (!enrolledIds.includes(quiz.courseId.toString())) {
      return res.status(403).json({ success: false, error: 'Not enrolled in this course' });
    }

    const existing = quiz.submissions?.find(
      sub => sub.studentId.toString() === userId.toString()
    );
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already attempted', 
        submission: existing 
      });
    }

    res.json({ 
      success: true, 
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        duration: quiz.duration,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        questions: quiz.questions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's specific quiz result with full details
router.get('/:id/my-result', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const submission = quiz.submissions.find(
      sub => sub.studentId.toString() === userId.toString()
    );

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        duration: quiz.duration,
        questions: quiz.questions
      },
      submission: submission
    });

  } catch (error) {
    console.error('❌ Fetch my result error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit quiz attempt
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const userId = req.user.id || req.user._id;
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Quiz not found or inactive' });
    }

    const existingIndex = quiz.submissions.findIndex(
      sub => sub.studentId.toString() === userId.toString()
    );
    
    if (existingIndex !== -1) {
      return res.status(400).json({ success: false, error: 'Already submitted' });
    }

    let obtainedMarks = 0;
    const gradedAnswers = answers.map((answer, idx) => {
      const question = quiz.questions[idx];
      if (!question) return { ...answer, isCorrect: false, marksObtained: 0 };
      
      const isCorrect = answer.selectedOption === question.correctOption;
      const marksObtained = isCorrect ? question.marks : 0;
      obtainedMarks += marksObtained;

      return {
        questionId: question._id,
        selectedOption: answer.selectedOption,
        isCorrect,
        marksObtained
      };
    });

    const percentage = (obtainedMarks / quiz.totalMarks) * 100;
    const isPassed = percentage >= quiz.passingMarks;

    const submission = {
      studentId: new mongoose.Types.ObjectId(userId),
      answers: gradedAnswers,
      obtainedMarks,
      totalMarks: quiz.totalMarks,
      percentage,
      isPassed,
      timeTaken: timeTaken || 0,
      submittedAt: new Date(),
      isGraded: true
    };

    quiz.submissions.push(submission);
    await quiz.save();

    // Notify admin
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('newQuizSubmission', {
          quizId: quiz._id,
          quizNumber: quiz.quizNumber,
          quizTitle: quiz.title,
          studentId: userId,
          obtainedMarks,
          totalMarks: quiz.totalMarks,
          percentage
        });
      }
    } catch (e) {
      console.error('Socket error:', e);
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully!',
      result: {
        obtainedMarks,
        totalMarks: quiz.totalMarks,
        percentage: percentage.toFixed(2),
        isPassed,
        answers: gradedAnswers
      }
    });

  } catch (error) {
    console.error('❌ Submit quiz error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's quiz results
router.get('/my-results', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const quizzes = await Quiz.find({
      'submissions.studentId': userId
    }).populate('courseId', 'title');

    const results = quizzes.map(quiz => {
      const submission = quiz.submissions.find(
        sub => sub.studentId.toString() === userId.toString()
      );
      
      return {
        quizId: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        courseId: quiz.courseId,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        ...submission.toObject()
      };
    });

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// QUIZ REPORT ROUTES
// ==========================================

// Get detailed quiz report
router.get('/:id/report', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title enrolledStudentIds');

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const enrolledStudentIds = quiz.courseId?.enrolledStudentIds || [];
    const submittedStudentIds = quiz.submissions.map(sub => sub.studentId.toString());
    
    const allStudents = await User.find({
      _id: { $in: enrolledStudentIds }
    }).select('name email profilePic');

    const submittedStudents = [];
    const notSubmittedStudents = [];

    allStudents.forEach(student => {
      const submission = quiz.submissions.find(
        sub => sub.studentId.toString() === student._id.toString()
      );
      
      if (submission) {
        submittedStudents.push({
          studentId: student._id,
          name: student.name,
          email: student.email,
          profilePic: student.profilePic,
          obtainedMarks: submission.obtainedMarks,
          totalMarks: submission.totalMarks,
          percentage: submission.percentage,
          isPassed: submission.isPassed,
          timeTaken: submission.timeTaken,
          submittedAt: submission.submittedAt
        });
      } else {
        notSubmittedStudents.push({
          studentId: student._id,
          name: student.name,
          email: student.email,
          profilePic: student.profilePic
        });
      }
    });

    submittedStudents.sort((a, b) => b.percentage - a.percentage);

    const stats = {
      totalEnrolled: allStudents.length,
      totalSubmitted: submittedStudents.length,
      totalNotSubmitted: notSubmittedStudents.length,
      submissionRate: allStudents.length > 0 
        ? ((submittedStudents.length / allStudents.length) * 100).toFixed(1) 
        : 0,
      averageScore: submittedStudents.length > 0
        ? (submittedStudents.reduce((acc, s) => acc + s.percentage, 0) / submittedStudents.length).toFixed(1)
        : 0,
      passCount: submittedStudents.filter(s => s.isPassed).length,
      failCount: submittedStudents.filter(s => !s.isPassed).length
    };

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        quizNumber: quiz.quizNumber,
        title: quiz.title,
        courseName: quiz.courseName,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        duration: quiz.duration,
        status: quiz.status
      },
      stats,
      submittedStudents,
      notSubmittedStudents
    });

  } catch (error) {
    console.error('❌ Quiz report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PDF GENERATION ROUTES
// ==========================================

// Single student PDF
router.get('/:id/result-pdf/:studentId', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { id, studentId } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const student = await User.findById(studentId).select('name email');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const submission = quiz.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const percentage = ((submission.obtainedMarks / quiz.totalMarks) * 100).toFixed(1);
    const grade = getGrade(parseFloat(percentage));
    const passed = parseFloat(percentage) >= (quiz.passingMarks || 50);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quiz Result - ${student.name}</title>
        <style>
          @page { size: A4; margin: 20px; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            font-size: 12px;
          }
          .header {
            background: #000B29;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .student-info {
            background: #f8fafc;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-table td:first-child {
            font-weight: bold;
            color: #000B29;
            width: 30%;
          }
          .result-box {
            background: ${passed ? '#dcfce7' : '#fee2e2'};
            border: 2px solid ${passed ? '#16a34a' : '#dc2626'};
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .result-box h2 {
            margin: 0 0 10px 0;
            color: ${passed ? '#16a34a' : '#dc2626'};
          }
          .marks {
            font-size: 36px;
            font-weight: bold;
            color: #000B29;
          }
          .grade-badge {
            display: inline-block;
            background: ${grade.color};
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
          }
          .questions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .questions-table th {
            background: #000B29;
            color: white;
            padding: 12px;
            text-align: left;
          }
          .questions-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .questions-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .correct { color: #16a34a; font-weight: bold; }
          .incorrect { color: #dc2626; font-weight: bold; }
          .option-cell {
            font-family: monospace;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            color: #666;
            font-size: 11px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 SkillsMind Quiz Result</h1>
          <p>${quiz.courseName} - ${quiz.title}</p>
          <p>Quiz #${quiz.quizNumber}</p>
        </div>

        <div class="student-info">
          <table class="info-table">
            <tr>
              <td>Student Name:</td>
              <td>${student.name}</td>
            </tr>
            <tr>
              <td>Email:</td>
              <td>${student.email}</td>
            </tr>
            <tr>
              <td>Submission Date:</td>
              <td>${new Date(submission.submittedAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Duration:</td>
              <td>${quiz.duration} minutes</td>
            </tr>
          </table>
        </div>

        <div class="result-box">
          <h2>${passed ? '✓ PASSED' : '✗ FAILED'}</h2>
          <div class="marks">${submission.obtainedMarks} / ${quiz.totalMarks}</div>
          <div style="font-size: 18px; margin-top: 10px;">${percentage}%</div>
          <div class="grade-badge">Grade: ${grade.label}</div>
        </div>

        <h3 style="color: #000B29; margin-bottom: 10px;">Question Summary</h3>
        <table class="questions-table">
          <thead>
            <tr>
              <th>Q#</th>
              <th>Your Answer</th>
              <th>Correct</th>
              <th>Status</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${submission.answers.map((ans, idx) => {
              const question = quiz.questions[idx];
              const yourOption = String.fromCharCode(65 + ans.selectedOption);
              const correctOption = String.fromCharCode(65 + question.correctOption);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="option-cell ${ans.isCorrect ? 'correct' : 'incorrect'}">${yourOption}</td>
                  <td class="option-cell correct">${correctOption}</td>
                  <td class="${ans.isCorrect ? 'correct' : 'incorrect'}">
                    ${ans.isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </td>
                  <td>${ans.marksObtained}/${question.marks}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by SkillsMind Learning Management System</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      });
    } catch (launchError) {
      console.error('Puppeteer launch error:', launchError);
      return res.status(500).json({ success: false, error: 'Browser launch failed: ' + launchError.message });
    }
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quiz-result-${student.name.replace(/\s+/g, '_')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF Generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF: ' + error.message });
  }
});

// Bulk PDF Generation
router.get('/:id/bulk-results-pdf', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name email profilePic');

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (!quiz.submissions || quiz.submissions.length === 0) {
      return res.status(404).json({ success: false, error: 'No submissions found' });
    }

    const totalMarks = quiz.totalMarks;
    const submissions = quiz.submissions;
    const avgPercentage = (submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length).toFixed(1);
    const passedCount = submissions.filter(s => s.isPassed).length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${quiz.title} - Complete Results</title>
        <style>
          @page { size: A4; margin: 15px; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 15px; 
            color: #333;
            font-size: 11px;
          }
          .header {
            background: #000B29;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin-bottom: 15px;
          }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 12px; }
          .summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            text-align: center;
          }
          .summary-item {
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .summary-item h3 { margin: 0; color: #000B29; font-size: 18px; }
          .summary-item p { margin: 5px 0 0 0; color: #666; font-size: 11px; }
          .student-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .student-header {
            background: #000B29;
            color: white;
            padding: 10px 15px;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .student-header h3 { margin: 0; font-size: 14px; }
          .student-info {
            background: #f8fafc;
            padding: 10px 15px;
            border: 1px solid #e2e8f0;
            border-top: none;
            display: flex;
            justify-content: space-between;
          }
          .result-badge { text-align: right; }
          .result-badge .marks {
            font-size: 20px;
            font-weight: bold;
            color: #000B29;
          }
          .pass-badge {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            margin-top: 5px;
          }
          .fail-badge {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            margin-top: 5px;
          }
          .questions-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .questions-table th {
            background: #f1f5f9;
            color: #000B29;
            padding: 8px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #000B29;
          }
          .questions-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .questions-table tr:nth-child(even) { background: #f8fafc; }
          .correct { color: #16a34a; font-weight: bold; }
          .incorrect { color: #dc2626; font-weight: bold; }
          .option-cell { font-family: monospace; font-weight: bold; }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            color: #666;
            font-size: 10px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 SkillsMind Quiz Results</h1>
          <p>${quiz.courseName} - ${quiz.title}</p>
          <p>Quiz #${quiz.quizNumber}</p>
        </div>

        <div class="summary-box">
          <div class="summary-grid">
            <div class="summary-item">
              <h3>${submissions.length}</h3>
              <p>Total Students</p>
            </div>
            <div class="summary-item">
              <h3>${quiz.totalMarks}</h3>
              <p>Total Marks</p>
            </div>
            <div class="summary-item">
              <h3>${avgPercentage}%</h3>
              <p>Average Score</p>
            </div>
            <div class="summary-item">
              <h3>${passedCount}</h3>
              <p>Passed</p>
            </div>
          </div>
        </div>

        ${submissions.map((sub, idx) => {
          const percentage = ((sub.obtainedMarks / quiz.totalMarks) * 100).toFixed(1);
          const grade = getGrade(parseFloat(percentage));
          const passed = parseFloat(percentage) >= (quiz.passingMarks || 50);
          
          return `
            <div class="student-section">
              <div class="student-header">
                <h3>${idx + 1}. ${sub.studentId?.name || 'Unknown'}</h3>
                <span style="font-size: 11px;">${sub.studentId?.email || 'N/A'}</span>
              </div>
              <div class="student-info">
                <div>
                  <strong>Submitted:</strong> ${new Date(sub.submittedAt).toLocaleString()}<br>
                  <strong>Grade:</strong> <span style="color: ${grade.color}; font-weight: bold;">${grade.label}</span>
                </div>
                <div class="result-badge">
                  <div class="marks">${sub.obtainedMarks}/${quiz.totalMarks}</div>
                  <div style="font-size: 12px;">${percentage}%</div>
                  <div class="${passed ? 'pass-badge' : 'fail-badge'}">
                    ${passed ? '✓ PASSED' : '✗ FAILED'}
                  </div>
                </div>
              </div>
              
              <table class="questions-table">
                <thead>
                  <tr>
                    <th>Q#</th>
                    <th>Question</th>
                    <th>Your Ans</th>
                    <th>Correct</th>
                    <th>Status</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  ${sub.answers.map((ans, qIdx) => {
                    const question = quiz.questions[qIdx];
                    const yourOption = String.fromCharCode(65 + ans.selectedOption);
                    const correctOption = String.fromCharCode(65 + question.correctOption);
                    const shortQuestion = question.questionText.length > 50 
                      ? question.questionText.substring(0, 50) + '...' 
                      : question.questionText;
                    return `
                      <tr>
                        <td>${qIdx + 1}</td>
                        <td>${shortQuestion}</td>
                        <td class="option-cell ${ans.isCorrect ? 'correct' : 'incorrect'}">${yourOption}</td>
                        <td class="option-cell correct">${correctOption}</td>
                        <td class="${ans.isCorrect ? 'correct' : 'incorrect'}">
                          ${ans.isCorrect ? '✓' : '✗'}
                        </td>
                        <td>${ans.marksObtained}/${question.marks}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}

        <div class="footer">
          <p>Generated by SkillsMind Learning Management System</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      });
    } catch (launchError) {
      console.error('Puppeteer launch error:', launchError);
      return res.status(500).json({ success: false, error: 'Browser launch failed: ' + launchError.message });
    }
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/\s+/g, '_')}_Complete_Results.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Bulk PDF Generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate bulk PDF: ' + error.message });
  }
});

// ==========================================
// EMAIL SENDING ROUTE
// ==========================================

// Send result email to student
router.post('/:id/send-result', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { studentId } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const submission = quiz.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const student = await User.findById(studentId).select('name email');
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `Quiz Result: ${quiz.title} (${quiz.quizNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000B29; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🎓 SkillsMind</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Quiz Results</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${quiz.quizNumber}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Hello ${student.name},</h2>
            <p style="color: #666; line-height: 1.6;">Your quiz results for <strong>"${quiz.title}"</strong> are now available.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 5px solid ${submission.isPassed ? '#16a34a' : '#dc2626'};">
              <div style="font-size: 36px; font-weight: bold; color: ${submission.isPassed ? '#16a34a' : '#dc2626'};">
                ${submission.obtainedMarks} / ${submission.totalMarks}
              </div>
              <div style="font-size: 20px; color: #666; margin-top: 10px;">
                ${submission.percentage.toFixed(2)}%
              </div>
              <div style="margin-top: 15px;">
                <span style="display: inline-block; padding: 8px 20px; background: ${submission.isPassed ? '#16a34a' : '#dc2626'}; color: white; border-radius: 20px; font-weight: bold;">
                  ${submission.isPassed ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>Quiz Details:</strong><br>
                Course: ${quiz.courseName}<br>
                Duration: ${quiz.duration} minutes<br>
                Passing Marks: ${quiz.passingMarks}%<br>
                Submitted: ${new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              This is an automated email from SkillsMind Learning Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Result email sent successfully to ${student.name} (${student.email})`,
      student: {
        name: student.name,
        email: student.email
      }
    });

  } catch (error) {
    console.error('❌ Send result error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email: ' + error.message });
  }
});

module.exports = router;