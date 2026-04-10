import React, { useState, useEffect } from 'react';
import { 
    FaClock, FaCheckCircle, FaPlayCircle, FaFileDownload, 
    FaLock, FaExclamationTriangle, FaHeadset, FaVideo,
    FaGraduationCap
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLearning = () => {
    const navigate = useNavigate();
    const [paymentData, setPaymentData] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const studentEmail = localStorage.getItem('studentEmail');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStatus = async () => {
            if (!studentEmail || !userId) {
                setError("Session expired. Please log in again.");
                setLoading(false);
                return;
            }
            
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                
                // 🔥 Fetch enrollments from backend
                const enrollRes = await axios.get(`${API_URL}/api/enroll/check-enrollment/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('MyLearning - Raw Enrollments:', enrollRes.data);
                
                if (enrollRes.data.success && enrollRes.data.enrolledCourses && enrollRes.data.enrolledCourses.length > 0) {
                    // 🔥 STRONG DUPLICATE REMOVAL - by courseId
                    const uniqueCourses = [];
                    const seenCourseIds = new Set();
                    
                    // Sort so that 'live' mode comes first (priority)
                    const sortedCourses = [...enrollRes.data.enrolledCourses].sort((a, b) => {
                        if (a.mode === 'live' && b.mode !== 'live') return -1;
                        if (a.mode !== 'live' && b.mode === 'live') return 1;
                        return 0;
                    });
                    
                    sortedCourses.forEach(course => {
                        const courseId = course.courseId?.toString();
                        if (courseId && !seenCourseIds.has(courseId)) {
                            seenCourseIds.add(courseId);
                            uniqueCourses.push(course);
                        } else if (courseId) {
                            console.log(`⏭️ Skipping duplicate course: ${course.courseTitle} (${course.mode})`);
                        }
                    });
                    
                    console.log(`📊 Unique courses after dedup: ${uniqueCourses.length} (from ${enrollRes.data.enrolledCourses.length})`);
                    setEnrollments(uniqueCourses);
                    
                    if (uniqueCourses.length > 0) {
                        setPaymentData({
                            status: 'approved',
                            studentName: uniqueCourses[0].studentName,
                            courseName: uniqueCourses[0].courseTitle,
                            courseId: uniqueCourses[0].courseId,
                            _id: uniqueCourses[0].enrollmentId
                        });
                    }
                    setLoading(false);
                    return;
                }
                
                // 🔥 Fallback - Payment API se check karo
                const paymentRes = await axios.get(`${API_URL}/api/payments/my-status/${studentEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (paymentRes.data) {
                    setPaymentData(paymentRes.data);
                    if (paymentRes.data.status === 'approved') {
                        setEnrollments([{
                            courseId: paymentRes.data.courseId,
                            courseTitle: paymentRes.data.courseName,
                            studentName: paymentRes.data.studentName,
                            enrollmentId: paymentRes.data._id,
                            paymentStatus: 'active',
                            mode: 'live',
                            enrollmentDate: paymentRes.data.createdAt
                        }]);
                    }
                } else {
                    setError("No enrollment record found.");
                }
            } catch (err) {
                console.error('MyLearning Error:', err);
                setError("Unable to retrieve records. Check server.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatus();
    }, [studentEmail, userId, token]);

    if (loading) {
        return (
            <div className="mylearning-loading">
                <div className="mylearning-spinner"></div>
                <h2>Accessing SkillsMind Portal...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mylearning-error">
                <FaLock size={60} color="#64748b" />
                <h2>Access Restricted</h2>
                <p>{error}</p>
                <button className="mylearning-btn-browse" onClick={() => navigate('/courses')}>
                    Browse Courses
                </button>
            </div>
        );
    }

    // 🔥 Status logic
    const hasApprovedCourses = enrollments.length > 0;
    const hasRejectedCourses = paymentData && paymentData.status === 'rejected';
    const hasPendingCourses = paymentData && paymentData.status === 'pending';

    return (
        <div className="mylearning-container">
            <div className="mylearning-inner">
                
                {/* Header */}
                <header className="mylearning-header">
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, <strong>{paymentData?.studentName || enrollments[0]?.studentName || 'Student'}</strong></p>
                </header>

                {/* 🔥 MULTIPLE COURSES VIEW */}
                {hasApprovedCourses && enrollments.length >= 1 && (
                    <div className="mylearning-multiple-courses">
                        <div className="mylearning-approved-header">
                            <FaGraduationCap size={28} />
                            <h2>Your Active Courses ({enrollments.length})</h2>
                        </div>
                        
                        <div className="courses-grid">
                            {enrollments.map((course, index) => (
                                <div key={course.courseId || index} className="course-card-mini">
                                    <div className="course-mini-banner">
                                        <FaVideo size={30} color="#22c55e" />
                                    </div>
                                    <div className="course-mini-content">
                                        <div className="mylearning-badge">ACTIVE</div>
                                        <h3>{course.courseTitle}</h3>
                                        <p>Mode: {course.mode || 'Live'} • Enrolled: {course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                        <button 
                                            className="mylearning-btn-start" 
                                            onClick={() => navigate('/student-dashboard')}
                                            style={{ width: '100%', marginTop: '15px' }}
                                        >
                                            <FaPlayCircle size={16} /> Continue Learning
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REJECTED STATE */}
                {hasRejectedCourses && (
                    <div className="mylearning-card mylearning-card-rejected">
                        <div className="mylearning-icon-circle mylearning-icon-rejected">
                            <FaExclamationTriangle size={45} color="#E13630" />
                        </div>
                        <h2>Payment Verification Failed</h2>
                        <p>We couldn't verify the payment for <strong>{paymentData.courseName}</strong>.</p>
                        {paymentData.rejectionReason && (
                            <div className="rejection-reason" style={{ 
                                background: '#fee2e2', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                marginBottom: '20px',
                                fontSize: '14px',
                                color: '#dc2626'
                            }}>
                                <strong>Reason:</strong> {paymentData.rejectionReason}
                            </div>
                        )}
                        <div className="mylearning-btn-group">
                            <button className="mylearning-btn-contact" onClick={() => navigate('/contact')}>
                                <FaHeadset /> Contact Support
                            </button>
                            <button className="mylearning-btn-resubmit" onClick={() => {
                                navigate('/payment-method/' + paymentData.courseId, {
                                    state: {
                                        enrollmentData: {
                                            fullName: paymentData.studentName,
                                            email: paymentData.studentEmail,
                                            cnic: paymentData.studentCnic
                                        },
                                        mode: paymentData.enrollmentMode || 'live',
                                        resubmit: true,
                                        previousPaymentId: paymentData._id
                                    }
                                });
                            }}>
                                Re-submit Payment
                            </button>
                        </div>
                    </div>
                )}

                {/* PENDING STATE */}
                {hasPendingCourses && (
                    <div className="mylearning-card mylearning-card-pending">
                        <div className="mylearning-icon-circle mylearning-icon-pending">
                            <FaClock size={45} color="#fab005" />
                        </div>
                        <h2>Verification in Progress</h2>
                        <p>Our team is currently reviewing your payment for <strong>{paymentData.courseName}</strong>.</p>
                        <div className="mylearning-eta">
                            ⏳ Expected Time: 2 - 4 Business Hours
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Styles - Same as before */}
            <style>{`
                /* ... keep all existing CSS styles ... */
                .mylearning-loading {
                    text-align: center;
                    padding: 100px 20px;
                    background: #fff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .mylearning-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #000B29;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: mylearning-spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                
                @keyframes mylearning-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .mylearning-loading h2 {
                    color: #000B29;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .mylearning-error {
                    text-align: center;
                    padding: 100px 20px;
                    background: #fff;
                    min-height: 100vh;
                }
                
                .mylearning-error h2 {
                    margin-top: 20px;
                    color: #000B29;
                    font-size: 24px;
                }
                
                .mylearning-error p {
                    color: #64748b;
                    margin: 10px 0;
                }
                
                .mylearning-btn-browse {
                    margin-top: 20px;
                    padding: 12px 30px;
                    background: #000B29;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .mylearning-btn-browse:hover {
                    background: #E30613;
                    transform: translateY(-2px);
                }
                
                .mylearning-container {
                    background: #fff;
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                
                .mylearning-inner {
                    max-width: 1100px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                }
                
                .mylearning-header {
                    margin-bottom: 40px;
                    text-align: left;
                }
                
                .mylearning-header h1 {
                    color: #000B29;
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                
                .mylearning-header p {
                    color: #64748b;
                    font-size: 16px;
                }
                
                .mylearning-header strong {
                    color: #000B29;
                }
                
                .mylearning-multiple-courses {
                    margin-bottom: 40px;
                }
                
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                    margin-top: 20px;
                }
                
                .course-card-mini {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    border: 1px solid #e2e8f0;
                    transition: transform 0.3s ease;
                }
                
                .course-card-mini:hover {
                    transform: translateY(-5px);
                }
                
                .course-mini-banner {
                    background: #000B29;
                    padding: 30px;
                    text-align: center;
                }
                
                .course-mini-content {
                    padding: 24px;
                }
                
                .course-mini-content h3 {
                    color: #000B29;
                    font-size: 18px;
                    margin: 10px 0;
                }
                
                .course-mini-content p {
                    color: #64748b;
                    font-size: 13px;
                    margin-bottom: 15px;
                }
                
                .mylearning-card {
                    background: #fff;
                    padding: 40px 30px;
                    border-radius: 24px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
                }
                
                .mylearning-card-rejected {
                    box-shadow: 0 20px 40px rgba(239, 68, 68, 0.1);
                    border: 1px solid #fee2e2;
                }
                
                .mylearning-card-pending {
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                
                .mylearning-icon-circle {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 25px;
                }
                
                .mylearning-icon-rejected {
                    background: #fef2f2;
                }
                
                .mylearning-icon-pending {
                    background: #fff9db;
                }
                
                .mylearning-card h2 {
                    color: #000B29;
                    font-size: 28px;
                    margin-bottom: 15px;
                }
                
                .mylearning-card p {
                    color: #64748b;
                    max-width: 600px;
                    margin: 0 auto 30px;
                    line-height: 1.8;
                }
                
                .mylearning-btn-group {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .mylearning-btn-contact {
                    padding: 15px 35px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }
                
                .mylearning-btn-contact:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }
                
                .mylearning-btn-resubmit {
                    padding: 15px 35px;
                    background: white;
                    color: #ef4444;
                    border: 2px solid #ef4444;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .mylearning-btn-resubmit:hover {
                    background: #fef2f2;
                    transform: translateY(-2px);
                }
                
                .mylearning-eta {
                    display: inline-block;
                    padding: 10px 20px;
                    background: #f8fafc;
                    border-radius: 30px;
                    color: #64748b;
                    font-size: 14px;
                    border: 1px solid #e2e8f0;
                }
                
                @media (max-width: 768px) {
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .mylearning-container {
                        padding: 30px 16px;
                    }
                    
                    .mylearning-header h1 {
                        font-size: 28px;
                    }
                    
                    .mylearning-card {
                        padding: 30px 20px;
                    }
                    
                    .mylearning-btn-group {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .mylearning-btn-contact,
                    .mylearning-btn-resubmit {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyLearning;