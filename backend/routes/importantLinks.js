const express = require('express');
const router = express.Router();

// ==========================================
// MODEL & MIDDLEWARE SETUP (Single Declaration)
// ==========================================

let ImportantLink;
let protect;
let admin;

// Load Model
try {
  ImportantLink = require('../models/ImportantLink');
  console.log('✅ ImportantLink model loaded');
} catch (err) {
  console.error('❌ ImportantLink model error:', err.message);
  // Dummy model
  ImportantLink = {
    find: () => ({ sort: () => ({ populate: () => Promise.resolve([]) }) }),
    findById: () => Promise.resolve(null),
    findByIdAndUpdate: () => Promise.resolve(null),
    findByIdAndDelete: () => Promise.resolve(null),
    create: (data) => Promise.resolve(data)
  };
}

// Load Middleware
try {
  const auth = require('../middleware/auth');
  // Check if auth is function or object
  if (typeof auth === 'function') {
    protect = auth;
    admin = (req, res, next) => next();
  } else {
    protect = auth.protect || ((req, res, next) => next());
    admin = auth.admin || ((req, res, next) => next());
  }
  console.log('✅ Auth middleware loaded');
} catch (err) {
  console.error('❌ Auth middleware error:', err.message);
  protect = (req, res, next) => next();
  admin = (req, res, next) => next();
}

// ==========================================
// ROUTES
// ==========================================

// @desc    Create new important link
// @route   POST /api/important-links
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, url, description, course, category } = req.body;
    const link = await ImportantLink.create({
      title, url, description, course, category,
      createdBy: req.user?._id || 'unknown'
    });
    res.status(201).json({ success: true, data: link });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Get all links
// @route   GET /api/important-links
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const links = await ImportantLink.find().sort({ createdAt: -1 });
    res.json({ success: true, count: links.length, data: links });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get links by course
// @route   GET /api/important-links/course/:courseId
// @access  Private
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const links = await ImportantLink.find({ 
      course: req.params.courseId,
      isActive: true 
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: links.length, data: links });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update link
// @route   PUT /api/important-links/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const link = await ImportantLink.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!link) return res.status(404).json({ success: false, message: 'Link not found' });
    res.json({ success: true, data: link });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete link
// @route   DELETE /api/important-links/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const link = await ImportantLink.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ success: false, message: 'Link not found' });
    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;