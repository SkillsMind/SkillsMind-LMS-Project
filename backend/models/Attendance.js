const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Student Info
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Class Info
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  zoomMeetingId: {
    type: String,
    default: ''
  },
  
  // Attendance Status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'not_marked'],
    default: 'not_marked'  // 🔥 Changed: Default is not_marked until student joins
  },
  
  // Time Tracking (CRITICAL for anti-cheating)
  joinedAt: {
    type: Date,
    default: null
  },
  leftAt: {
    type: Date,
    default: null
  },
  lastPingAt: {
    type: Date,
    default: null
  },
  
  // Duration tracking
  totalDuration: {
    type: Number,
    default: 0
  },
  
  // Join/Leave history (for detailed tracking)
  sessionHistory: [{
    action: {
      type: String,
      enum: ['join', 'leave', 'rejoin']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number,
      default: 0
    }
  }],
  
  // Class scheduled time (for reference)
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  
  // Auto-calculated fields
  calculatedAt: {
    type: Date,
    default: null
  },
  
  // Manual override by admin
  manualOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    overriddenAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      default: ''
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 🔥 NEW: Track when attendance was first marked (when student joined)
  firstJoinedAt: {
    type: Date,
    default: null
  }
});

// 🔥 FIXED: Compound index - one attendance record per student per schedule
// Remove date from index since scheduledDate is already there
attendanceSchema.index({ studentId: 1, scheduleId: 1 }, { unique: true });
attendanceSchema.index({ courseId: 1, scheduledDate: -1 });
attendanceSchema.index({ studentId: 1, courseId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);