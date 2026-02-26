const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        required: true 
    },
    title: { type: String, required: true },
    description: String,
    scheduleType: {
        type: String,
        enum: ['one-time', 'recurring'],
        default: 'one-time'
    },
    dateTime: {
        start: { type: Date },
        end: { type: Date }
    },
    recurring: {
        days: [{ 
            type: String, 
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
        startTime: String,
        endTime: String,
        startDate: Date,
        endDate: Date
    },
    meetingLink: String,
    meetingPlatform: {
        type: String,
        enum: ['zoom', 'google-meet', 'microsoft-teams', 'custom'],
        default: 'zoom'
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    materials: [{ title: String, url: String }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClassSchedule', scheduleSchema);