const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Job', 'Internship'],
    default: 'Job',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  relevantCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'At least one course must be selected']
  }],
  location: {
    type: String,
    trim: true,
    default: 'Not specified'
  },
  salary: {
    type: String,
    trim: true,
    default: 'Not disclosed'
  },
  applicationUrl: {
    type: String,
    trim: true,
    required: [true, 'Application URL is required']
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
jobSchema.index({ relevantCourses: 1, isActive: 1, deadline: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ deadline: 1 });

module.exports = mongoose.model('Job', jobSchema);