const mongoose = require('mongoose');

const liveEnrollmentSchema = new mongoose.Schema({
    // ✅ ADD userId to track which student enrolled
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    course: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // ✅ ADD courseId
    profilePic: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'active' 
    },
    mode: { type: String, default: 'live' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LiveEnrollment', liveEnrollmentSchema);