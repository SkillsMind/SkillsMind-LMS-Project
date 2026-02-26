const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // 🔥 NEW: Week and session tracking for batch schedules
  weekNumber: {
    type: Number,
    default: 1
  },
  sessionNumber: {
    type: Number,
    default: 1
  },
  // 🔥 NEW: Batch/Group identifier
  batchId: {
    type: String,
    default: null // Groups schedules created together in one batch
  },
  
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60 // minutes
  },
  type: {
    type: String,
    enum: ['live', 'recorded', 'workshop'],
    default: 'live'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // 🔥 UPDATED: Meeting link with visibility control
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  // 🔥 NEW: When to show meeting link (e.g., 15 minutes before class)
  showLinkBeforeMinutes: {
    type: Number,
    default: 15
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#000B29'
  },
  instructor: {
    type: String,
    trim: true
  },
  notifyStudents: {
    type: Boolean,
    default: true
  },
  // 🔥 NEW: Actual date for this specific session
  sessionDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// 🔥 NEW: Index for efficient queries
scheduleSchema.index({ courseId: 1, sessionDate: 1 });
scheduleSchema.index({ batchId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);