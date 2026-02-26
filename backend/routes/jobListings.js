const express = require('express');
const router = express.Router();
const JobListing = require('../models/JobListing');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      title, company, type, description, requirements,
      skills, relevantCourses, location, salary, applicationUrl, deadline
    } = req.body;

    const job = await JobListing.create({
      title,
      company,
      type,
      description,
      requirements: requirements || [],
      skills: skills || [],
      relevantCourses: relevantCourses || [],
      location,
      salary,
      applicationUrl,
      deadline,
      postedBy: req.user._id
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const jobs = await JobListing.find()
      .populate('relevantCourses', 'name')
      .populate('postedBy', 'name')
      .sort({ postedAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/student/my-jobs', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    const courseIds = student.enrolledCourses ? student.enrolledCourses.map(c => c._id) : [];
    const jobs = await JobListing.find({
      relevantCourses: { $in: courseIds },
      isActive: true,
      deadline: { $gt: new Date() }
    }).sort({ postedAt: -1 }).limit(50);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/student/by-type/:type', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).populate('enrolledCourses');
    const courseIds = student.enrolledCourses ? student.enrolledCourses.map(c => c._id) : [];
    const jobs = await JobListing.find({
      type: req.params.type,
      relevantCourses: { $in: courseIds },
      isActive: true,
      deadline: { $gt: new Date() }
    }).sort({ postedAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const job = await JobListing.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const job = await JobListing.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;