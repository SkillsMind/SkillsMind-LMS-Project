const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['General', 'Event', 'Urgent', 'News'],
    default: 'General'
  },
  // 🔥 Same as ImportantLink - course reference
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null  // null = All Courses (General Notice)
  },
  // Ya specific courses array bhi ho sakta hai
  targetCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  audience: {
    type: String,
    enum: ['all', 'students', 'instructors'],
    default: 'all'
  },
  priority: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Track who has read the notice
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
noticeSchema.index({ course: 1, isActive: 1 });
noticeSchema.index({ targetCourses: 1, isActive: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ type: 1 });

module.exports = mongoose.model('Notice', noticeSchema);