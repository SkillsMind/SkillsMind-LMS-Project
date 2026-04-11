const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Course = require('../models/Course');
const fs = require('fs');

// --- SKILLSMIND MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = 'uploads/';
        if (file.fieldname === 'instructorIntroVideo' || file.fieldname === 'courseVideo') {
            dest = 'uploads/videos/';
        }
        
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, 'SkillsMind-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('SkillsMind: Only Images and Videos are allowed!'), false);
        }
    }
});

// ==========================================
// 🔥 SPECIFIC ROUTES FIRST (Pehle yeh chalenge)
// ==========================================

// GET /api/courses/for-notebook
router.get('/for-notebook', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false })
            .select('_id title category')
            .sort({ title: 1 });
        
        const formattedCourses = courses.map(c => ({
            _id: c._id,
            code: c.category ? c.category.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100) : 'GEN' + Math.floor(Math.random() * 100),
            name: c.title,
            category: c.category
        }));

        res.json({
            success: true,
            count: formattedCourses.length,
            data: formattedCourses
        });
    } catch (err) {
        console.error("Courses for notebook error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/courses/for-assignments
router.get('/for-assignments', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false })
            .select('_id title category enrolledStudentIds')
            .sort({ title: 1 });

        res.json({
            success: true,
            courses: courses.map(c => ({
                _id: c._id,
                title: c.title,
                category: c.category,
                enrolledCount: c.enrolledStudentIds?.length || 0
            }))
        });
    } catch (err) {
        console.error("Courses for assignments error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/courses/simple/list
router.get('/simple/list', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false })
            .select('_id title category enrolledStudentIds')
            .sort({ title: 1 });
        
        res.json({
            success: true,
            courses: courses.map(c => ({
                _id: c._id,
                title: c.title,
                category: c.category,
                enrolledCount: c.enrolledStudentIds?.length || 0
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 GET ALL COURSES
// ==========================================
router.get(['/', '/all'], async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        console.log(`SkillsMind: ${courses.length} courses fetched!`);
        res.status(200).json(courses);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 ADD NEW COURSE
// ==========================================
router.post('/add', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'profilePic', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'instructorIntroVideo', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('📚 Adding new course...');
        
        let instructorData = {};
        let syllabusData = [];
        
        try {
            instructorData = req.body.instructor ? JSON.parse(req.body.instructor) : {};
            syllabusData = req.body.syllabus ? JSON.parse(req.body.syllabus) : [];
        } catch (e) {
            console.log('Parse error:', e.message);
        }

        const fixPath = (fileArr, folder) => {
            if (fileArr && fileArr[0]) {
                return `/${folder}${fileArr[0].filename}`.replace(/\\/g, '/').replace(/\/+/g, '/');
            }
            return '';
        };

        const courseFields = {
            title: req.body.title,
            description: req.body.description,
            price: Number(req.body.price),
            duration: req.body.duration,
            level: req.body.level,
            category: req.body.category,
            badge: req.body.badge,
            videoUrl: req.body.videoUrl, 
            thumbnail: fixPath(req.files['thumbnail'], 'uploads/'),
            videoFile: fixPath(req.files['courseVideo'], 'uploads/videos/'),
            instructor: {
                name: instructorData.name || '',
                bio: instructorData.bio || '',
                expertise: instructorData.expertise || [],
                studentsTaught: instructorData.studentsTaught || 0,
                profilePic: fixPath(req.files['profilePic'], 'uploads/'),
                introVideoFile: fixPath(req.files['instructorIntroVideo'], 'uploads/videos/'),
                introVideoUrl: instructorData.introVideoUrl || ''
            },
            syllabus: syllabusData,
            isHide: false 
        };

        const newCourse = new Course(courseFields);
        await newCourse.save();
        console.log('✅ Course added:', newCourse.title);
        res.status(201).json({ success: true, message: "🚀 SkillsMind: Course Launched!" });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 UPDATE / EDIT COURSE (FIXED)
// ==========================================
router.put('/:id', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'profilePic', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'instructorIntroVideo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('✏️ Updating course:', id);
        
        // Check if course exists
        let course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // Parse JSON fields
        let instructorData = {};
        let syllabusData = [];
        
        try {
            if (req.body.instructor) {
                instructorData = typeof req.body.instructor === 'string' 
                    ? JSON.parse(req.body.instructor) 
                    : req.body.instructor;
            }
            if (req.body.syllabus) {
                syllabusData = typeof req.body.syllabus === 'string' 
                    ? JSON.parse(req.body.syllabus) 
                    : req.body.syllabus;
            }
        } catch (e) {
            console.log('Parse error:', e.message);
        }

        const fixPath = (fileArr, folder, oldPath) => {
            if (fileArr && fileArr[0]) {
                return `/${folder}${fileArr[0].filename}`.replace(/\\/g, '/').replace(/\/+/g, '/');
            }
            return oldPath;
        };

        // Build update data
        const updateData = {
            title: req.body.title || course.title,
            description: req.body.description || course.description,
            price: req.body.price ? Number(req.body.price) : course.price,
            duration: req.body.duration || course.duration,
            level: req.body.level || course.level,
            category: req.body.category || course.category,
            badge: req.body.badge || course.badge,
            videoUrl: req.body.videoUrl !== undefined ? req.body.videoUrl : course.videoUrl,
            instructor: {
                name: instructorData.name || course.instructor?.name || '',
                bio: instructorData.bio || course.instructor?.bio || '',
                expertise: instructorData.expertise || course.instructor?.expertise || [],
                studentsTaught: instructorData.studentsTaught || course.instructor?.studentsTaught || 0,
                introVideoUrl: instructorData.introVideoUrl || course.instructor?.introVideoUrl || '',
                profilePic: fixPath(req.files['profilePic'], 'uploads/', course.instructor?.profilePic || ''),
                introVideoFile: fixPath(req.files['instructorIntroVideo'], 'uploads/videos/', course.instructor?.introVideoFile || '')
            }
        };

        // Handle thumbnail and video file updates
        if (req.files['thumbnail']) {
            updateData.thumbnail = fixPath(req.files['thumbnail'], 'uploads/', '');
        } else {
            updateData.thumbnail = course.thumbnail;
        }
        
        if (req.files['courseVideo']) {
            updateData.videoFile = fixPath(req.files['courseVideo'], 'uploads/videos/', '');
        } else {
            updateData.videoFile = course.videoFile;
        }

        // Update syllabus if provided
        if (syllabusData.length > 0) {
            updateData.syllabus = syllabusData;
        } else {
            updateData.syllabus = course.syllabus;
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );

        console.log('✅ Course updated:', updatedCourse.title);
        res.status(200).json({ 
            success: true, 
            message: "✅ SkillsMind: Course Updated!", 
            course: updatedCourse 
        });
        
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 TOGGLE HIDE/UNHIDE
// ==========================================
router.patch('/toggle-hide/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        course.isHide = !course.isHide;
        await course.save();

        res.status(200).json({ 
            success: true, 
            message: `SkillsMind: Course ${course.isHide ? 'Hidden' : 'Visible'}`, 
            isHide: course.isHide 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 DELETE COURSE
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "SkillsMind: Course Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 🔥 GET SINGLE COURSE BY ID (Last mein)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: "SkillsMind: Course not found" });
        }
        res.status(200).json(course);
    } catch (err) {
        console.error("SkillsMind Single Fetch Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/courses/:id/students
router.get('/:id/students', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('enrolledStudentIds', 'name email');

        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        res.json({
            success: true,
            students: course.enrolledStudentIds || []
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;