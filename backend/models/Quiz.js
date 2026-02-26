const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'truefalse', 'multiple'],
    default: 'mcq'
  },
  options: [{
    type: String,
    required: true
  }],
  correctOption: {
    type: Number,
    required: true
  },
  marks: {
    type: Number,
    default: 10
  },
  explanation: {
    type: String,
    default: ''
  }
});

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  marksObtained: {
    type: Number,
    default: 0
  }
});

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  obtainedMarks: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isGraded: {
    type: Boolean,
    default: true
  }
});

const quizSchema = new mongoose.Schema({
  quizNumber: {
    type: String,
    unique: true,
    sparse: true,  // 🔥 Allows null/undefined values without conflict
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  totalMarks: {
    type: Number,
    default: 0
  },
  passingMarks: {
    type: Number,
    default: 50
  },
  duration: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'completed'],
    default: 'draft'
  },
  submissions: [submissionSchema],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔥 FIXED: Pre-save hook - Only calculate totalMarks, DON'T generate quizNumber here
// quizNumber will be generated in Routes for better control
quizSchema.pre('save', async function() {
  // Calculate total marks from questions
  this.totalMarks = this.questions.reduce((acc, q) => acc + (q.marks || 10), 0);
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Quiz', quizSchema);