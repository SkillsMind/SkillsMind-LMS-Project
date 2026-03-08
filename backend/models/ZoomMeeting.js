const mongoose = require('mongoose');

const zoomMeetingSchema = new mongoose.Schema({
  // Link to Schedule
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
    unique: true  // One Zoom meeting per schedule
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Zoom API Data
  zoomMeetingId: {
    type: String,
    required: true,
    unique: true
  },
  zoomMeetingNumber: {
    type: String,
    required: true
  },
  joinUrl: {
    type: String,
    required: true
  },
  startUrl: {
    type: String,
    required: true  // Only for host (teacher/admin)
  },
  password: {
    type: String,
    default: ''
  },
  
  // Meeting Settings
  status: {
    type: String,
    enum: ['waiting', 'live', 'ended', 'cancelled'],
    default: 'waiting'
  },
  
  // Timestamps
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  
  // Host info
  hostEmail: {
    type: String,
    default: ''
  },
  
  // Recording info (after meeting ends)
  recordingUrl: {
    type: String,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
zoomMeetingSchema.index({ scheduleId: 1 });
zoomMeetingSchema.index({ courseId: 1 });
zoomMeetingSchema.index({ status: 1 });

module.exports = mongoose.model('ZoomMeeting', zoomMeetingSchema);