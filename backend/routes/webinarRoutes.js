const express = require('express');
const router = express.Router();
const WebinarRegistration = require('../models/WebinarRegistration');
const WebinarSettings = require('../models/WebinarSettings');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ==========================================
// 1. GET - All active webinars (Student Page)
// ==========================================
router.get('/active/all', async (req, res) => {
    try {
        const webinars = await WebinarSettings.find({ 
            isActive: true
        }).sort({ startDate: 1 });
        
        res.json({ success: true, webinars: webinars });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 2. GET - Active webinar for specific course
// ==========================================
router.get('/active/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const webinar = await WebinarSettings.findOne({ courseId: courseId, isActive: true });
        
        if (!webinar) {
            return res.json({ success: true, hasWebinar: false });
        }
        
        res.json({ success: true, hasWebinar: true, webinar });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 3. GET - Webinar for specific course (with registrations)
// ==========================================
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const webinar = await WebinarSettings.findOne({ courseId });
        
        if (!webinar) {
            return res.json({ success: true, webinar: null });
        }
        
        const registrations = await WebinarRegistration.find({ webinarId: webinar._id }).sort({ registeredAt: -1 });
        
        res.json({ 
            success: true, 
            webinar: {
                ...webinar.toObject(),
                registrations
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 4. POST - Register for webinar
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { 
            webinarId, courseId, courseName, 
            fullName, email, phone, city,
            age, gender, dateOfBirth, qualification, profession
        } = req.body;
        
        if (!fullName || !email || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill all required fields' 
            });
        }
        
        let webinar;
        if (webinarId) {
            webinar = await WebinarSettings.findById(webinarId);
        } else if (courseId) {
            webinar = await WebinarSettings.findOne({ courseId, isActive: true });
        }
        
        if (!webinar) {
            return res.status(400).json({ 
                success: false, 
                message: 'No active webinar for this course' 
            });
        }
        
        const existing = await WebinarRegistration.findOne({ 
            webinarId: webinar._id,
            email: email.toLowerCase() 
        });
        
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already registered for this webinar' 
            });
        }
        
        const registration = new WebinarRegistration({
            webinarId: webinar._id,
            courseId: courseId || webinar.courseId,
            courseName: courseName || webinar.courseName,
            fullName,
            email: email.toLowerCase(),
            phone,
            city: city || '',
            age: age || null,
            gender: gender || '',
            dateOfBirth: dateOfBirth || null,
            qualification: qualification || '',
            profession: profession || '',
            registeredAt: new Date(),
            ipAddress: req.ip || req.connection.remoteAddress
        });
        
        await registration.save();
        
        res.json({ 
            success: true, 
            message: 'Registration successful! We will send you the webinar link.' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 5. POST - Save webinar settings (Admin) - ✅ FIXED WITH IMAGE
// ==========================================
router.post('/save', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // ✅ ADDED 'image' in destructuring
        const { 
            courseId, courseName, isActive, title, description, 
            startDate, endDate, time, topics, meetingLink, 
            instructor, certificateProvided, recordingAvailable,
            image  // ✅ YEH LINE ADD KI HAI
        } = req.body;
        
        let webinar = await WebinarSettings.findOne({ courseId });
        
        if (webinar) {
            webinar.isActive = isActive;
            webinar.title = title;
            webinar.description = description;
            webinar.startDate = startDate;
            webinar.endDate = endDate;
            webinar.time = time;
            webinar.topics = topics;
            webinar.meetingLink = meetingLink;
            webinar.instructor = instructor;
            webinar.certificateProvided = certificateProvided;
            webinar.recordingAvailable = recordingAvailable;
            webinar.image = image || '';  // ✅ YEH LINE ADD KI HAI
            webinar.updatedAt = new Date();
        } else {
            webinar = new WebinarSettings({
                courseId,
                courseName,
                isActive,
                title,
                description,
                startDate,
                endDate,
                time,
                topics,
                meetingLink,
                instructor,
                certificateProvided,
                recordingAvailable,
                image: image || ''  // ✅ YEH LINE ADD KI HAI
            });
        }
        
        await webinar.save();
        
        res.json({ success: true, webinar });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 6. GET - All webinars (Admin) WITH REGISTRATIONS
// ==========================================
router.get('/all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const webinars = await WebinarSettings.find().sort({ createdAt: -1 });
        
        const webinarsWithRegistrations = await Promise.all(webinars.map(async (webinar) => {
            const registrations = await WebinarRegistration.find({ webinarId: webinar._id }).sort({ registeredAt: -1 });
            return {
                ...webinar.toObject(),
                registrations
            };
        }));
        
        res.json({ success: true, webinars: webinarsWithRegistrations });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 7. DELETE - Delete registration
// ==========================================
router.delete('/registration/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        await WebinarRegistration.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Registration deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 8. DELETE - Delete entire webinar
// ==========================================
router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        await WebinarRegistration.deleteMany({ webinarId: req.params.id });
        await WebinarSettings.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: 'Webinar deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;