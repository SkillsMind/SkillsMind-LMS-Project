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
  weekNumber: {
    type: Number,
    default: 1
  },
  sessionNumber: {
    type: Number,
    default: 1
  },
  batchId: {
    type: String,
    default: null
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
    default: 60
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
  
  // 🔥 FIXED: Changed from ObjectId to String
  zoomMeetingId: {
    type: String,
    default: null
  },
  isZoomEnabled: {
    type: Boolean,
    default: false
  },
  
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  
  showLinkBeforeMinutes: {
    type: Number,
    default: 15
  },
  
  classStartedAt: {
    type: Date,
    default: null
  },
  classEndedAt: {
    type: Date,
    default: null
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
  
  sessionDate: {
    type: Date,
    required: true
  },
  
  attendanceEnabled: {
    type: Boolean,
    default: true
  },
  
  minAttendancePercentage: {
    type: Number,
    default: 75
  }
}, {
  timestamps: true
});

scheduleSchema.index({ courseId: 1, sessionDate: 1 });
scheduleSchema.index({ batchId: 1 });
scheduleSchema.index({ zoomMeetingId: 1 });
scheduleSchema.index({ status: 1, sessionDate: 1 });

// Virtual for checking if class is currently live
scheduleSchema.virtual('isCurrentlyLive').get(function() {
  if (this.status !== 'ongoing' || !this.classStartedAt) return false;
  
  const now = new Date();
  const startTime = new Date(this.classStartedAt);
  const durationMs = (this.duration || 60) * 60 * 1000;
  
  return now >= startTime && now <= new Date(startTime.getTime() + durationMs);
});

// Virtual for checking if link should be visible
scheduleSchema.virtual('isLinkVisible').get(function() {
  if (!this.meetingLink || this.status === 'cancelled') return false;
  
  const now = new Date();
  const classTime = new Date(this.sessionDate);
  const [hours, minutes] = this.time.split(':');
  classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const visibleTime = new Date(classTime.getTime() - (this.showLinkBeforeMinutes * 60000));
  
  return now >= visibleTime;
});

// Method to update status based on time
scheduleSchema.methods.updateStatus = function() {
  const now = new Date();
  const classTime = new Date(this.sessionDate);
  const [hours, minutes] = this.time.split(':');
  classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const endTime = new Date(classTime.getTime() + (this.duration * 60000));
  
  if (this.status === 'cancelled') return this.status;
  
  if (now < classTime) {
    this.status = 'upcoming';
  } else if (now >= classTime && now <= endTime) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
  
  return this.status;
};

scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);