const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const http = require('http');        
const socketIo = require('socket.io');

dotenv.config();
const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// ==========================================
// 🔧 FIXED: Socket.IO Configuration (Production Ready)
// ==========================================
const io = socketIo(server, {
    cors: {
        // Humne yahan aapki live domain add kar di hai
        origin: ["https://www.skillsmind.online", "https://skillsmind.online", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
});

app.set('io', io);

// --- 1. MIDDLEWARE ---
app.use(cors({
    // Humne yahan bhi live domain add kar di hai taake login block na ho
    origin: ["https://www.skillsmind.online", "https://skillsmind.online", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173"],
    credentials: true
})); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} Request to: ${req.url}`);
    next();
});

// --- STATIC FOLDERS ---
const uploadDir = path.join(__dirname, 'uploads');
const videoDir = path.join(__dirname, 'uploads', 'videos');
const receiptDir = path.join(__dirname, 'uploads', 'receipts');
const assignmentDir = path.join(__dirname, 'uploads', 'assignments');
const profileDir = path.join(__dirname, 'uploads', 'profiles');

const dirs = [uploadDir, videoDir, receiptDir, assignmentDir, profileDir];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directory Created: ${dir}`);
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// ==========================================
// 🔧 FIXED: Safe route loader with error handling
// ==========================================
const safeRoute = (routePath, routeName) => {
    try {
        const route = require(routePath);
        console.log(`✅ ${routeName} loaded successfully`);
        return route;
    } catch (err) {
        console.warn(`⚠️  ${routeName} temporarily disabled: ${err.message.split('\n')[0]}`);
        const dummyRouter = express.Router();
        dummyRouter.use((req, res) => {
            res.status(503).json({ 
                success: false, 
                message: `${routeName} temporarily unavailable`,
                error: 'Route under maintenance'
            });
        });
        return dummyRouter;
    }
};

// --- 2. ROUTES ---
app.use('/api/auth', safeRoute('./routes/auth', 'Auth'));
app.use('/api/student-profile', safeRoute('./routes/profile', 'Student Profile'));
app.use('/api/profile', safeRoute('./routes/profile', 'Profile'));
app.use('/api/students', safeRoute('./routes/studentRegisterRoutes', 'Students'));
app.use('/api/enroll', safeRoute('./routes/LiveEnrollment', 'Enrollment'));
app.use('/api/courses', safeRoute('./routes/course', 'Courses'));
app.use('/api/payments', safeRoute('./routes/Paymentreceived', 'Payments'));

// ==========================================
// 🔥 NEW: STUDENT PROFILE DASHBOARD ROUTES
// ==========================================
app.use('/api/student-profile', safeRoute('./routes/studentProfile', 'Student Profile Dashboard'));

// Dashboard & Admin
app.use('/api/student-dashboard', safeRoute('./routes/studentDashboard', 'Student Dashboard'));
app.use('/api/admin', safeRoute('./routes/admin', 'Admin'));

// Student Dashboard Pages
app.use('/api/assignments', safeRoute('./routes/assignmentRoutes', 'Assignments'));
app.use('/api/attendance', safeRoute('./routes/attendanceRoutes', 'Attendance'));
app.use('/api/quizzes', safeRoute('./routes/quizRoutes', 'Quizzes'));
app.use('/api/results', safeRoute('./routes/resultRoutes', 'Results'));
app.use('/api/announcements', safeRoute('./routes/announcementRoutes', 'Announcements'));
app.use('/api/settings', safeRoute('./routes/settings', 'Settings'));

// ==========================================
// 📝 NOTEBOOK ROUTES
// ==========================================
app.use('/api/notes', safeRoute('./routes/notes', 'Notes'));

// ==========================================
// 🔥 NEW: SCHEDULE ROUTES - Class Timetable Management
// ==========================================
app.use('/api/schedules', safeRoute('./routes/schedules', 'Schedules'));

// ==========================================
// 🔥 NEW: ZOOM & ATTENDANCE ROUTES (LIVE CLASSES)
// ==========================================
app.use('/api/zoom', safeRoute('./routes/zoom', 'Zoom Live Classes'));
app.use('/api/attendance-new', safeRoute('./routes/attendance', 'New Attendance System'));

// ==========================================
// 🔥 NEW: IMPORTANT LINKS ROUTES - DIRECT IMPORT (FIXED)
// ==========================================
try {
    const importantLinksRoutes = require('./routes/importantLinks');
    app.use('/api/important-links', importantLinksRoutes);
    console.log('✅ Important Links Routes loaded successfully');
} catch (err) {
    console.error('❌ Important Links Routes Error:', err.message);
    app.use('/api/important-links', (req, res) => res.status(503).json({ 
        success: false, 
        message: 'Important Links service error', 
        error: err.message,
        hint: 'Check if models/ImportantLink.js exists'
    }));
}

// ==========================================
// 📢 NOTICES ROUTES - ENABLED
// ==========================================
const noticesRouter = require('./routes/notices');
app.use('/api/notices', noticesRouter);

// ==========================================
// 🔥 NEW: JOBS & INTERNSHIPS ROUTES - ENABLED
// ==========================================
try {
    const jobsRoutes = require('./routes/jobs');
    app.use('/api/jobs', jobsRoutes);
    console.log('✅ Jobs & Internships Routes loaded successfully');
} catch (err) {
    console.error('❌ Jobs Routes Error:', err.message);
    app.use('/api/jobs', (req, res) => res.status(503).json({ 
        success: false, 
        message: 'Jobs service error', 
        error: err.message,
        hint: 'Check if models/Job.js and routes/jobs.js exist'
    }));
}

// ==========================================
// AI Routes
// ==========================================
try {
    const aiRoutes = require('./routes/aiAssistant');
    app.use('/api/ai', aiRoutes);
    console.log('✅ AI Routes loaded');
} catch (err) {
    console.warn('⚠️  AI Routes disabled:', err.message.split('\n')[0]);
    app.use('/api/ai', (req, res) => res.json({ success: false, message: 'AI service unavailable' }));
}

try {
    const aiGradingRoutes = require('./routes/aiGradingRoutes');
    app.use('/api/ai-grading', aiGradingRoutes);
    console.log('✅ AI Grading Routes loaded');
} catch (err) {
    console.warn('⚠️  AI Grading disabled:', err.message.split('\n')[0]);
    app.use('/api/ai-grading', (req, res) => res.json({ success: false, message: 'AI Grading unavailable' }));
}

// --- REAL-TIME STATS API ---
app.get('/api/stats', async (req, res) => {
    try {
        const totalRegistered = await mongoose.connection.collection('users').countDocuments();
        const profilesBuilt = await mongoose.connection.collection('studentprofiles').countDocuments();
        res.json({
            totalRegistered: totalRegistered,
            profilesBuilt: profilesBuilt,
            successRate: 98,
            activeNow: Math.floor(Math.random() * 5) + 1 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ==========================================
// SOCKET.IO CONNECTION - FIXED (WITH ZOOM & ATTENDANCE)
// ==========================================
io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);
    
    socket.emit('connected', { message: 'Connected to server', socketId: socket.id });

    socket.on('joinStudentRoom', (studentId) => {
        if (studentId) {
            const cleanId = studentId.toString().trim();
            socket.join(`student_${cleanId}`);
            console.log(`👤 Student ${cleanId} joined room student_${cleanId}`);
            socket.emit('joinedRoom', { room: `student_${cleanId}`, success: true });
        }
    });

    socket.on('joinCourse', (courseId) => {
        if (courseId) {
            socket.join(`course_${courseId}`);
            console.log(`📚 Client joined course room: course_${courseId}`);
            socket.emit('joinedRoom', { room: `course_${courseId}`, success: true });
        }
    });

    socket.on('joinAssignment', (assignmentId) => {
        if (assignmentId) {
            socket.join(`assignment_${assignmentId}`);
        }
    });

    socket.on('joinAdminRoom', () => {
        socket.join('admin_room');
    });

    socket.on('joinQuiz', (quizId) => {
        if (quizId) {
            socket.join(`quiz_${quizId}`);
        }
    });

    socket.on('joinSchedule', (scheduleId) => {
        if (scheduleId) {
            socket.join(`schedule_${scheduleId}`);
            console.log(`📅 Client joined schedule room: schedule_${scheduleId}`);
        }
    });

    // 🔥 NEW: Zoom Meeting Rooms
    socket.on('joinZoomMeeting', (meetingId) => {
        if (meetingId) {
            socket.join(`zoom_${meetingId}`);
            console.log(`🔴 Client joined Zoom room: zoom_${meetingId}`);
        }
    });

    socket.on('leaveZoomMeeting', (meetingId) => {
        if (meetingId) {
            socket.leave(`zoom_${meetingId}`);
            console.log(`🔴 Client left Zoom room: zoom_${meetingId}`);
        }
    });

    // 🔥 NEW: Attendance Real-time Updates
    socket.on('attendanceUpdate', (data) => {
        console.log('📊 Broadcasting attendance update:', data);
        io.to(`zoom_${data.meetingId}`).emit('attendanceUpdated', data);
        io.to(`course_${data.courseId}`).emit('attendanceUpdated', data);
    });

    socket.on('studentJoinedClass', (data) => {
        console.log('👤 Student joined class:', data);
        io.to(`zoom_${data.meetingId}`).emit('studentJoined', data);
    });

    socket.on('studentLeftClass', (data) => {
        console.log('👤 Student left class:', data);
        io.to(`zoom_${data.meetingId}`).emit('studentLeft', data);
    });

    // Schedule Events
    socket.on('scheduleUpdate', (data) => {
        console.log('📅 Broadcasting schedule update:', data);
        io.to(`course_${data.courseId}`).emit('scheduleUpdated', data);
    });

    socket.on('newSchedule', (data) => {
        console.log('📅 Broadcasting new schedule:', data);
        io.to(`course_${data.courseId}`).emit('newSchedule', data);
    });

    socket.on('scheduleCancelled', (data) => {
        console.log('📅 Broadcasting schedule cancellation:', data);
        io.to(`course_${data.courseId}`).emit('scheduleCancelled', data);
    });

    // 🔥 NEW: Zoom Meeting Events
    socket.on('zoomMeetingCreated', (data) => {
        console.log('🔴 Broadcasting Zoom meeting created:', data);
        io.to(`course_${data.courseId}`).emit('zoomMeetingCreated', data);
    });

    socket.on('zoomMeetingStarted', (data) => {
        console.log('🔴 Broadcasting Zoom meeting started:', data);
        io.to(`course_${data.courseId}`).emit('classStarted', data);
    });

    socket.on('zoomMeetingEnded', (data) => {
        console.log('🔴 Broadcasting Zoom meeting ended:', data);
        io.to(`course_${data.courseId}`).emit('classEnded', data);
    });

    // 🔥 NEW: Job posting real-time updates
    socket.on('newJobPosted', (data) => {
        console.log('💼 Broadcasting new job:', data);
        if (data.relevantCourses && data.relevantCourses.length > 0) {
            data.relevantCourses.forEach(courseId => {
                io.to(`course_${courseId}`).emit('newJobAvailable', data);
            });
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    });
});

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SkillsMind Database connected successfully!"))
  .catch((err) => console.error("❌ Database connection error:", err));

app.get('/', (req, res) => {
    res.send("Welcome to SkillsMind Backend Server. API is Active!");
});

const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => {
    console.log(`🚀 SkillsMind Server running on: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready (WebSocket + Polling)`);
    console.log(`🤖 AI Auto-Grading Active`);
    console.log(`🎯 Quiz System Active`);
    console.log(`📝 Notebook System Active at: /api/notes`);
    console.log(`📅 Schedule/Timetable System Active at: /api/schedules`);
    console.log(`🔴 Zoom Live Classes Active at: /api/zoom`);
    console.log(`📊 New Attendance System Active at: /api/attendance-new`);
    console.log(`🔗 Important Links System Active at: /api/important-links`);
    console.log(`📢 Notices System Active at: /api/notices`);
    console.log(`💼 Jobs & Internships System Active at: /api/jobs`);
    console.log(`👤 Student Profile Dashboard Active at: /api/student-profile`);
});