const mongoose = require('mongoose');

const webinarRegistrationSchema = new mongoose.Schema({
    webinarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WebinarSettings',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    courseName: String,
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    city: String,
    age: Number,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', '']
    },
    dateOfBirth: Date,
    qualification: String,
    profession: String,
    registeredAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String
});

module.exports = mongoose.model('WebinarRegistration', webinarRegistrationSchema);