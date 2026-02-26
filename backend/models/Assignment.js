const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['submitted', 'late', 'graded'], 
    default: 'submitted' 
  },
  obtainedMarks: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  gradedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // 🔥 AI GRADING FIELDS (ENHANCED)
  aiGraded: { type: Boolean, default: false },
  aiConfidence: { type: Number, default: 0 },
  aiFeedback: { type: String, default: '' },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  requirementAnalysis: {
    met: [{ type: String }],
    partiallyMet: [{ type: String }],
    notMet: [{ type: String }]
  },
  filesProcessed: [{
    filename: String,
    type: String,
    size: String,
    pages: Number
  }],
  reGraded: { type: Boolean, default: false },
  reGradedAt: { type: Date },
  
  manualOverride: {
    marks: Number,
    feedback: String,
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: Date,
    reason: String,
    previousAiGrade: {
      marks: Number,
      feedback: String,
      confidence: Number
    }
  }
});

const assignmentSchema = new mongoose.Schema({
  assignmentNo: { 
    type: String, 
    unique: true,
    index: true
  },
  courseAssignmentNo: {
    type: Number,
    required: false,
    index: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true,
    index: true
  },
  courseName: { 
    type: String, 
    required: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dueDate: { 
    type: Date, 
    required: true,
    index: true
  },
  totalMarks: { 
    type: Number, 
    default: 100,
    min: 1,
    max: 1000
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'overdue'], 
    default: 'active',
    index: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  submissions: [submissionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // 🔥 AI FIELDS (ENHANCED)
  aiGradingEnabled: { type: Boolean, default: true },
  rubric: { type: String, default: '' },
  generatedBy: {
    type: String,
    enum: ['MANUAL', 'AI'],
    default: 'MANUAL'
  },
  aiConfig: {
    autoGrade: { type: Boolean, default: false },
    confidenceThreshold: { type: Number, default: 70 },
    notifyOnComplete: { type: Boolean, default: true }
  }
});

// Pre-save hooks remain same...
assignmentSchema.pre('save', async function() {
  if (!this.assignmentNo) {
    try {
      const count = await mongoose.model('Assignment').countDocuments();
      this.assignmentNo = `ASM-${String(count + 1).padStart(4, '0')}`;
    } catch (err) {
      console.error('Error generating assignment number:', err);
      this.assignmentNo = `ASM-${Date.now()}`;
    }
  }
  
  if (!this.courseAssignmentNo) {
    try {
      const courseCount = await mongoose.model('Assignment').countDocuments({
        courseId: this.courseId,
        createdAt: { $lt: this.createdAt || new Date() }
      });
      this.courseAssignmentNo = courseCount + 1;
    } catch (err) {
      console.error('Error generating course assignment number:', err);
      this.courseAssignmentNo = 1;
    }
  }
  
  if (this.dueDate < new Date() && this.status === 'active') {
    this.status = 'overdue';
  }
  
  this.updatedAt = new Date();
});

assignmentSchema.index({ courseId: 1, status: 1 });
assignmentSchema.index({ courseId: 1, courseAssignmentNo: 1 });
assignmentSchema.index({ 'submissions.studentId': 1 });
assignmentSchema.index({ 'submissions.status': 1 });
assignmentSchema.index({ 'submissions.aiGraded': 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);