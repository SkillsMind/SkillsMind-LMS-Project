const express = require('express');
const router = express.Router();
const WebinarRegistration = require('../models/WebinarRegistration');
const WebinarSettings = require('../models/WebinarSettings');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { Resend } = require('resend');

// ==========================================
// RESEND EMAIL CONFIGURATION
// ==========================================
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send webinar confirmation email via Resend
const sendWebinarConfirmationEmail = async (toEmail, fullName, webinarTitle, webinarDate, webinarTime, meetingLink) => {
    
    const formattedDate = new Date(webinarDate).toLocaleDateString('en-PK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'SkillsMind <noreply@skillsmind.online>',
            to: [toEmail],
            subject: `Webinar Registration Confirmation - ${webinarTitle} | SkillsMind`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar Registration Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fb;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #0a0c27 0%, #1a1a3e 100%);
            padding: 32px 28px;
            text-align: center;
            border-bottom: 4px solid #DC2626;
        }
        .logo {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 12px;
        }
        .logo span {
            color: #DC2626;
        }
        .header h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 600;
            margin: 8px 0 4px;
        }
        .header p {
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            margin: 0;
        }
        .content {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 12px;
        }
        .greeting span {
            color: #DC2626;
        }
        .message {
            color: #334155;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.6;
        }
        .webinar-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        .webinar-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 2px solid #DC2626;
            display: inline-block;
        }
        .info-row {
            display: flex;
            margin-bottom: 12px;
            align-items: flex-start;
        }
        .info-label {
            width: 70px;
            font-weight: 600;
            color: #475569;
            font-size: 13px;
        }
        .info-value {
            flex: 1;
            color: #1e293b;
            font-size: 14px;
        }
        .meeting-box {
            background: linear-gradient(135deg, #fef2f2, #fff5f5);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #fee2e2;
        }
        .meeting-link {
            display: inline-block;
            background: #DC2626;
            color: white;
            padding: 12px 28px;
            text-decoration: none;
            border-radius: 40px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 8px;
        }
        .meeting-link:hover {
            background: #b91c1c;
        }
        .tips {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
        }
        .tips h4 {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10px;
        }
        .tips ul {
            margin: 0;
            padding-left: 20px;
        }
        .tips li {
            font-size: 12px;
            color: #475569;
            margin-bottom: 6px;
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 11px;
            color: #94a3b8;
            margin: 6px 0;
        }
        .footer .brand {
            font-weight: 700;
            color: #DC2626;
            font-size: 12px;
        }
        .social-links {
            margin: 12px 0 8px;
        }
        .social-links a {
            color: #DC2626;
            text-decoration: none;
            font-size: 12px;
            margin: 0 10px;
        }
        @media (max-width: 600px) {
            .info-row {
                flex-direction: column;
            }
            .info-label {
                width: auto;
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Skills<span>Mind</span></div>
            <h1>Registration Confirmed</h1>
            <p>You are officially registered for the webinar</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear <span>${fullName}</span>,
            </div>
            
            <div class="message">
                Thank you for registering for our webinar. We are excited to have you join us for this learning session.
            </div>
            
            <div class="webinar-card">
                <div class="webinar-title">${webinarTitle}</div>
                
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${formattedDate}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Time:</div>
                    <div class="info-value">${webinarTime} (Pakistan Time)</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Duration:</div>
                    <div class="info-value">2 Hours including Q&A</div>
                </div>
                ${meetingLink ? `
                <div class="meeting-box">
                    <div style="font-weight: 600; margin-bottom: 8px;">Join Webinar</div>
                    <a href="${meetingLink}" class="meeting-link" target="_blank">Click Here to Join Webinar</a>
                </div>
                ` : ''}
            </div>
            
            <div class="tips">
                <h4>Tips for a Great Experience</h4>
                <ul>
                    <li>Join 10 minutes before the scheduled time</li>
                    <li>Use a stable internet connection for the best experience</li>
                    <li>Keep your questions ready for the Q&A session</li>
                    <li>Have a notebook handy to take notes</li>
                </ul>
            </div>
            
            <div class="tips">
                <h4>What You Will Learn</h4>
                <ul>
                    <li>Practical skills you can apply immediately</li>
                    <li>Industry best practices and insights</li>
                    <li>Tips from expert instructors</li>
                    <li>Certificate of participation after completion</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="https://www.instagram.com/skillsmind_official/">Instagram</a>
                <a href="https://whatsapp.com/channel/0029Vb8Gwwi2Jl89rRlgkr1E">WhatsApp Channel</a>
                <a href="https://www.skillsmind.online">Website</a>
            </div>
            <p class="brand">SkillsMind - Pakistan's Premier Learning Platform</p>
            <p>Empowering youth with industry-leading digital skills</p>
            <p>&copy; 2026 SkillsMind. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `
        });
        
        if (error) {
            console.error('Resend email error:', error);
            return false;
        }
        
        console.log('Resend email sent successfully to:', toEmail);
        return true;
    } catch (error) {
        console.error('Resend email error:', error);
        return false;
    }
};

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
// 4. POST - Register for webinar with Resend Email
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
        
        // Send confirmation email via Resend
        await sendWebinarConfirmationEmail(
            email,
            fullName,
            webinar.title,
            webinar.startDate,
            webinar.time,
            webinar.meetingLink
        );
        
        res.json({ 
            success: true, 
            message: 'Registration successful! Please check your email for webinar details.' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 5. POST - Save webinar settings (Admin)
// ==========================================
router.post('/save', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const { 
            courseId, courseName, isActive, title, description, 
            startDate, endDate, time, topics, meetingLink, 
            instructor, certificateProvided, recordingAvailable,
            image
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
            webinar.image = image || '';
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
                image: image || ''
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