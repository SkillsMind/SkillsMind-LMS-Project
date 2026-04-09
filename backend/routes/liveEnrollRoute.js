const express = require('express');
const router = express.Router();
const LiveEnrollment = require('../models/LiveEnrollment');
const Course = require('../models/Course');

// 1. GET: Check ACTIVE enrollments (Payment Approved)
router.get('/check-enrollment/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const activeEnrollments = await LiveEnrollment.find({ 
            userId: userId,
            status: 'active' 
        });
        
        const enrolledCoursesFromCourses = await Course.find({
            enrolledStudentIds: userId
        }).select('_id title');
        
        const enrolledCourses = [
            ...activeEnrollments.map(e => ({
                courseId: e.courseId,
                courseTitle: e.course,
                mode: e.mode || 'live',
                enrollmentDate: e.createdAt,
                paymentStatus: 'active'
            })),
            ...enrolledCoursesFromCourses.map(c => ({
                courseId: c._id,
                courseTitle: c.title,
                mode: 'course',
                enrollmentDate: null,
                paymentStatus: 'active'
            }))
        ];
        
        res.json({
            success: true,
            enrolledCourses: enrolledCourses,
            count: enrolledCourses.length
        });
        
    } catch (error) {
        console.error("SkillsMind Enrollment Check Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            enrolledCourses: [] 
        });
    }
});

// 2. GET: Check PENDING enrollments (Form filled, payment not approved)
router.get('/check-pending/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const pendingEnrollments = await LiveEnrollment.find({ 
            userId: userId,
            status: 'pending'
        });
        
        res.json({
            success: true,
            pendingCourses: pendingEnrollments.map(e => ({
                enrollmentId: e._id,
                courseId: e.courseId,
                courseTitle: e.course,
                enrollmentDate: e.createdAt,
                formData: {
                    fullName: e.fullName,
                    email: e.email,
                    city: e.city,
                    phone: e.phone,
                    address: e.address,
                    dob: e.dob,
                    gender: e.gender,
                    profilePic: e.profilePic
                }
            }))
        });
        
    } catch (error) {
        console.error("Pending check error:", error);
        res.status(500).json({ success: false, pendingCourses: [] });
    }
});

// 3. GET: All enrollments (Admin purpose)
router.get('/all', async (req, res) => {
    try {
        const enrollments = await LiveEnrollment.find().sort({ createdAt: -1 });
        res.status(200).json(enrollments);
    } catch (error) {
        console.error("SkillsMind Fetch Error:", error);
        res.status(500).json({ success: false, message: "Data nahi mil raha" });
    }
});

// 4. POST: Save enrollment with PENDING status
router.post('/live-register', async (req, res) => {
    try {
        const { userId, fullName, email, city, phone, address, dob, gender, course, courseId, profilePic } = req.body;

        console.log("📥 Received enrollment data:", { userId, fullName, email, course, courseId });

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated. Please login again."
            });
        }

        // Check if already ACTIVE enrolled
        const existingActive = await LiveEnrollment.findOne({
            userId: userId,
            course: course,
            status: 'active'
        });
        
        if (existingActive) {
            return res.status(400).json({
                success: false,
                message: "You are already fully enrolled in this course!"
            });
        }

        // Check if already has PENDING enrollment - UPDATE KAREGA NAHI TOH NAYA BANAYEGA
        const existingPending = await LiveEnrollment.findOne({
            userId: userId,
            course: course,
            status: 'pending'
        });
        
        let savedData;
        
        if (existingPending) {
            // Update existing pending enrollment
            existingPending.fullName = fullName;
            existingPending.email = email;
            existingPending.city = city;
            existingPending.phone = phone;
            existingPending.address = address;
            existingPending.dob = dob;
            existingPending.gender = gender;
            existingPending.profilePic = profilePic;
            existingPending.courseId = courseId;
            
            savedData = await existingPending.save();
            console.log("✅ Existing pending enrollment updated:", savedData._id);
            
            return res.status(200).json({
                success: true,
                message: "Registration updated! Payment pending verification.",
                data: savedData,
                enrollmentId: savedData._id,
                isUpdate: true
            });
        } else {
            // Create new enrollment
            const newEnrollment = new LiveEnrollment({
                userId: userId,
                fullName,
                email,
                city,
                phone,
                address,
                dob,
                gender,
                course,
                courseId: courseId,
                profilePic,
                status: 'pending'
            });

            savedData = await newEnrollment.save();
            console.log("✅ New enrollment saved (pending):", savedData._id);
            
            return res.status(201).json({
                success: true,
                message: "Registration successful! Complete payment to activate enrollment.",
                data: savedData,
                enrollmentId: savedData._id,
                isUpdate: false
            });
        }
    } catch (error) {
        console.error("DB Save Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error", 
            error: error.message 
        });
    }
});

// 5. PATCH: Update enrollment status to ACTIVE (Admin use)
router.patch('/update-status/:enrollmentId', async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { status, paymentId } = req.body;
        
        const enrollment = await LiveEnrollment.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Enrollment not found" });
        }
        
        enrollment.status = status;
        if (paymentId) enrollment.paymentId = paymentId;
        
        await enrollment.save();
        
        if (status === 'active' && enrollment.courseId) {
            await Course.findByIdAndUpdate(enrollment.courseId, {
                $addToSet: { enrolledStudentIds: enrollment.userId },
                $inc: { enrolledStudents: 1 }
            });
            console.log("✅ Course updated with active student:", enrollment.courseId);
        }
        
        res.json({ success: true, message: `Enrollment status updated to ${status}` });
    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 6. GET: Single enrollment details by user and course (for pre-filling form)
router.get('/enrollment-details/:userId/:courseId', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        const enrollment = await LiveEnrollment.findOne({
            userId: userId,
            courseId: courseId,
            status: 'pending'
        });
        
        if (enrollment) {
            res.json({
                success: true,
                enrollment: {
                    enrollmentId: enrollment._id,
                    ...enrollment.toObject()
                }
            });
        } else {
            res.json({ success: false, message: "No pending enrollment found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 7. DELETE: Delete enrollment record
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