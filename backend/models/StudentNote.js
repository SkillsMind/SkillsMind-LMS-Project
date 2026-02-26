const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course'
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: ['lecture', 'assignment', 'quiz', 'personal', 'important'],
        default: 'personal'
    },
    tags: [String],
    color: { 
        type: String, 
        default: '#ffffff' 
    },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    attachments: [{ filename: String, url: String }],
    lastEditedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentNote', noteSchema);