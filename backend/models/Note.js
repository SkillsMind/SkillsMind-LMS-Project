const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Untitled Note'
    },
    content: {
        type: String,
        default: ''
    },
    courseId: {
        type: String,
        default: ''
    },
    courseCode: {
        type: String,
        default: ''
    },
    courseName: {
        type: String,
        default: ''
    },
    tags: [{
        type: String
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    wordCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);