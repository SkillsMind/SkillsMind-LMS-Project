const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'absent'
    },
    markedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    sessionDetails: {
        joinTime: { type: Date },
        leaveTime: { type: Date },
        duration: { type: Number },
        ipAddress: String
    },
    remarks: String,
    createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);