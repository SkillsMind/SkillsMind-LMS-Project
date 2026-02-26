const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  company: { 
    type: String, 
    required: true,
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['Job', 'Internship'],
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  requirements: [{ 
    type: String 
  }],
  skills: [{ 
    type: String 
  }],
  relevantCourses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  location: { 
    type: String,
    default: 'Not specified' 
  },
  salary: { 
    type: String,
    default: 'Not disclosed' 
  },
  applicationUrl: { 
    type: String,
    default: '' 
  },
  deadline: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  postedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

jobListingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

jobListingSchema.index({ relevantCourses: 1, isActive: 1, deadline: 1 });

module.exports = mongoose.model('JobListing', jobListingSchema);