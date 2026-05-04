const mongoose = require('mongoose');

const helpingMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'image', 'video', 'other'],
    default: 'pdf'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  lectureTopic: {
    type: String,
    trim: true,
    maxlength: [200, 'Lecture topic cannot exceed 200 characters']
  },
  weekNumber: {
    type: Number,
    min: 1,
    max: 52
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

helpingMaterialSchema.index({ course: 1, createdAt: -1 });
helpingMaterialSchema.index({ isActive: 1 });
helpingMaterialSchema.index({ fileType: 1 });

module.exports = mongoose.model('HelpingMaterial', helpingMaterialSchema);