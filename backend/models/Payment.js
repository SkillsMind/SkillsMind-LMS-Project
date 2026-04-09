const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentName: { 
        type: String, 
        required: [true, 'Student name is required'] 
    },
    studentEmail: { 
        type: String, 
        required: [true, 'Email is required'] 
    },
    studentCnic: { 
        type: String, 
        required: [true, 'CNIC is required'] 
    },
    // Student ID (reference to User model)
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    courseName: { 
        type: String, 
        required: [true, 'Course name is required'] 
    },
    courseId: { 
        type: String, // Frontend se string aata hai
        required: [true, 'Course ID is required']
    },
    // Enrollment mode (live/recorded)
    enrollmentMode: {
        type: String,
        enum: ['live', 'recorded'],
        default: 'recorded'
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'] 
    },
    paymentMethod: { 
        type: String, 
        required: [true, 'Payment method is required'] 
    },
    transactionId: { 
        type: String, 
        required: [true, 'Transaction ID is required']
    },
    transactionReceipt: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' 
    },
    // ✅ NEW: Rejection reason (when payment is rejected)
    rejectionReason: {
        type: String,
        default: null
    },
    // ✅ NEW: Flag to check if this payment was replaced by a resubmission
    isReplaced: {
        type: Boolean,
        default: false
    },
    // ✅ NEW: Reference to the new payment that replaced this one (for rejected payments)
    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    },
    // Approval details
    approvedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Payment', paymentSchema);