const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
    assessmentType: {
        type: String,
        enum: ['assignment', 'quiz', 'midterm', 'final', 'project'],
        required: true
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number },
    grade: { 
        type: String, 
        enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
        default: 'F'
    },
    remarks: String,
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gradedAt: { type: Date },
    isPublished: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Overall progress calculation ke liye
resultSchema.pre('save', function(next) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
    
    // Auto grade calculation
    const p = this.percentage;
    if (p >= 90) this.grade = 'A+';
    else if (p >= 85) this.grade = 'A';
    else if (p >= 80) this.grade = 'B+';
    else if (p >= 75) this.grade = 'B';
    else if (p >= 70) this.grade = 'C+';
    else if (p >= 65) this.grade = 'C';
    else if (p >= 60) this.grade = 'D';
    else this.grade = 'F';
    
    next();
});

module.exports = mongoose.model('Result', resultSchema);