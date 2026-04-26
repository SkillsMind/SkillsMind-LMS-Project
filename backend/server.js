const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const http = require('http');        
const socketIo = require('socket.io');

// Load environment variables FIRST
dotenv.config();

// 🔥 DEBUG: Check if Cloudinary env variables are loaded
console.log('🔧 Environment Check:');
console.log('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Not Set');
console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Present' : '❌ Not Set');
console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Present' : '❌ Not Set');
console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Present' : '❌ Not Set');

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// ==========================================
// CORS - SIMPLE & WORKING
// ==========================================
const allowedOrigins = [
    'https://www.skillsmind.online',
    'https://skillsmind.online',
    'https://skillsmind-frontend-new.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Handle OPTIONS manually
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).end();
    }
    next();
});

// ==========================================
// Socket.IO
// ==========================================
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

app.set('io', io);

// --- MIDDLEWARE ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
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
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SAFE ROUTE LOADER ---
const safeRoute = (routePath, routeName) => {
    try {
        const route = require(routePath);
        console.log(`✅ ${routeName} loaded`);
        return route;
    } catch (err) {
        console.warn(`⚠️  ${routeName} disabled: ${err.message.split('\n')[0]}`);
        const dummyRouter = express.Router();
        dummyRouter.use((req, res) => {
            res.status(503).json({ success: false, message: `${routeName} unavailable` });
        });
        return dummyRouter;
    }
};

// --- ROUTES ---
app.use('/api/auth', safeRoute('./routes/auth', 'Auth'));
app.use('/api/student-profile', safeRoute('./routes/profile', 'Profile'));
app.use('/api/profile', safeRoute('./routes/profile', 'Profile'));
app.use('/api/students', safeRoute('./routes/studentRegisterRoutes', 'Students'));
app.use('/api/enroll', safeRoute('./routes/liveEnrollRoute', 'Enrollment'));
app.use('/api/courses', safeRoute('./routes/course', 'Courses'));
app.use('/api/payments', safeRoute('./routes/Paymentreceived', 'Payments'));
app.use('/api/student-dashboard', safeRoute('./routes/studentDashboard', 'Student Dashboard'));
app.use('/api/admin', safeRoute('./routes/admin', 'Admin'));
app.use('/api/assignments', safeRoute('./routes/assignmentRoutes', 'Assignments'));
app.use('/api/attendance', safeRoute('./routes/attendanceRoutes', 'Attendance'));
app.use('/api/quizzes', safeRoute('./routes/quizRoutes', 'Quizzes'));
app.use('/api/results', safeRoute('./routes/resultRoutes', 'Results'));
app.use('/api/announcements', safeRoute('./routes/announcementRoutes', 'Announcements'));
app.use('/api/settings', safeRoute('./routes/settings', 'Settings'));
app.use('/api/notes', safeRoute('./routes/notes', 'Notes'));
app.use('/api/schedules', safeRoute('./routes/schedules', 'Schedules'));
app.use('/api/zoom', safeRoute('./routes/zoom', 'Zoom'));
app.use('/api/attendance-new', safeRoute('./routes/attendance', 'Attendance New'));
app.use('/api/contact', safeRoute('./routes/contact', 'Contact'));

// Important Links
try {
    app.use('/api/important-links', require('./routes/importantLinks'));
    console.log('✅ Important Links loaded');
} catch (err) {
    app.use('/api/important-links', (req, res) => res.status(503).json({ success: false }));
}

// Notices
try {
    app.use('/api/notices', require('./routes/notices'));
    console.log('✅ Notices loaded');
} catch (err) {
    app.use('/api/notices', (req, res) => res.status(503).json({ success: false }));
}

// Jobs
try {
    app.use('/api/jobs', require('./routes/jobs'));
    console.log('✅ Jobs loaded');
} catch (err) {
    app.use('/api/jobs', (req, res) => res.status(503).json({ success: false }));
}

// AI Routes
try {
    app.use('/api/ai', require('./routes/aiAssistant'));
    console.log('✅ AI loaded');
} catch (err) {
    app.use('/api/ai', (req, res) => res.json({ success: false }));
}

try {
    app.use('/api/ai-grading', require('./routes/aiGradingRoutes'));
    console.log('✅ AI Grading loaded');
} catch (err) {
    app.use('/api/ai-grading', (req, res) => res.json({ success: false }));
}

// ==========================================
// 🔥 NEW: REFERRAL SYSTEM ROUTES 🔥
// ==========================================
try {
    const referralRoutes = require('./routes/referralRoutes');
    app.use('/api/referrals', referralRoutes);
    console.log('✅ Referral Routes loaded');
} catch (err) {
    console.warn(`⚠️ Referral Routes disabled: ${err.message}`);
    const dummyRouter = express.Router();
    dummyRouter.use((req, res) => {
        res.status(503).json({ success: false, message: 'Referral system unavailable' });
    });
    app.use('/api/referrals', dummyRouter);
}

// ==========================================
// 🔥🔥🔥 WEBINAR SYSTEM ROUTES 🔥🔥🔥
// ==========================================
try {
    const webinarRoutes = require('./routes/webinarRoutes');
    app.use('/api/webinar', webinarRoutes);
    console.log('✅ Webinar Routes loaded');
} catch (err) {
    console.warn(`⚠️ Webinar Routes disabled: ${err.message}`);
    const dummyRouter = express.Router();
    dummyRouter.use((req, res) => {
        res.status(503).json({ success: false, message: 'Webinar system unavailable' });
    });
    app.use('/api/webinar', dummyRouter);
}

// Stats API
app.get('/api/stats', async (req, res) => {
    try {
        const totalRegistered = await mongoose.connection.collection('users').countDocuments();
        const profilesBuilt = await mongoose.connection.collection('studentprofiles').countDocuments();
        res.json({ totalRegistered, profilesBuilt, successRate: 98, activeNow: Math.floor(Math.random() * 5) + 1 });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', time: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
    res.send("SkillsMind Backend Running!");
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('⚡ Client connected:', socket.id);
    
    socket.on('joinStudentRoom', (studentId) => {
        if (studentId) socket.join(`student_${studentId}`);
    });
    
    socket.on('joinCourse', (courseId) => {
        if (courseId) socket.join(`course_${courseId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Database & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Database connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
    process.exit(1);
  });