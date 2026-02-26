const express = require('express');
const router = express.Router();
const LiveEnrollment = require('../models/LiveEnrollment');

// --- 1. GET: Saara Data Fetch Karne ke liye ---
// Frontend isi raste (/api/enroll/all) se data mangwaye ga
router.get('/all', async (req, res) => {
    try {
        // Database se saare 52 documents mangwana aur latest ko upar rakhna
        const enrollments = await LiveEnrollment.find().sort({ createdAt: -1 });
        res.status(200).json(enrollments);
    } catch (error) {
        console.error("SkillsMind Fetch Error:", error);
        res.status(500).json({ success: false, message: "Data nahi mil raha" });
    }
});

// --- 2. POST: Student Data Save Karne ke liye (Existing) ---
router.post('/live-register', async (req, res) => {
    try {
        const { fullName, email, city, phone, address, dob, gender, course, profilePic } = req.body;

        const newEnrollment = new LiveEnrollment({
            fullName,
            email,
            city,
            phone,
            address,
            dob,
            gender,
            course,
            profilePic // Picture field bhi add kar di hai
        });

        const savedData = await newEnrollment.save();
        
        res.status(201).json({
            success: true,
            message: "Data saved in SkillsMind DB successfully",
            data: savedData
        });
    } catch (error) {
        console.error("DB Save Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// --- 3. DELETE: Record Delete Karne ke liye ---
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedUser = await LiveEnrollment.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "Student not found" });
        
        res.status(200).json({ success: true, message: "Record Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete Error", error });
    }
});

module.exports = router;