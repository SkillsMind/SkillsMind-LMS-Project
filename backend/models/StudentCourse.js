const mongoose = require('mongoose');

const studentCourseSchema = new mongoose.Schema({
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
    enrollmentType: {
        type: String,
        enum: ['live', 'recorded'],
        required: true
    },
    enrollmentDate: { type: Date, default: Date.now },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    progress: {
        overallPercentage: { type: Number, default: 0 },
        completedLessons: [{ type: String }],
        lastAccessed: { type: Date },
        timeSpent: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'dropped', 'on-hold'],
        default: 'active'
    },
    certificate: {
        issued: { type: Boolean, default: false },
        issuedAt: Date,
        certificateNumber: String,
        url: String
    },
    batchInfo: {
        batchName: String,
        startDate: Date,
        endDate: Date,
        schedule: String
    }
}, { timestamps: true });

studentCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentCourse', studentCourseSchema);