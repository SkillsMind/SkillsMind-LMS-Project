const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: String, company: String, type: String, description: String,
  requirements: [String], skills: [String], relevantCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  location: String, salary: String, applicationUrl: String, deadline: Date,
  isActive: { type: Boolean, default: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Job', schema);