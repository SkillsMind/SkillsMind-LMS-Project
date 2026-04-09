require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const Payment = require('../models/Payment');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 1. Multer Setup
const storage = multer.diskStorage({
    destination: './uploads/receipts',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
    }
});
const upload = multer({ storage });

// 2. Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// ==========================================
// 3. ADMIN ROUTES
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

// B. Update Status (Approve/Reject) - WITH AUTO ENROLLMENT & REJECTION REASON
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
        
        // ✅ Store rejection reason if rejected
        if (status.toLowerCase() === 'rejected' && rejectionReason) {
            payment.rejectionReason = rejectionReason;
        }
        
        if (status.toLowerCase() === 'approved') {
            payment.approvedAt = new Date();
        }
        await payment.save();

        const updated = payment;

        // 🔥 Auto-enrollment when approved
        let enrollmentMessage = '';
        if (status.toLowerCase() === 'approved') {
            try {
                const User = require('../models/User');
                const Course = require('../models/Course');
                
                let student = null;
                
                if (updated.studentId) {
                    student = await User.findById(updated.studentId);
                    console.log('Found student by studentId:', student?.email);
                }
                
                if (!student) {
                    student = await User.findOne({ email: updated.studentEmail });
                    console.log('Found student by email:', student?.email);
                    
                    if (student && !updated.studentId) {
                        updated.studentId = student._id;
                        await updated.save();
                    }
                }
                
                if (student && updated.courseId) {
                    let courseObjectId;
                    if (mongoose.Types.ObjectId.isValid(updated.courseId)) {
                        courseObjectId = new mongoose.Types.ObjectId(updated.courseId);
                    } else {
                        console.log('Invalid courseId:', updated.courseId);
                        enrollmentMessage = ' (Invalid Course ID)';
                        throw new Error('Invalid course ID');
                    }
                    
                    const course = await Course.findById(courseObjectId);
                    if (!course) {
                        console.log('Course not found:', updated.courseId);
                        enrollmentMessage = ' (Course Not Found)';
                        throw new Error('Course not found');
                    }
                    
                    await User.findByIdAndUpdate(
                        student._id,
                        { $addToSet: { enrolledCourses: courseObjectId } },
                        { new: true }
                    );
                    
                    await Course.findByIdAndUpdate(
                        courseObjectId,
                        { 
                            $addToSet: { enrolledStudentIds: student._id },
                            $inc: { enrolledStudents: 1 }
                        },
                        { new: true }
                    );
                    
                    enrollmentMessage = ' & Student Auto-Enrolled';
                    console.log(`✅ [SkillsMind] Auto-enrolled: ${student.email} to course ${course.title}`);
                } else {
                    console.log('⚠️ Auto-enrollment skipped: Student or courseId not found');
                    enrollmentMessage = ' (Student/Course Not Found)';
                }
            } catch (enrollErr) {
                console.error("⚠️ Auto-enrollment error:", enrollErr.message);
                enrollmentMessage = enrollmentMessage || ' (Enrollment Failed)';
            }
        }

        // --- STATUS UPDATE EMAIL ---
        const isApproved = status.toLowerCase() === 'approved';
        const themeColor = isApproved ? '#5e6160' : '#e31e24'; 
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
                            <div style="height: 2px; width: 50px; background: ${themeColor}; margin: 10px auto;"></div>
                        </div>

                        <div style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Hello ${updated.studentName},</h2>
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                ${isApproved 
                                    ? `Great news! Your payment for the course <strong>${updated.courseName}</strong> has been successfully verified. You now have full access to our learning portal.` 
                                    : `We have completed the review of your payment submission for <strong>${updated.courseName}</strong>. Unfortunately, we could not verify your transaction at this time.`}
                            </p>

                            ${!isApproved && updated.rejectionReason ? `
                                <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 8px;">
                                    <strong style="color: #dc2626;">Reason for rejection:</strong>
                                    <p style="margin: 8px 0 0 0; color: #7f1a1a;">${updated.rejectionReason}</p>
                                </div>
                            ` : ''}

                            <div style="margin: 30px 0; padding: 20px; background-color: #fcfcfc; border: 1px dashed #ddd; border-radius: 8px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="color: #888; font-size: 13px; text-transform: uppercase; padding-bottom: 5px;">Enrolled Course</td>
                                        <td style="color: #888; font-size: 13px; text-transform: uppercase; padding-bottom: 5px; text-align: right;">Amount Paid</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #000B29; font-weight: bold; font-size: 16px;">${updated.courseName}</td>
                                        <td style="color: #000B29; font-weight: bold; font-size: 16px; text-align: right;">Rs. ${updated.amount}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 15px;">
                                            <div style="font-size: 13px; color: #888; text-transform: uppercase;">Verification Status</div>
                                            <div style="color: ${themeColor}; font-weight: bold; font-size: 18px;">${status.toUpperCase()}</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            ${isApproved ? 
                                `<p style="color: #555; font-size: 15px;">Your journey towards excellence starts here. Log in to your dashboard to view your lectures, assignments, and resources.</p>` : 
                                `<p style="color: #555; font-size: 15px;">Please correct the issue and resubmit your payment. If you need assistance, contact our support team.</p>`
                            }

                            <div style="text-align: center; margin-top: 40px;">
                                <a href="${dashboardUrl}" style="background-color: ${isApproved ? '#000B29' : themeColor}; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                                    ${isApproved ? 'Go to My Learning' : 'Contact Support'}
                                </a>
                            </div>
                        </div>

                        <div style="background-color: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">SkillsMind Learning Management System</p>
                            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">This is an automated message, please do not reply directly to this email.</p>
                        </div>
                    </div>
                </div>
            `
        };

        transporter.sendMail(statusMailOptions).catch(err => console.error("Email Sending Failed:", err));
        
        console.log(`✅ [SkillsMind] Action Log: ${status} | Student: ${updated.studentEmail}${enrollmentMessage}`);
        res.status(200).json({ 
            success: true, 
            message: `Status updated to ${status}${enrollmentMessage}!`, 
            data: updated 
        });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ success: false, message: "Server Error during status update", error: err.message });
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

// ✅ D. GET Rejection Reason for a payment
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
// 4. STUDENT ROUTES
// ==========================================

router.post('/submit-payment', upload.single('receipt'), async (req, res) => {
    try {
        const { studentName, studentEmail, studentCnic, courseName, courseId, transactionId, amount, paymentMethod, enrollmentMode, previousPaymentId } = req.body;
        
        let receiptPath = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const User = require('../models/User');
        const student = await User.findOne({ email: studentEmail });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found. Please register first.' 
            });
        }
        
        // ✅ If resubmitting, mark previous payment as replaced
        if (previousPaymentId) {
            const previousPayment = await Payment.findById(previousPaymentId);
            if (previousPayment && previousPayment.status === 'rejected') {
                previousPayment.isReplaced = true;
                previousPayment.replacedBy = newPaymentId;
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
            status: 'pending'
        });

        await newPayment.save();

        const mailOptions = {
            from: '"SkillsMind Support" <skillsmind786@gmail.com>',
            to: studentEmail,
            subject: 'Action Required: Payment Verification in Progress | SkillsMind',
            html: `
                <div style="max-width: 600px; margin: auto; font-family: sans-serif; border: 1px solid #e1e1e1; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #000B29; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">SkillsMind</h1>
                        <p style="color: #e31e24; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; font-size: 12px;">Premium Learning Experience</p>
                    </div>
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h2 style="color: #333;">Payment Acknowledgment</h2>
                        <p>Hi ${studentName}, we've received your payment of <b>Rs. ${amount}</b> for <b>${courseName}</b>.</p>
                        <p>Status: <span style="color: #e31e24; font-weight: bold;">PENDING VERIFICATION</span></p>
                        <p>Our team will verify your receipt within 2-4 hours. You'll receive another email once your course is active.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-learning" style="background-color: #000B29; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Visit My Learning</a>
                        </div>
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

// FIXED: SkillMind Status Route to match Frontend exactly
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

module.exports = router;