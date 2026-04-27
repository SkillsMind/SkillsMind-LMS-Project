const mongoose = require('mongoose');

const webinarSettingsSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    startDate: Date,
    endDate: Date,
    time: String,
    topics: [String],
    meetingLink: String,
    instructor: String,
    certificateProvided: {
        type: Boolean,
        default: true
    },
    recordingAvailable: {
        type: Boolean,
        default: true
    },
    // ✅ ADD THIS IMAGE FIELD
    image: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WebinarSettings', webinarSettingsSchema);