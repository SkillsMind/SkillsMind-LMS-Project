const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        required: true 
    },
    enrollmentDate: { type: Date, default: Date.now },
    
    // Completion tracking
    completedLessons: [{ 
        lessonId: String, 
        completedAt: Date 
    }],
    
    // Assessment progress
    assignmentsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    
    // Attendance
    totalClasses: { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 },
    
    // Calculated fields
    overallProgress: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    
    lastActivity: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate progress
progressSchema.pre('save', function(next) {
    const total = this.totalAssignments + this.totalQuizzes;
    const completed = this.assignmentsCompleted + this.quizzesCompleted;
    this.overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    next();
});

module.exports = mongoose.model('CourseProgress', progressSchema);