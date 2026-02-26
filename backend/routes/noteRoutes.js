const express = require('express');
const router = express.Router();
const StudentNote = require('../models/StudentNote'); // Model pehle banani hogi
const auth = require('../middleware/auth');

// GET: Student ki sari notes
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { category } = req.query;
        const query = { studentId: req.params.studentId };
        
        if (category && category !== 'all') {
            query.category = category;
        }

        const notes = await StudentNote.find(query)
            .populate('courseId', 'title')
            .sort({ isPinned: -1, lastEditedAt: -1 });

        res.json({ success: true, notes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST: New note create
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, courseId, category, color, tags } = req.body;
        
        const note = new StudentNote({
            studentId: req.user.id,
            courseId,
            title,
            content,
            category: category || 'personal',
            color: color || '#ffffff',
            tags: tags || []
        });

        await note.save();
        res.json({ success: true, note });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT: Note update
router.put('/:noteId', auth, async (req, res) => {
    try {
        const note = await StudentNote.findOneAndUpdate(
            { _id: req.params.noteId, studentId: req.user.id },
            { ...req.body, lastEditedAt: new Date() },
            { new: true }
        );
        
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }
        
        res.json({ success: true, note });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE: Note delete
router.delete('/:noteId', auth, async (req, res) => {
    try {
        await StudentNote.findOneAndDelete({
            _id: req.params.noteId,
            studentId: req.user.id
        });
        
        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;