const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const aiGrader = require('../services/aiGrader');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// 🔥 Grade single submission with PDF support
router.post('/grade/:submissionId', auth, async (req, res) => {
  try {
    console.log('🎯 Single Grading Request for submission:', req.params.submissionId);
    
    const { submissionId } = req.params;
    const { manualReview = false, overrideMarks = null } = req.body;
    
    // Find assignment with this submission
    const assignment = await Assignment.findOne({ 'submissions._id': submissionId })
      .populate('submissions.studentId', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );
    
    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    const submission = assignment.submissions[submissionIndex];
    
    // 🔥 Collect all file paths for processing
    const submissionFiles = [];
    
    if (submission.files && submission.files.length > 0) {
      submission.files.forEach(file => {
        if (file.url) {
          submissionFiles.push(file.url);
        }
      });
    }

    console.log(`📁 Found ${submissionFiles.length} files to process`);
    
    // Call AI Grader with file support
    const gradingResult = await aiGrader.gradeAssignment({
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description,
      assignmentRequirements: assignment.rubric ? [assignment.rubric] : [],
      studentSubmission: submission.comments || '',
      totalMarks: assignment.totalMarks,
      rubric: assignment.rubric,
      courseContext: assignment.courseName,
      submissionFiles: submissionFiles // 🔥 Pass files for PDF reading
    });
    
    if (!gradingResult.success) {
      return res.status(503).json({
        success: false,
        error: gradingResult.error,
        message: gradingResult.feedback,
        requiresManualReview: true,
        filesProcessed: gradingResult.filesProcessed
      });
    }
    
    // Update submission with AI grades
    assignment.submissions[submissionIndex].obtainedMarks = overrideMarks !== null ? overrideMarks : gradingResult.marks;
    assignment.submissions[submissionIndex].feedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].status = manualReview ? 'submitted' : 'graded';
    assignment.submissions[submissionIndex].aiGraded = true;
    assignment.submissions[submissionIndex].aiConfidence = gradingResult.confidence;
    assignment.submissions[submissionIndex].aiFeedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].strengths = gradingResult.strengths || [];
    assignment.submissions[submissionIndex].improvements = gradingResult.improvements || [];
    assignment.submissions[submissionIndex].requirementAnalysis = gradingResult.requirementAnalysis || {};
    assignment.submissions[submissionIndex].gradedAt = new Date();
    assignment.submissions[submissionIndex].filesProcessed = gradingResult.filesProcessed; // Store file info
    
    await assignment.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${submission.studentId}`).emit('assignmentGraded', {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        obtainedMarks: assignment.submissions[submissionIndex].obtainedMarks,
        totalMarks: assignment.totalMarks,
        feedback: gradingResult.feedback,
        aiGraded: true,
        strengths: gradingResult.strengths,
        improvements: gradingResult.improvements
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment graded successfully by AI',
      grading: {
        ...gradingResult,
        submissionId: submission._id,
        studentName: submission.studentId?.name,
        studentEmail: submission.studentId?.email
      }
    });
    
  } catch (error) {
    console.error('❌ Single Grade Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'AI grading failed. Please try again or grade manually.',
      requiresManualReview: true
    });
  }
});

// 🔥 Batch grade all pending submissions
router.post('/batch-grade/:assignmentId', auth, async (req, res) => {
  try {
    console.log('🤖 Batch Grading Request for assignment:', req.params.assignmentId);
    
    const { assignmentId } = req.params;
    const { delayBetweenRequests = 3000 } = req.body; // Configurable delay
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    
    // Find ungraded submissions
    const ungradedSubmissions = assignment.submissions.filter(
      sub => sub.status !== 'graded' && !sub.aiGraded
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
    const results = [];
    
    // Grade each submission with delay to avoid rate limiting
    for (let i = 0; i < ungradedSubmissions.length; i++) {
      const submission = ungradedSubmissions[i];
      const submissionIndex = assignment.submissions.findIndex(
        sub => sub._id.toString() === submission._id.toString()
      );
      
      try {
        // Add delay between requests
        if (i > 0) {
          console.log(`⏳ Waiting ${delayBetweenRequests}ms before grading submission ${i + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
        
        // Collect files
        const submissionFiles = [];
        if (submission.files && submission.files.length > 0) {
          submission.files.forEach(file => {
            if (file.url) submissionFiles.push(file.url);
          });
        }
        
        console.log(`🤖 Grading submission ${i + 1}/${ungradedSubmissions.length} (Student: ${submission.studentId})...`);
        
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
            reason: gradingResult.error,
            studentId: submission.studentId 
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
        assignment.submissions[submissionIndex].gradedAt = new Date();
        assignment.submissions[submissionIndex].filesProcessed = gradingResult.filesProcessed;
        
        successCount++;
        results.push({
          submissionId: submission._id,
          marks: gradingResult.marks,
          grade: gradingResult.grade,
          confidence: gradingResult.confidence
        });
        
        console.log(`✅ Graded: ${gradingResult.marks}/${assignment.totalMarks} (Confidence: ${gradingResult.confidence}%)`);
        
      } catch (subError) {
        console.error(`❌ Error grading submission ${submission._id}:`, subError.message);
        failCount++;
        failedSubmissions.push({ 
          id: submission._id, 
          reason: subError.message,
          studentId: submission.studentId 
        });
      }
    }
    
    await assignment.save();
    
    // Emit socket events for all graded submissions
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
      results: results,
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

// 🔥 Get AI grading status/progress (for long batch operations)
router.get('/status/:assignmentId', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);
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

// 🔥 Manual override AI grade
router.put('/override/:submissionId', auth, async (req, res) => {
  try {
    console.log('✏️ Override Request for submission:', req.params.submissionId);
    
    const { submissionId } = req.params;
    const { marks, feedback, reason } = req.body;
    
    if (marks === undefined || marks === null) {
      return res.status(400).json({ success: false, error: 'Marks are required' });
    }
    
    const assignment = await Assignment.findOne({ 'submissions._id': submissionId });
    
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );
    
    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    // Store previous AI grade for reference
    const previousAiGrade = assignment.submissions[submissionIndex].aiGraded ? {
      marks: assignment.submissions[submissionIndex].obtainedMarks,
      feedback: assignment.submissions[submissionIndex].aiFeedback,
      confidence: assignment.submissions[submissionIndex].aiConfidence
    } : null;
    
    // Update with manual grades
    assignment.submissions[submissionIndex].obtainedMarks = Number(marks);
    assignment.submissions[submissionIndex].feedback = feedback || '';
    assignment.submissions[submissionIndex].status = 'graded';
    assignment.submissions[submissionIndex].aiGraded = false; // Mark as manually graded
    assignment.submissions[submissionIndex].manualOverride = {
      marks: Number(marks),
      feedback: feedback || '',
      overriddenBy: new mongoose.Types.ObjectId(req.user.id),
      overriddenAt: new Date(),
      reason: reason || 'Manual override',
      previousAiGrade: previousAiGrade
    };
    assignment.submissions[submissionIndex].gradedAt = new Date();
    assignment.submissions[submissionIndex].gradedBy = new mongoose.Types.ObjectId(req.user.id);
    
    await assignment.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const submission = assignment.submissions[submissionIndex];
      io.to(`student_${submission.studentId}`).emit('assignmentGraded', {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        obtainedMarks: Number(marks),
        feedback: feedback,
        aiGraded: false,
        manuallyGraded: true
      });
    }
    
    res.json({
      success: true,
      message: 'Grade updated successfully with manual override',
      submission: {
        _id: assignment.submissions[submissionIndex]._id,
        obtainedMarks: assignment.submissions[submissionIndex].obtainedMarks,
        feedback: assignment.submissions[submissionIndex].feedback,
        status: 'graded',
        manualOverride: assignment.submissions[submissionIndex].manualOverride
      }
    });
    
  } catch (error) {
    console.error('❌ Override Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 Re-grade submission (if AI made mistake)
router.post('/regrade/:submissionId', auth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { instructions = '' } = req.body; // Additional instructions for re-grading
    
    console.log('🔄 Re-grading submission:', submissionId);
    
    const assignment = await Assignment.findOne({ 'submissions._id': submissionId });
    
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    
    const submissionIndex = assignment.submissions.findIndex(
      sub => sub._id.toString() === submissionId
    );
    
    // Add re-grade instructions to the assignment description temporarily
    const enhancedDescription = assignment.description + 
      (instructions ? `\n\nRE-GRADING INSTRUCTIONS: ${instructions}` : '');
    
    // Collect files again
    const submission = assignment.submissions[submissionIndex];
    const submissionFiles = [];
    if (submission.files && submission.files.length > 0) {
      submission.files.forEach(file => {
        if (file.url) submissionFiles.push(file.url);
      });
    }
    
    // Call AI again
    const gradingResult = await aiGrader.gradeAssignment({
      assignmentTitle: assignment.title,
      assignmentDescription: enhancedDescription,
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
        message: 'Re-grading failed'
      });
    }
    
    // Update with new grades but keep history
    assignment.submissions[submissionIndex].obtainedMarks = gradingResult.marks;
    assignment.submissions[submissionIndex].feedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].aiGraded = true;
    assignment.submissions[submissionIndex].aiConfidence = gradingResult.confidence;
    assignment.submissions[submissionIndex].aiFeedback = gradingResult.feedback;
    assignment.submissions[submissionIndex].strengths = gradingResult.strengths || [];
    assignment.submissions[submissionIndex].improvements = gradingResult.improvements || [];
    assignment.submissions[submissionIndex].reGraded = true;
    assignment.submissions[submissionIndex].reGradedAt = new Date();
    assignment.submissions[submissionIndex].gradedAt = new Date();
    
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Re-grading completed successfully',
      grading: gradingResult
    });
    
  } catch (error) {
    console.error('❌ Re-grade Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 Test AI connection and PDF support
router.get('/test', auth, async (req, res) => {
  try {
    const result = await aiGrader.testConnection();
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      features: {
        pdfReading: true,
        batchGrading: true,
        retryLogic: true,
        requirementAnalysis: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;