const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const StudentCourse = require('../models/StudentCourse');
const auth = require('../middleware/auth');

// GET: Student ka complete result/grade report
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const enrollments = await StudentCourse.find({ 
            studentId: req.params.studentId
        }).populate('courseId', 'title thumbnail');

        const courseIds = enrollments.map(e => e.courseId._id);

        // Assignment Results
        const assignments = await Assignment.find({
            courseId: { $in: courseIds },
            'submissions.studentId': req.params.studentId,
            'submissions.status': 'graded'
        }).populate('courseId', 'title');

        const assignmentResults = assignments.map(assignment => {
            const submission = assignment.submissions.find(
                s => s.studentId.toString() === req.params.studentId
            );
            return {
                id: assignment._id,
                title: assignment.title,
                courseName: assignment.courseId.title,
                type: 'assignment',
                totalMarks: assignment.totalMarks,
                obtainedMarks: submission.marks,
                percentage: Math.round((submission.marks / assignment.totalMarks) * 100),
                feedback: submission.feedback,
                gradedAt: submission.gradedAt || submission.submittedAt
            };
        });

        // Quiz Results
        const quizzes = await Quiz.find({
            courseId: { $in: courseIds },
            'attempts.studentId': req.params.studentId,
            'attempts.status': 'completed'
        }).populate('courseId', 'title');

        const quizResults = quizzes.map(quiz => {
            const attempt = quiz.attempts.find(
                a => a.studentId.toString() === req.params.studentId
            );
            return {
                id: quiz._id,
                title: quiz.title,
                courseName: quiz.courseId.title,
                type: 'quiz',
                totalMarks: quiz.totalMarks,
                obtainedMarks: attempt.score,
                percentage: attempt.percentage,
                passingMarks: quiz.passingMarks,
                passed: attempt.percentage >= quiz.passingMarks,
                timeTaken: attempt.timeTaken,
                attemptedAt: attempt.submittedAt
            };
        });

        // Combine and calculate overall
        const allResults = [...assignmentResults, ...quizResults];
        const totalObtained = allResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
        const totalMax = allResults.reduce((sum, r) => sum + r.totalMarks, 0);
        const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        // Grade calculation
        const calculateGrade = (p) => {
            if (p >= 90) return 'A+';
            if (p >= 85) return 'A';
            if (p >= 80) return 'B+';
            if (p >= 75) return 'B';
            if (p >= 70) return 'C+';
            if (p >= 65) return 'C';
            if (p >= 60) return 'D';
            return 'F';
        };

        res.json({
            success: true,
            summary: {
                totalAssessments: allResults.length,
                totalObtainedMarks: totalObtained,
                totalMaxMarks: totalMax,
                overallPercentage: Math.round(overallPercentage),
                overallGrade: calculateGrade(overallPercentage),
                status: overallPercentage >= 60 ? 'Passing' : 'At Risk'
            },
            results: allResults.sort((a, b) => new Date(b.gradedAt || b.attemptedAt) - new Date(a.gradedAt || a.attemptedAt))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;