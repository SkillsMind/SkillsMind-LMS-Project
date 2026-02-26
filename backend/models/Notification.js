const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['announcement', 'assignment', 'quiz', 'payment', 'course', 'system'],
        required: true
    },
    relatedTo: {
        model: String,
        id: mongoose.Schema.Types.ObjectId
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionLink: String,
    actionText: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);