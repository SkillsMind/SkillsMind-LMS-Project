import React, { useState, useEffect } from 'react';
import { 
    FaClock, FaCheckCircle, FaPlayCircle, FaFileDownload, 
    FaLock, FaExclamationTriangle, FaHeadset, FaVideo,
    FaGraduationCap, FaBookOpen, FaArrowRight, FaCalendarAlt,
    FaChalkboardTeacher, FaStar, FaUsers
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
                
                const enrollRes = await axios.get(`${API_URL}/api/enroll/check-enrollment/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('MyLearning - Raw Enrollments:', enrollRes.data);
                
                if (enrollRes.data.success && enrollRes.data.enrolledCourses && enrollRes.data.enrolledCourses.length > 0) {
                    const uniqueCourses = [];
                    const seenCourseIds = new Set();
                    
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
                        }
                    });
                    
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

    const hasApprovedCourses = enrollments.length > 0;
    const hasRejectedCourses = paymentData && paymentData.status === 'rejected';
    const hasPendingCourses = paymentData && paymentData.status === 'pending';

    return (
        <div className="mylearning-container">
            <div className="mylearning-inner">
                
                {/* Header with Stats */}
                <header className="mylearning-header">
                    <div className="header-content">
                        <div className="header-left">
                            <div className="header-icon">
                                <FaGraduationCap size={32} />
                            </div>
                            <div>
                                <h1>My Learning Dashboard</h1>
                                <p>Welcome back, <strong>{paymentData?.studentName || enrollments[0]?.studentName || 'Student'}</strong></p>
                            </div>
                        </div>
                        <div className="header-stats">
                            <div className="stat-badge">
                                <FaBookOpen />
                                <span>{enrollments.length} Active Courses</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Active Courses Section */}
                {hasApprovedCourses && enrollments.length >= 1 && (
                    <div className="courses-section">
                        <div className="section-title">
                            <h2>Your Active Courses</h2>
                            <div className="title-underline"></div>
                        </div>
                        
                        <div className="courses-grid">
                            {enrollments.map((course, index) => (
                                <div key={course.courseId || index} className="course-card">
                                    <div className="card-badge">ACTIVE</div>
                                    <div className="card-icon">
                                        <FaVideo size={36} />
                                    </div>
                                    <div className="card-content">
                                        <h3>{course.courseTitle}</h3>
                                        <div className="card-meta">
                                            <div className="meta-item">
                                                <FaChalkboardTeacher size={12} />
                                                <span>{course.mode === 'live' ? 'Live Classes' : 'Recorded Course'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <FaCalendarAlt size={12} />
                                                <span>Enrolled: {course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                            </div>
                                            <div className="meta-item">
                                                <FaUsers size={12} />
                                                <span>Premium Access</span>
                                            </div>
                                        </div>
                                        <div className="card-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: '65%' }}></div>
                                            </div>
                                            <span className="progress-text">65% Complete</span>
                                        </div>
                                        <button 
                                            className="continue-btn"
                                            onClick={() => navigate('/student-dashboard')}
                                        >
                                            <FaPlayCircle size={16} />
                                            Continue Learning
                                            <FaArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rejected State */}
                {hasRejectedCourses && (
                    <div className="status-card rejected">
                        <div className="status-icon">
                            <FaExclamationTriangle size={48} />
                        </div>
                        <h2>Payment Verification Failed</h2>
                        <p>We couldn't verify the payment for <strong>{paymentData.courseName}</strong>.</p>
                        {paymentData.rejectionReason && (
                            <div className="rejection-reason">
                                <strong>Reason:</strong> {paymentData.rejectionReason}
                            </div>
                        )}
                        <div className="status-buttons">
                            <button className="btn-contact" onClick={() => navigate('/contact')}>
                                <FaHeadset /> Contact Support
                            </button>
                            <button className="btn-resubmit" onClick={() => {
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

                {/* Pending State */}
                {hasPendingCourses && (
                    <div className="status-card pending">
                        <div className="status-icon pending-icon">
                            <FaClock size={48} />
                        </div>
                        <h2>Verification in Progress</h2>
                        <p>Our team is currently reviewing your payment for <strong>{paymentData.courseName}</strong>.</p>
                        <div className="eta-badge">
                            ⏳ Expected Time: 2 - 4 Business Hours
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Styles */}
            <style>{`
                /* ============================================
                   MYLEARNING - PROFESSIONAL DESIGN
                ============================================ */
                
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
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                
                @keyframes spin {
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
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .mylearning-btn-browse:hover {
                    background: #E30613;
                    transform: translateY(-2px);
                }
                
                /* Main Container */
                .mylearning-container {
                    background: #f8fafc;
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                
                .mylearning-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                }
                
                /* Header */
                .mylearning-header {
                    background: white;
                    border-radius: 16px;
                    padding: 24px 32px;
                    margin-bottom: 40px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    border: 1px solid #e2e8f0;
                }
                
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .header-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #000B29, #001541);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .mylearning-header h1 {
                    color: #000B29;
                    font-size: 28px;
                    margin: 0 0 4px 0;
                    font-weight: 700;
                }
                
                .mylearning-header p {
                    color: #64748b;
                    font-size: 14px;
                    margin: 0;
                }
                
                .mylearning-header strong {
                    color: #000B29;
                }
                
                .header-stats .stat-badge {
                    background: #eef2ff;
                    padding: 10px 20px;
                    border-radius: 40px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #000B29;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                /* Section Title */
                .section-title {
                    margin-bottom: 28px;
                }
                
                .section-title h2 {
                    color: #1e293b;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                }
                
                .title-underline {
                    width: 60px;
                    height: 3px;
                    background: #e30613;
                    border-radius: 3px;
                }
                
                /* Courses Grid */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 28px;
                }
                
                .course-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    border: 1px solid #e2e8f0;
                    position: relative;
                }
                
                .course-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 30px -12px rgba(0,0,0,0.1);
                    border-color: #e30613;
                }
                
                .card-badge {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: #22c55e;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    z-index: 1;
                }
                
                .card-icon {
                    background: linear-gradient(135deg, #000B29, #001541);
                    padding: 32px;
                    text-align: center;
                    color: white;
                }
                
                .card-content {
                    padding: 24px;
                }
                
                .card-content h3 {
                    color: #1e293b;
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    line-height: 1.3;
                }
                
                .card-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #64748b;
                    font-size: 13px;
                }
                
                .meta-item svg {
                    color: #e30613;
                }
                
                .card-progress {
                    margin: 20px 0;
                }
                
                .progress-bar {
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: #e30613;
                    border-radius: 10px;
                }
                
                .progress-text {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .continue-btn {
                    width: 100%;
                    padding: 12px;
                    background: #000B29;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }
                
                .continue-btn:hover {
                    background: #e30613;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(227,6,19,0.2);
                }
                
                /* Status Cards */
                .status-card {
                    background: white;
                    border-radius: 20px;
                    padding: 48px 32px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    max-width: 500px;
                    margin: 0 auto;
                }
                
                .status-card.rejected {
                    border-top: 4px solid #dc2626;
                }
                
                .status-card.pending {
                    border-top: 4px solid #f59e0b;
                }
                
                .status-icon {
                    width: 80px;
                    height: 80px;
                    background: #fef2f2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #dc2626;
                }
                
                .status-icon.pending-icon {
                    background: #fef3c7;
                    color: #f59e0b;
                }
                
                .status-card h2 {
                    color: #1e293b;
                    font-size: 24px;
                    margin-bottom: 12px;
                }
                
                .status-card p {
                    color: #64748b;
                    margin-bottom: 20px;
                }
                
                .rejection-reason {
                    background: #fee2e2;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    color: #dc2626;
                    margin-bottom: 24px;
                }
                
                .status-buttons {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .btn-contact {
                    padding: 12px 28px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .btn-contact:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }
                
                .btn-resubmit {
                    padding: 12px 28px;
                    background: white;
                    color: #ef4444;
                    border: 2px solid #ef4444;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-resubmit:hover {
                    background: #fef2f2;
                    transform: translateY(-2px);
                }
                
                .eta-badge {
                    display: inline-block;
                    padding: 10px 20px;
                    background: #fef3c7;
                    border-radius: 30px;
                    color: #92400e;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .mylearning-container {
                        padding: 20px 16px;
                    }
                    
                    .mylearning-header {
                        padding: 20px;
                    }
                    
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .header-left {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .mylearning-header h1 {
                        font-size: 24px;
                    }
                    
                    .courses-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                    
                    .card-content h3 {
                        font-size: 18px;
                    }
                    
                    .status-card {
                        padding: 32px 20px;
                    }
                    
                    .status-card h2 {
                        font-size: 20px;
                    }
                    
                    .status-buttons {
                        flex-direction: column;
                    }
                    
                    .btn-contact, .btn-resubmit {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyLearning;