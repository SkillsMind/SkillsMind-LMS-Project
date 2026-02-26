const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['full-time', 'part-time', 'internship', 'contract', 'remote'],
        required: true
    },
    location: { type: String },
    salary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'PKR' },
        period: { type: String, default: 'monthly' }
    },
    requirements: [String],
    skills: [String],
    experience: {
        min: { type: Number, default: 0 },
        max: Number
    },
    eligibleCourses: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course' 
    }],
    applicationLink: String,
    applicationEmail: String,
    deadline: Date,
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobOpportunity', jobSchema);