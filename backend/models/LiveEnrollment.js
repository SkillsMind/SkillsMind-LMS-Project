const mongoose = require('mongoose');

const liveEnrollmentSchema = new mongoose.Schema({
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
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    profilePic: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'  // 🔥 CHANGED: 'active' se 'pending'
    },
    mode: { type: String, default: 'live' },
    rejectionReason: { type: String }, // 🔥 ADDED
    paymentApprovedAt: { type: Date }, // 🔥 ADDED
    paymentRejectedAt: { type: Date }, // 🔥 ADDED
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LiveEnrollment', liveEnrollmentSchema);