require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const Payment = require('../models/Payment');
const LiveEnrollment = require('../models/LiveEnrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Multer Setup
const storage = multer.diskStorage({
    destination: './uploads/receipts',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
    }
});
const upload = multer({ storage });

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// A. Fetch All Payments
router.get('/all-payments', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (err) {
        res.status(500).json({ message: "SkillsMind DB Error", error: err });
    }
});

// B. Update Status (Approve/Reject) - FIXED LOGIC
router.put('/update-status/:id', async (req, res) => {
    const { status, rejectionReason } = req.body;
    try {
        if (!['approved', 'rejected', 'pending'].includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        payment.status = status.toLowerCase();
        
        if (status.toLowerCase() === 'rejected' && rejectionReason) {
            payment.rejectionReason = rejectionReason;
        }
        
        if (status.toLowerCase() === 'approved') {
            payment.approvedAt = new Date();
        }
        await payment.save();

        const updated = payment;
        let enrollmentMessage = '';

        // APPROVED: Give Access - STRICT LOGIC
        if (status.toLowerCase() === 'approved') {
            try {
                let student = null;
                if (updated.studentId) {
                    student = await User.findById(updated.studentId);
                }
                if (!student) {
                    student = await User.findOne({ email: updated.studentEmail });
                    if (student && !updated.studentId) {
                        updated.studentId = student._id;
                        await updated.save();
                    }
                }
                
                if (student && updated.courseId) {
                    let courseObjectId = new mongoose.Types.ObjectId(updated.courseId);
                    
                    // 🔥 CRITICAL: Update LiveEnrollment to 'active' ONLY when payment approved
                    const enrollmentUpdate = await LiveEnrollment.findOneAndUpdate(
                        { userId: student._id, courseId: updated.courseId },
                        { 
                            status: 'active', 
                            paymentApprovedAt: new Date(),
                            paymentId: payment._id
                        },
                        { upsert: true, new: true }
                    );
                    
                    // Add to user's enrolled courses
                    await User.findByIdAndUpdate(
                        student._id,
                        { $addToSet: { enrolledCourses: courseObjectId } }
                    );
                    
                    // Add to course's enrolled students
                    await Course.findByIdAndUpdate(
                        courseObjectId,
                        { 
                            $addToSet: { enrolledStudentIds: student._id },
                            $inc: { enrolledStudents: 1 }
                        }
                    );
                    
                    enrollmentMessage = ' & Access Granted';
                    console.log(`✅ PAYMENT APPROVED: Student ${student._id} granted access to course ${courseObjectId}`);
                }
            } catch (err) {
                console.error("Approval error:", err);
            }
        } 
        // REJECTED: Remove Access - STRICT LOGIC
        else if (status.toLowerCase() === 'rejected') {
            try {
                let student = null;
                if (updated.studentId) {
                    student = await User.findById(updated.studentId);
                }
                if (!student) {
                    student = await User.findOne({ email: updated.studentEmail });
                }
                
                if (student && updated.courseId) {
                    let courseObjectId = new mongoose.Types.ObjectId(updated.courseId);
                    
                    // 🔥 CRITICAL: Update LiveEnrollment to 'cancelled' when payment rejected
                    await LiveEnrollment.findOneAndUpdate(
                        { userId: student._id, courseId: updated.courseId },
                        { 
                            status: 'cancelled', 
                            rejectionReason: rejectionReason,
                            paymentRejectedAt: new Date(),
                            paymentId: payment._id
                        },
                        { upsert: true }
                    );
                    
                    // Remove from user's enrolled courses
                    await User.findByIdAndUpdate(
                        student._id,
                        { $pull: { enrolledCourses: courseObjectId } }
                    );
                    
                    // Remove from course's enrolled students
                    await Course.findByIdAndUpdate(
                        courseObjectId,
                        { 
                            $pull: { enrolledStudentIds: student._id },
                            $inc: { enrolledStudents: -1 }
                        }
                    );
                    
                    enrollmentMessage = ' & Access Removed';
                    console.log(`❌ PAYMENT REJECTED: Student ${student._id} removed from course ${courseObjectId}`);
                }
            } catch (err) {
                console.error("Rejection error:", err);
            }
        }

        // Send Email Notification
        const isApproved = status.toLowerCase() === 'approved';
        const themeColor = isApproved ? '#10b981' : '#e31e24'; 
        const dashboardUrl = process.env.FRONTEND_URL || "http://localhost:5173/my-learning";

        const statusMailOptions = {
            from: '"SkillsMind Education" <skillsmind786@gmail.com>',
            to: updated.studentEmail,
            subject: isApproved ? '🎉 Enrollment Confirmed - SkillsMind' : 'Important Update: SkillsMind Payment Status',
            html: `
                <div style="background-color: #f4f7f6; padding: 40px 10px; font-family: 'Segoe UI', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 6px solid ${themeColor};">
                        <div style="padding: 30px; text-align: center; background-color: #000B29;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">SkillsMind</h1>
                        </div>
                        <div style="padding: 40px 30px;">
                            <h2>Hello ${updated.studentName},</h2>
                            <p>${isApproved ? `Great news! Your payment for ${updated.courseName} has been verified and approved.` : `Your payment for ${updated.courseName} could not be verified.`}</p>
                            ${!isApproved && updated.rejectionReason ? `<div style="background:#fee2e2;padding:12px;border-radius:8px;margin:15px 0;"><strong>Reason:</strong> ${updated.rejectionReason}</div>` : ''}
                            <div style="text-align:center;margin-top:30px;">
                                <a href="${dashboardUrl}" style="background:${themeColor};color:white;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;">${isApproved ? 'Go to Dashboard' : 'Contact Support'}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };

        transporter.sendMail(statusMailOptions).catch(err => console.error("Email Error:", err));
        
        res.status(200).json({ 
            success: true, 
            message: `Status updated to ${status}${enrollmentMessage}!`, 
            data: updated 
        });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
});

// C. DELETE Payment Record
router.delete('/delete/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: "Record not found" });

        if (payment.transactionReceipt) {
            const filePath = path.join(__dirname, '..', payment.transactionReceipt);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Payment.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Record deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Delete failed", error: err.message });
    }
});

// D. GET Rejection Reason
router.get('/rejection-reason/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        res.json({ 
            success: true, 
            rejectionReason: payment.rejectionReason || null,
            courseId: payment.courseId,
            courseName: payment.courseName,
            studentName: payment.studentName,
            studentEmail: payment.studentEmail,
            studentCnic: payment.studentCnic,
            enrollmentMode: payment.enrollmentMode
        });
    } catch (error) {
        console.error("Error fetching rejection reason:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

// 🔥 NEW ENDPOINT: Get all payments for a user (for checking status before re-payment)
router.get('/my-all-payments/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const payments = await Payment.find({ 
            studentEmail: user.email 
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            payments: payments.map(p => ({
                courseId: p.courseId,
                status: p.status,
                paymentId: p._id,
                rejectionReason: p.rejectionReason,
                amount: p.amount,
                courseName: p.courseName,
                createdAt: p.createdAt,
                isReplaced: p.isReplaced
            }))
        });
    } catch (error) {
        console.error("Error fetching user payments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get single payment status by email (latest only)
router.get('/my-status/:email', async (req, res) => {
    try {
        const studentEmail = req.params.email;
        const payment = await Payment.findOne({ studentEmail: studentEmail })
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });
        
        if (!payment) {
            return res.status(200).json(null);
        }
        
        res.status(200).json(payment);
    } catch (err) {
        console.error("SkillsMind Dashboard Status Error:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

router.post('/submit-payment', upload.single('receipt'), async (req, res) => {
    try {
        const { studentName, studentEmail, studentCnic, courseName, courseId, transactionId, amount, paymentMethod, enrollmentMode, previousPaymentId, enrollmentId } = req.body;
        
        let receiptPath = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const student = await User.findOne({ email: studentEmail });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found. Please register first.' 
            });
        }
        
        // 🔥 CHECK: If there's already a pending payment for this course, don't allow duplicate
        const existingPending = await Payment.findOne({
            studentEmail: studentEmail,
            courseId: courseId,
            status: 'pending'
        });
        
        if (existingPending && !previousPaymentId) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending payment for this course. Please wait for admin approval.'
            });
        }
        
        if (previousPaymentId) {
            const previousPayment = await Payment.findById(previousPaymentId);
            if (previousPayment && previousPayment.status === 'rejected') {
                previousPayment.isReplaced = true;
                await previousPayment.save();
            }
        }
        
        const newPayment = new Payment({
            studentName, 
            studentEmail, 
            studentCnic, 
            courseName,
            courseId,
            studentId: student._id,
            enrollmentMode: enrollmentMode || 'recorded',
            transactionId, 
            amount, 
            paymentMethod,
            transactionReceipt: receiptPath,
            status: 'pending',
            enrollmentId: enrollmentId // Link to LiveEnrollment if provided
        });

        await newPayment.save();

        const mailOptions = {
            from: '"SkillsMind Support" <skillsmind786@gmail.com>',
            to: studentEmail,
            subject: 'Action Required: Payment Verification in Progress | SkillsMind',
            html: `
                <div style="max-width:600px;margin:auto;font-family:sans-serif;border:1px solid #e1e1e1;border-radius:10px;overflow:hidden;">
                    <div style="background:#000B29;padding:30px;text-align:center;"><h1 style="color:#fff;">SkillsMind</h1></div>
                    <div style="padding:40px 30px;">
                        <h2>Payment Acknowledgment</h2>
                        <p>Hi ${studentName}, we've received your payment of <b>Rs. ${amount}</b> for <b>${courseName}</b>.</p>
                        <p>Status: <span style="color:#e31e24;font-weight:bold;">PENDING VERIFICATION</span></p>
                        <p>Our team will verify your receipt within 2-4 hours.</p>
                        <div style="text-align:center;margin-top:30px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-learning" style="background:#000B29;color:#fff;padding:12px 25px;text-decoration:none;border-radius:5px;">Visit My Learning</a></div>
                    </div>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions).catch(err => console.log("Email Error:", err));
        res.status(200).json({ success: true, message: 'Payment submitted to SkillsMind!' });
    } catch (error) {
        console.error("Payment submission error:", error);
        res.status(500).json({ message: 'Error saving payment', error: error.message });
    }
});

module.exports = router;