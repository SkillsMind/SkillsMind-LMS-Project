const mongoose = require('mongoose');

const importantLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 🔥 YEH LINE BAHUT ZAROORI HAI!
module.exports = mongoose.model('ImportantLink', importantLinkSchema);