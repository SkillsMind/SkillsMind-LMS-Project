const express = require('express');
const router = express.Router();

// FIX: Yahan StudentRegister hona chahiye kyunke aapki model file ka naam yehi hai
const Student = require('../models/StudentRegister'); 

// 1. Saare Registration Records lane ke liye (SkillsMind Admin)
router.get('/all-registrations', async (req, res) => {
    try {
        // Database se saare students ka data nikalna
        const students = await Student.find().sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Error fetching data", error: err });
    }
});

// 2. Record Delete karne ke liye
router.delete('/delete/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting record" });
    }
});

module.exports = router;