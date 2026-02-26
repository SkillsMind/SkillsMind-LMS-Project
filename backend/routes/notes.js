const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

// ==========================================
// GET TRASH NOTES - PEHLE HONA CHAHIYE
// ==========================================
router.get('/trash', protect, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id, isDeleted: true })
            .sort({ updatedAt: -1 });
        res.json({ success: true, count: notes.length, data: notes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// GET ALL NOTES
// ==========================================
router.get('/', protect, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id, isDeleted: false })
            .sort({ updatedAt: -1 });
        res.json({ success: true, count: notes.length, data: notes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// CREATE NOTE
// ==========================================
router.post('/', protect, async (req, res) => {
    try {
        const { title, content, courseId, courseCode, courseName, tags } = req.body;
        
        const newNote = new Note({
            userId: req.user.id,
            title: title || 'Untitled Note',
            content: content || '',
            courseId: courseId || '',
            courseCode: courseCode || '',
            courseName: courseName || '',
            tags: tags || [],
            isPinned: false,
            isFavorite: false,
            isDeleted: false,
            wordCount: content ? content.split(/\s+/).filter(w => w.length > 0).length : 0
        });
        
        await newNote.save();
        res.status(201).json({ success: true, data: newNote });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// GET SINGLE NOTE - /:id BAAD MEIN
// ==========================================
router.get('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// UPDATE NOTE
// ==========================================
router.put('/:id', protect, async (req, res) => {
    try {
        const updates = req.body;
        updates.updatedAt = Date.now();
        
        if (updates.content) {
            updates.wordCount = updates.content.split(/\s+/).filter(w => w.length > 0).length;
        }
        
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true }
        );
        
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// TOGGLE PIN
// ==========================================
router.put('/:id/pin', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        
        note.isPinned = !note.isPinned;
        note.updatedAt = Date.now();
        await note.save();
        
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// TOGGLE FAVORITE
// ==========================================
router.put('/:id/favorite', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        
        note.isFavorite = !note.isFavorite;
        note.updatedAt = Date.now();
        await note.save();
        
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// MOVE TO TRASH
// ==========================================
router.put('/:id/trash', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        
        note.isDeleted = true;
        note.updatedAt = Date.now();
        await note.save();
        
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// RESTORE FROM TRASH
// ==========================================
router.put('/:id/restore', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        
        note.isDeleted = false;
        note.updatedAt = Date.now();
        await note.save();
        
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// DELETE PERMANENTLY
// ==========================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        res.json({ success: true, message: 'Note deleted permanently' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;