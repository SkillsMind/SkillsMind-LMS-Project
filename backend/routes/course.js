const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Course = require('../models/Course');
const fs = require('fs');
const { uploadToCloudinary } = require('../utils/cloudinary');
const cloudinaryUpload = require('../middleware/cloudinaryUpload');

// Helper: Upload to Cloudinary (with better error handling)
const uploadToCloudinaryHelper = async (file, folder) => {
    if (!file) {
        console.log(`⚠️ No file provided for ${folder}`);
        return null;
    }
    
    // 🔥 FIX: Check if buffer exists (for memory storage)
    if (!file.buffer) {
        console.log(`⚠️ No buffer for ${folder}, file may be from disk storage`);
        return null;
    }
    
    try {
        console.log(`📤 Uploading to Cloudinary: ${folder}, file size: ${file.buffer.length} bytes, type: ${file.mimetype}`);
        const result = await uploadToCloudinary(file.buffer, folder);
        console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Cloudinary upload error to ${folder}:`, error.message);
        return null;
    }
};

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
// 🔥 ADD NEW COURSE (Cloudinary Upload)
// ==========================================
router.post('/add', cloudinaryUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'profilePic', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'instructorIntroVideo', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('📚 Adding new course with Cloudinary...');
        console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
        
        let instructorData = {};
        let syllabusData = [];
        
        try {
            instructorData = req.body.instructor ? JSON.parse(req.body.instructor) : {};
            syllabusData = req.body.syllabus ? JSON.parse(req.body.syllabus) : [];
        } catch (e) {
            console.log('Parse error:', e.message);
        }

        // Upload files to Cloudinary
        const thumbnailUrl = req.files?.['thumbnail']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['thumbnail'][0], 'courses/thumbnails') 
            : null;
        
        const courseVideoUrl = req.files?.['courseVideo']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['courseVideo'][0], 'courses/videos') 
            : null;
        
        const profilePicUrl = req.files?.['profilePic']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['profilePic'][0], 'instructors/profiles') 
            : null;
        
        const introVideoUrl = req.files?.['instructorIntroVideo']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['instructorIntroVideo'][0], 'instructors/videos') 
            : null;

        const courseFields = {
            title: req.body.title,
            description: req.body.description || '',
            price: Number(req.body.price),
            duration: req.body.duration || '3 Months',
            level: req.body.level || 'Beginner',
            category: req.body.category,
            badge: req.body.badge || 'Premium',
            videoUrl: req.body.videoUrl || '',
            thumbnail: thumbnailUrl || '',
            videoFile: courseVideoUrl || '',
            instructor: {
                name: instructorData.name || '',
                bio: instructorData.bio || '',
                expertise: instructorData.expertise || [],
                studentsTaught: instructorData.studentsTaught || 0,
                profilePic: profilePicUrl || '',
                introVideoFile: introVideoUrl || '',
                introVideoUrl: instructorData.introVideoUrl || ''
            },
            syllabus: syllabusData,
            isHide: false 
        };

        const newCourse = new Course(courseFields);
        await newCourse.save();
        
        console.log('✅ Course added successfully:', newCourse.title);
        console.log('   Thumbnail:', thumbnailUrl);
        console.log('   Video:', courseVideoUrl);
        
        res.status(201).json({ 
            success: true, 
            message: "🚀 SkillsMind: Course Launched!", 
            course: newCourse 
        });
        
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 🔥 UPDATE COURSE
// ==========================================
router.put('/:id', cloudinaryUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'profilePic', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'instructorIntroVideo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('✏️ Updating course:', id);
        
        let course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

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

        // Upload new files to Cloudinary if provided
        const thumbnailUrl = req.files?.['thumbnail']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['thumbnail'][0], 'courses/thumbnails') 
            : course.thumbnail;
        
        const courseVideoUrl = req.files?.['courseVideo']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['courseVideo'][0], 'courses/videos') 
            : course.videoFile;
        
        const profilePicUrl = req.files?.['profilePic']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['profilePic'][0], 'instructors/profiles') 
            : course.instructor?.profilePic;
        
        const introVideoUrl = req.files?.['instructorIntroVideo']?.[0] 
            ? await uploadToCloudinaryHelper(req.files['instructorIntroVideo'][0], 'instructors/videos') 
            : course.instructor?.introVideoFile;

        const updateData = {
            title: req.body.title || course.title,
            description: req.body.description || course.description,
            price: req.body.price ? Number(req.body.price) : course.price,
            duration: req.body.duration || course.duration,
            level: req.body.level || course.level,
            category: req.body.category || course.category,
            badge: req.body.badge || course.badge,
            videoUrl: req.body.videoUrl !== undefined ? req.body.videoUrl : course.videoUrl,
            thumbnail: thumbnailUrl,
            videoFile: courseVideoUrl,
            instructor: {
                name: instructorData.name || course.instructor?.name || '',
                bio: instructorData.bio || course.instructor?.bio || '',
                expertise: instructorData.expertise || course.instructor?.expertise || [],
                studentsTaught: instructorData.studentsTaught || course.instructor?.studentsTaught || 0,
                introVideoUrl: instructorData.introVideoUrl || course.instructor?.introVideoUrl || '',
                profilePic: profilePicUrl,
                introVideoFile: introVideoUrl
            }
        };

        if (syllabusData.length > 0) {
            updateData.syllabus = syllabusData;
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

// Toggle Hide/Unhide
router.patch('/toggle-hide/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false });
        course.isHide = !course.isHide;
        await course.save();
        res.json({ success: true, isHide: course.isHide });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete Course
router.delete('/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Course deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// For Notebook
router.get('/for-notebook', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false }).select('_id title category').sort({ title: 1 });
        const formattedCourses = courses.map(c => ({
            _id: c._id,
            code: c.category ? c.category.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100) : 'GEN' + Math.floor(Math.random() * 100),
            name: c.title,
            category: c.category
        }));
        res.json({ success: true, count: formattedCourses.length, data: formattedCourses });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// For Assignments
router.get('/for-assignments', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false }).select('_id title category enrolledStudentIds').sort({ title: 1 });
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

// Simple List
router.get('/simple/list', async (req, res) => {
    try {
        const courses = await Course.find({ isHide: false }).select('_id title category enrolledStudentIds').sort({ title: 1 });
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

// Get Students by Course
router.get('/:id/students', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('enrolledStudentIds', 'name email');
        if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
        res.json({ success: true, students: course.enrolledStudentIds || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;