const express = require('express');
const router = express.Router();
const LiveEnrollment = require('../models/LiveEnrollment');
const Course = require('../models/Course');
const Payment = require('../models/Payment'); // 🔥 ADDED: Import Payment model
const User = require('../models/User'); // 🔥 ADDED: Import User model

// ==========================================
// 1. GET: Check ACTIVE enrollments ONLY (Strict - No Backup Source)
// ==========================================
router.get('/check-enrollment/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`🔍 Checking ACTIVE enrollments for user: ${userId}`);
        
        // 🔥 STRICT FIX: Only check LiveEnrollment with status 'active'
        // NO backup source from Course model to avoid unauthorized access
        const activeEnrollments = await LiveEnrollment.find({ 
            userId: userId,
            status: 'active' 
        }).populate('courseId', 'title category');
        
        const enrolledCourses = activeEnrollments.map(e => ({
            courseId: e.courseId?._id || e.courseId,
            courseTitle: e.course || e.courseId?.title,
            mode: e.mode || 'live',
            enrollmentDate: e.createdAt,
            paymentStatus: 'active',
            studentName: e.fullName,
            enrollmentId: e._id
        }));

        console.log(`✅ Found ${enrolledCourses.length} ACTIVE enrollments for user ${userId}`);
        
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

// ==========================================
// 2. GET: Check Payment Status for All Courses (NEW ENDPOINT)
// ==========================================
router.get('/check-payment-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user email first
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Get all payments for this user
        const payments = await Payment.find({ 
            studentEmail: user.email 
        }).sort({ createdAt: -1 });
        
        // Create a map of courseId -> paymentStatus
        const paymentStatusMap = {};
        payments.forEach(p => {
            // Only keep the latest status for each course
            if (!paymentStatusMap[p.courseId]) {
                paymentStatusMap[p.courseId] = {
                    status: p.status, // 'pending', 'approved', 'rejected'
                    paymentId: p._id,
                    rejectionReason: p.rejectionReason,
                    amount: p.amount,
                    submittedAt: p.createdAt
                };
            }
        });
        
        res.json({
            success: true,
            paymentStatuses: paymentStatusMap
        });
        
    } catch (error) {
        console.error("Payment status check error:", error);
        res.status(500).json({ success: false, paymentStatuses: {} });
    }
});

// ==========================================
// 3. GET: Check PENDING enrollments (Form filled, payment pending)
// ==========================================
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

// ==========================================
// 4. GET: Check REJECTED enrollments (Payment Rejected by Admin)
// ==========================================
router.get('/check-rejected/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 🔥 FIXED: Check both 'cancelled' status AND rejected payments
        const rejectedEnrollments = await LiveEnrollment.find({ 
            userId: userId,
            status: 'cancelled'
        });
        
        // Also check payments with rejected status for additional info
        const user = await User.findById(userId);
        let rejectedPayments = [];
        if (user) {
            rejectedPayments = await Payment.find({
                studentEmail: user.email,
                status: 'rejected'
            });
        }
        
        // Merge data
        const rejectedCourses = rejectedEnrollments.map(e => {
            // Find matching payment for rejection reason
            const matchingPayment = rejectedPayments.find(p => 
                p.courseId.toString() === (e.courseId?.toString() || e.courseId)
            );
            
            return {
                enrollmentId: e._id,
                courseId: e.courseId,
                courseTitle: e.course,
                rejectionReason: matchingPayment?.rejectionReason || e.rejectionReason || 'Payment verification failed',
                rejectedAt: e.paymentRejectedAt || matchingPayment?.updatedAt,
                formData: {
                    fullName: e.fullName,
                    email: e.email,
                    phone: e.phone
                },
                paymentId: matchingPayment?._id
            };
        });
        
        res.json({
            success: true,
            rejectedCourses: rejectedCourses
        });
    } catch (error) {
        console.error("Rejected check error:", error);
        res.status(500).json({ success: false, rejectedCourses: [] });
    }
});

// ==========================================
// 5. GET: All enrollments (Admin purpose)
// ==========================================
router.get('/all', async (req, res) => {
    try {
        const enrollments = await LiveEnrollment.find().sort({ createdAt: -1 });
        res.status(200).json(enrollments);
    } catch (error) {
        console.error("SkillsMind Fetch Error:", error);
        res.status(500).json({ success: false, message: "Data nahi mil raha" });
    }
});

// ==========================================
// 6. POST: Save enrollment with PENDING status
// ==========================================
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

        // Check if already has PENDING enrollment
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

// ==========================================
// 7. PATCH: Update enrollment status to ACTIVE (Admin use)
// ==========================================
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
        
        // 🔥 IMPORTANT: Only add to Course.enrolledStudentIds when status is 'active'
        if (status === 'active' && enrollment.courseId) {
            await Course.findByIdAndUpdate(enrollment.courseId, {
                $addToSet: { enrolledStudentIds: enrollment.userId },
                $inc: { enrolledStudents: 1 }
            });
            console.log("✅ Course updated with active student:", enrollment.courseId);
        }
        
        // If rejected, remove from course enrolled list (safety)
        if (status === 'cancelled' && enrollment.courseId) {
            await Course.findByIdAndUpdate(enrollment.courseId, {
                $pull: { enrolledStudentIds: enrollment.userId }
            });
        }
        
        res.json({ success: true, message: `Enrollment status updated to ${status}` });
    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ==========================================
// 8. GET: Single enrollment details by user and course
// ==========================================
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

// ==========================================
// 9. DELETE: Delete enrollment record
// ==========================================
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