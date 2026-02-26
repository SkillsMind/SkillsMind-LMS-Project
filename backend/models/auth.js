const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/auth/me - Current user ka data
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpires');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                _id: user._id.toString(),
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic,
                enrolledCourses: user.enrolledCourses.map(id => id.toString())
            }
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;