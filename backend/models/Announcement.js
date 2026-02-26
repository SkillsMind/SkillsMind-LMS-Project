const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['general', 'course-specific', 'urgent', 'event'],
        default: 'general'
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        default: null 
    },
    targetAudience: {
        type: String,
        enum: ['all', 'enrolled', 'specific-course'],
        default: 'all'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    attachments: [{ filename: String, url: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);