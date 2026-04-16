require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const Payment = require('../models/Payment');
const LiveEnrollment = require('../models/LiveEnrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// ==========================================
// DEBUG: Log Cloudinary status on startup
// ==========================================
console.log('🔧 Payment Routes Loaded');
console.log('   Cloudinary Utils:', typeof uploadToCloudinary === 'function' ? '✅ Available' : '❌ Missing');

// Use memory storage for Cloudinary (no disk write)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
    console.log('📋 GET /all-payments - Fetching all payments');
    try {
        const payments = await Payment.find()
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });
        console.log(`✅ Found ${payments.length} payments`);
        res.status(200).json(payments);
    } catch (err) {
        console.error("❌ Fetch payments error:", err);
        res.status(500).json({ message: "SkillsMind DB Error", error: err.message });
    }
});

// B. Update Status (Approve/Reject)
router.put('/update-status/:id', async (req, res) => {
    const { status, rejectionReason } = req.body;
    console.log(`🔄 PUT /update-status/${req.params.id} - Status: ${status}`);
    
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

        // APPROVED: Give Access
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
                    
                    await LiveEnrollment.findOneAndUpdate(
                        { userId: student._id, courseId: updated.courseId },
                        { 
                            status: 'active', 
                            paymentApprovedAt: new Date(),
                            paymentId: payment._id
                        },
                        { upsert: true, new: true }
                    );
                    
                    await User.findByIdAndUpdate(
                        student._id,
                        { $addToSet: { enrolledCourses: courseObjectId } }
                    );
                    
                    await Course.findByIdAndUpdate(
                        courseObjectId,
                        { 
                            $addToSet: { enrolledStudentIds: student._id },
                            $inc: { enrolledStudents: 1 }
                        }
                    );
                    
                    enrollmentMessage = ' & Access Granted';
                    console.log(`✅ PAYMENT APPROVED: ${student.email} for ${updated.courseName}`);
                }
            } catch (err) {
                console.error("❌ Approval error:", err);
            }
        } 
        // REJECTED: Remove Access
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
                    
                    await User.findByIdAndUpdate(
                        student._id,
                        { $pull: { enrolledCourses: courseObjectId } }
                    );
                    
                    await Course.findByIdAndUpdate(
                        courseObjectId,
                        { 
                            $pull: { enrolledStudentIds: student._id },
                            $inc: { enrolledStudents: -1 }
                        }
                    );
                    
                    enrollmentMessage = ' & Access Removed';
                    console.log(`❌ PAYMENT REJECTED: ${student.email} for ${updated.courseName}`);
                }
            } catch (err) {
                console.error("❌ Rejection error:", err);
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

        transporter.sendMail(statusMailOptions).catch(err => console.error("❌ Email Error:", err));
        
        res.status(200).json({ 
            success: true, 
            message: `Status updated to ${status}${enrollmentMessage}!`, 
            data: updated 
        });
    } catch (err) {
        console.error("❌ Status update error:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
});

// C. DELETE Payment Record (with Cloudinary cleanup)
router.delete('/delete/:id', async (req, res) => {
    console.log(`🗑️ DELETE /delete/${req.params.id}`);
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: "Record not found" });

        // Delete from Cloudinary if it's a Cloudinary URL
        if (payment.transactionReceipt && payment.transactionReceipt.includes('cloudinary')) {
            try {
                const url = payment.transactionReceipt;
                const parts = url.split('/');
                const filenameWithExt = parts[parts.length - 1];
                const filename = filenameWithExt.split('.')[0];
                const publicId = `skillsmind/payments/receipts/${filename}`;
                
                await deleteFromCloudinary(publicId);
                console.log(`✅ Deleted from Cloudinary: ${publicId}`);
            } catch (cloudinaryError) {
                console.error("❌ Cloudinary delete error:", cloudinaryError);
            }
        }

        await Payment.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Record deleted successfully" });
    } catch (err) {
        console.error("❌ Delete error:", err);
        res.status(500).json({ success: false, message: "Delete failed", error: err.message });
    }
});

// D. GET Rejection Reason
router.get('/rejection-reason/:id', async (req, res) => {
    console.log(`📝 GET /rejection-reason/${req.params.id}`);
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
        console.error("❌ Error fetching rejection reason:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

// Get all payments for a user
router.get('/my-all-payments/:userId', async (req, res) => {
    console.log(`📋 GET /my-all-payments/${req.params.userId}`);
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const payments = await Payment.find({ 
            studentEmail: user.email 
        }).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${payments.length} payments for user ${user.email}`);
        
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
        console.error("❌ Error fetching user payments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get single payment status by email
router.get('/my-status/:email', async (req, res) => {
    console.log(`📋 GET /my-status/${req.params.email}`);
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
        console.error("❌ SkillsMind Dashboard Status Error:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// ==========================================
// 🔥 FIXED: Submit Payment with Cloudinary
// ==========================================
router.post('/submit-payment', upload.single('receipt'), async (req, res) => {
    console.log('💰 POST /submit-payment - New payment submission');
    console.log('   Body:', JSON.stringify(req.body, null, 2).substring(0, 500));
    console.log('   File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    try {
        const { 
            studentName, studentEmail, studentCnic, courseName, 
            courseId, transactionId, amount, paymentMethod, 
            enrollmentMode, previousPaymentId, enrollmentId 
        } = req.body;
        
        // Validation
        if (!studentEmail) {
            console.error('❌ Missing studentEmail');
            return res.status(400).json({ success: false, message: "Student email is required" });
        }
        
        if (!courseId) {
            console.error('❌ Missing courseId');
            return res.status(400).json({ success: false, message: "Course ID is required" });
        }
        
        let receiptUrl = null;
        
        // Upload to Cloudinary if file exists
        if (req.file) {
            try {
                console.log('☁️ Uploading to Cloudinary...');
                const uploadResult = await uploadToCloudinary(
                    req.file.buffer, 
                    'payments/receipts',
                    { resource_type: 'auto' }
                );
                receiptUrl = uploadResult.secure_url;
                console.log(`✅ Receipt uploaded to Cloudinary: ${receiptUrl}`);
            } catch (uploadError) {
                console.error("❌ Cloudinary upload error:", uploadError.message);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to upload receipt. Please try again.",
                    error: uploadError.message
                });
            }
        } else if (!previousPaymentId) {
            console.error('❌ No receipt file and not a resubmit');
            return res.status(400).json({
                success: false,
                message: "Payment receipt is required"
            });
        }

        // 🔥 FIXED: Find student by email (not by undefined studentId)
        console.log(`🔍 Looking for student with email: ${studentEmail}`);
        let student = await User.findOne({ email: studentEmail });
        
        if (!student) {
            console.error(`❌ Student not found: ${studentEmail}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found. Please register first or contact support.' 
            });
        }
        console.log(`✅ Student found: ${student._id} - ${student.name || studentEmail}`);
        
        // Check for existing pending payment
        const existingPending = await Payment.findOne({
            studentEmail: studentEmail,
            courseId: courseId,
            status: 'pending'
        });
        
        if (existingPending && !previousPaymentId) {
            console.log(`⚠️ Existing pending payment found: ${existingPending._id}`);
            return res.status(400).json({
                success: false,
                message: 'You already have a pending payment for this course. Please wait for admin approval.'
            });
        }
        
        // Handle resubmit - mark old payment as replaced
        if (previousPaymentId) {
            console.log(`🔄 Resubmit for previous payment: ${previousPaymentId}`);
            const previousPayment = await Payment.findById(previousPaymentId);
            if (previousPayment && previousPayment.status === 'rejected') {
                previousPayment.isReplaced = true;
                await previousPayment.save();
                console.log(`✅ Marked previous payment as replaced`);
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
            transactionReceipt: receiptUrl,
            status: 'pending',
            enrollmentId: enrollmentId
        });

        await newPayment.save();
        console.log(`✅ Payment saved to database with ID: ${newPayment._id}`);

        // Send confirmation email
        const frontendUrl = process.env.FRONTEND_URL || 'https://skillsmind-lms-project-production.up.railway.app';
        
        const mailOptions = {
            from: '"SkillsMind Support" <skillsmind786@gmail.com>',
            to: studentEmail,
            subject: 'Payment Received - Under Review | SkillsMind',
            html: `
                <div style="max-width:600px;margin:auto;font-family:sans-serif;border:1px solid #e1e1e1;border-radius:10px;overflow:hidden;">
                    <div style="background:#000B29;padding:30px;text-align:center;">
                        <h1 style="color:#fff;margin:0;">SkillsMind</h1>
                    </div>
                    <div style="padding:40px 30px;">
                        <h2>Payment Received!</h2>
                        <p>Hi ${studentName},</p>
                        <p>We have received your payment of <strong>Rs. ${amount}</strong> for <strong>${courseName}</strong>.</p>
                        <p>Your transaction ID: <strong>${transactionId}</strong></p>
                        <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
                            <p style="margin:0;color:#92400e;">
                                <strong>⏳ Status: Pending Verification</strong><br/>
                                Our team will verify your payment within 2-4 hours.
                            </p>
                        </div>
                        <p>You will receive an email once your payment is approved.</p>
                        <div style="text-align:center;margin-top:30px;">
                            <a href="${frontendUrl}/my-learning" style="background:#000B29;color:#fff;padding:12px 25px;text-decoration:none;border-radius:5px;">Track Status</a>
                        </div>
                    </div>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions).catch(err => console.error("❌ Email Error:", err.message));
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment submitted successfully! Our team will verify your payment.',
            receiptUrl 
        });
        
    } catch (error) {
        console.error("❌ Payment submission error:", error);
        console.error("   Stack:", error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error saving payment. Please try again.',
            error: error.message 
        });
    }
});

module.exports = router;