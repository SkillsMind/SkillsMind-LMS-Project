import React, { useState, useEffect } from 'react';
import { 
    FaClock, FaCheckCircle, FaPlayCircle, FaFileDownload, 
    FaLock, FaExclamationTriangle, FaHeadset, FaVideo,
    FaGraduationCap, FaBookOpen, FaArrowRight, FaCalendarAlt,
    FaChalkboardTeacher, FaSpinner, FaHourglassHalf, FaTimesCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLearning = () => {
    const navigate = useNavigate();
    const [paymentData, setPaymentData] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [rejectedPayments, setRejectedPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('approved');

    const studentEmail = localStorage.getItem('studentEmail');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchAllStatus = async () => {
            if (!studentEmail || !userId) {
                setError("Session expired. Please log in again.");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                
                // 1. Fetch ACTIVE enrollments (payment approved)
                const enrollRes = await axios.get(`${API_URL}/api/enroll/check-enrollment/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (enrollRes.data.success && enrollRes.data.enrolledCourses) {
                    const uniqueCourses = [];
                    const seenCourseIds = new Set();
                    
                    enrollRes.data.enrolledCourses.forEach(course => {
                        const courseId = course.courseId?.toString();
                        if (courseId && !seenCourseIds.has(courseId)) {
                            seenCourseIds.add(courseId);
                            uniqueCourses.push(course);
                        }
                    });
                    
                    setEnrollments(uniqueCourses);
                }
                
                // 2. Fetch PENDING payments
                const pendingRes = await axios.get(`${API_URL}/api/payments/my-status/${studentEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (pendingRes.data && pendingRes.data.status === 'pending') {
                    setPendingPayments([{
                        courseId: pendingRes.data.courseId,
                        courseName: pendingRes.data.courseName,
                        amount: pendingRes.data.amount,
                        submittedAt: pendingRes.data.createdAt,
                        paymentId: pendingRes.data._id
                    }]);
                } else if (pendingRes.data && pendingRes.data.status === 'rejected') {
                    setRejectedPayments([{
                        courseId: pendingRes.data.courseId,
                        courseName: pendingRes.data.courseName,
                        amount: pendingRes.data.amount,
                        rejectionReason: pendingRes.data.rejectionReason,
                        rejectedAt: pendingRes.data.updatedAt,
                        paymentId: pendingRes.data._id
                    }]);
                }
                
                // 3. Also check rejected from enrollment API
                const rejectedRes = await axios.get(`${API_URL}/api/enroll/check-rejected/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => ({ data: { rejectedCourses: [] } }));
                
                if (rejectedRes.data?.rejectedCourses?.length > 0) {
                    setRejectedPayments(prev => [...prev, ...rejectedRes.data.rejectedCourses]);
                }
                
            } catch (err) {
                console.error('MyLearning Error:', err);
                setError("Unable to retrieve records. Check server.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllStatus();
    }, [studentEmail, userId, token, API_URL]);

    const getStatusColor = (status) => {
        switch(status) {
            case 'approved': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'rejected': return '#dc2626';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'approved': return <FaCheckCircle size={18} />;
            case 'pending': return <FaHourglassHalf size={18} />;
            case 'rejected': return <FaTimesCircle size={18} />;
            default: return <FaClock size={18} />;
        }
    };

    if (loading) {
        return (
            <div className="mylearning-loading">
                <div className="mylearning-spinner"></div>
                <h2>Loading your dashboard...</h2>
            </div>
        );
    }

    const hasApprovedCourses = enrollments.length > 0;
    const hasPendingPayments = pendingPayments.length > 0;
    const hasRejectedPayments = rejectedPayments.length > 0;

    return (
        <div className="mylearning-container">
            <div className="mylearning-inner">
                
                {/* Header */}
                <header className="mylearning-header">
                    <div className="header-content">
                        <div className="header-left">
                            <div className="header-icon">
                                <FaGraduationCap size={32} />
                            </div>
                            <div>
                                <h1>My Learning</h1>
                                <p>Track your courses and payments</p>
                            </div>
                        </div>
                        <div className="header-stats">
                            <div className="stat-badge approved">
                                <FaCheckCircle />
                                <span>{enrollments.length} Active</span>
                            </div>
                            {hasPendingPayments && (
                                <div className="stat-badge pending">
                                    <FaHourglassHalf />
                                    <span>{pendingPayments.length} Pending</span>
                                </div>
                            )}
                            {hasRejectedPayments && (
                                <div className="stat-badge rejected">
                                    <FaTimesCircle />
                                    <span>{rejectedPayments.length} Rejected</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                {(hasPendingPayments || hasRejectedPayments) && (
                    <div className="mylearning-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('approved')}
                        >
                            <FaCheckCircle /> Active Courses
                            {enrollments.length > 0 && <span className="tab-count">{enrollments.length}</span>}
                        </button>
                        {hasPendingPayments && (
                            <button 
                                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                <FaHourglassHalf /> Pending
                                <span className="tab-count pending">{pendingPayments.length}</span>
                            </button>
                        )}
                        {hasRejectedPayments && (
                            <button 
                                className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rejected')}
                            >
                                <FaTimesCircle /> Rejected
                                <span className="tab-count rejected">{rejectedPayments.length}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Active Courses Section */}
                {activeTab === 'approved' && (
                    <div className="courses-section">
                        {enrollments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaBookOpen size={48} />
                                </div>
                                <h3>No Active Courses</h3>
                                <p>You haven't enrolled in any courses yet.</p>
                                <button className="browse-btn" onClick={() => navigate('/get-enrolment')}>
                                    Browse Courses
                                </button>
                            </div>
                        ) : (
                            <div className="courses-grid">
                                {enrollments.map((course, index) => (
                                    <div key={course.courseId || index} className="course-card approved">
                                        <div className="card-status approved">
                                            <FaCheckCircle /> Active
                                        </div>
                                        <div className="card-icon">
                                            <FaVideo size={36} />
                                        </div>
                                        <div className="card-content">
                                            <h3>{course.courseTitle}</h3>
                                            <div className="card-meta">
                                                <div className="meta-item">
                                                    <FaChalkboardTeacher />
                                                    <span>{course.mode === 'live' ? 'Live Classes' : 'Recorded Course'}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <FaCalendarAlt />
                                                    <span>Enrolled: {course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button 
                                                className="continue-btn"
                                                onClick={() => navigate('/student-dashboard')}
                                            >
                                                <FaPlayCircle /> Continue Learning
                                                <FaArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending Payments Section */}
                {activeTab === 'pending' && (
                    <div className="payments-section">
                        {pendingPayments.map((payment, index) => (
                            <div key={index} className="payment-card pending">
                                <div className="card-status pending">
                                    <FaHourglassHalf /> Pending Verification
                                </div>
                                <div className="payment-icon">
                                    <FaSpinner size={36} className="spin" />
                                </div>
                                <div className="payment-content">
                                    <h3>{payment.courseName}</h3>
                                    <div className="payment-details">
                                        <div className="detail-item">
                                            <span>Amount:</span>
                                            <strong>Rs. {payment.amount}</strong>
                                        </div>
                                        <div className="detail-item">
                                            <span>Submitted:</span>
                                            <strong>{new Date(payment.submittedAt).toLocaleDateString()}</strong>
                                        </div>
                                    </div>
                                    <div className="pending-message">
                                        <FaClock />
                                        <span>Your payment is being verified. You'll get access within 2-4 hours.</span>
                                    </div>
                                    <button className="track-btn" onClick={() => navigate('/contact')}>
                                        Track Status
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rejected Payments Section */}
                {activeTab === 'rejected' && (
                    <div className="payments-section">
                        {rejectedPayments.map((payment, index) => (
                            <div key={index} className="payment-card rejected">
                                <div className="card-status rejected">
                                    <FaTimesCircle /> Payment Rejected
                                </div>
                                <div className="payment-icon rejected-icon">
                                    <FaExclamationTriangle size={36} />
                                </div>
                                <div className="payment-content">
                                    <h3>{payment.courseName}</h3>
                                    <div className="rejection-reason-box">
                                        <strong>Reason for rejection:</strong>
                                        <p>{payment.rejectionReason || 'Unable to verify payment details. Please resubmit with correct information.'}</p>
                                    </div>
                                    <div className="payment-details">
                                        <div className="detail-item">
                                            <span>Rejected on:</span>
                                            <strong>{new Date(payment.rejectedAt || Date.now()).toLocaleDateString()}</strong>
                                        </div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="resubmit-btn" onClick={() => {
                                            navigate('/payment-method/' + payment.courseId, {
                                                state: {
                                                    enrollmentData: {
                                                        fullName: localStorage.getItem('userName'),
                                                        email: studentEmail
                                                    },
                                                    mode: 'live',
                                                    resubmit: true,
                                                    previousPaymentId: payment.paymentId
                                                }
                                            });
                                        }}>
                                            Resubmit Payment
                                        </button>
                                        <button className="contact-btn" onClick={() => navigate('/contact')}>
                                            Contact Support
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CSS Styles */}
            <style>{`
                .mylearning-loading {
                    text-align: center;
                    padding: 100px 20px;
                    background: #f8fafc;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .mylearning-spinner {
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #e30613;
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
                
                .mylearning-container {
                    background: #f8fafc;
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                
                .mylearning-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                /* Header */
                .mylearning-header {
                    background: white;
                    border-radius: 20px;
                    padding: 24px 32px;
                    margin-bottom: 32px;
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
                
                .header-stats {
                    display: flex;
                    gap: 12px;
                }
                
                .stat-badge {
                    padding: 8px 16px;
                    border-radius: 40px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .stat-badge.approved {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .stat-badge.pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                
                .stat-badge.rejected {
                    background: #fee2e2;
                    color: #dc2626;
                }
                
                /* Tabs */
                .mylearning-tabs {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }
                
                .tab-btn {
                    padding: 10px 24px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 40px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .tab-btn.active {
                    background: #000B29;
                    color: white;
                    border-color: #000B29;
                }
                
                .tab-count {
                    background: rgba(0,0,0,0.1);
                    padding: 2px 8px;
                    border-radius: 20px;
                    font-size: 11px;
                }
                
                .tab-btn.active .tab-count {
                    background: rgba(255,255,255,0.2);
                }
                
                .tab-count.pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                
                .tab-count.rejected {
                    background: #fee2e2;
                    color: #dc2626;
                }
                
                /* Courses Grid */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
                }
                
                .card-status {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .card-status.approved {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .card-status.pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                
                .card-status.rejected {
                    background: #fee2e2;
                    color: #dc2626;
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
                }
                
                .card-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 24px;
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
                }
                
                /* Payment Cards */
                .payments-section {
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .payment-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 24px;
                }
                
                .payment-card.pending {
                    border-left: 4px solid #f59e0b;
                }
                
                .payment-card.rejected {
                    border-left: 4px solid #dc2626;
                }
                
                .payment-icon {
                    background: #fef3c7;
                    padding: 32px;
                    text-align: center;
                    color: #d97706;
                }
                
                .payment-icon.rejected-icon {
                    background: #fee2e2;
                    color: #dc2626;
                }
                
                .payment-content {
                    padding: 24px;
                }
                
                .payment-content h3 {
                    color: #1e293b;
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                }
                
                .payment-details {
                    display: flex;
                    gap: 24px;
                    margin: 16px 0;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 12px;
                }
                
                .detail-item {
                    display: flex;
                    gap: 8px;
                    font-size: 13px;
                }
                
                .detail-item span {
                    color: #64748b;
                }
                
                .detail-item strong {
                    color: #1e293b;
                }
                
                .pending-message {
                    background: #fef3c7;
                    padding: 12px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    color: #92400e;
                    margin: 16px 0;
                }
                
                .rejection-reason-box {
                    background: #fee2e2;
                    padding: 16px;
                    border-radius: 12px;
                    margin: 16px 0;
                }
                
                .rejection-reason-box strong {
                    color: #dc2626;
                    display: block;
                    margin-bottom: 8px;
                }
                
                .rejection-reason-box p {
                    color: #7f1a1a;
                    margin: 0;
                    font-size: 14px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }
                
                .resubmit-btn {
                    flex: 1;
                    padding: 12px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .resubmit-btn:hover {
                    background: #b91c1c;
                    transform: translateY(-2px);
                }
                
                .contact-btn, .track-btn {
                    flex: 1;
                    padding: 12px;
                    background: #f1f5f9;
                    color: #1e293b;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .contact-btn:hover, .track-btn:hover {
                    background: #e2e8f0;
                }
                
                .spin {
                    animation: spin 2s linear infinite;
                }
                
                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                }
                
                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #94a3b8;
                }
                
                .empty-state h3 {
                    color: #1e293b;
                    margin-bottom: 8px;
                }
                
                .empty-state p {
                    color: #64748b;
                    margin-bottom: 24px;
                }
                
                .browse-btn {
                    padding: 12px 28px;
                    background: #000B29;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .browse-btn:hover {
                    background: #e30613;
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
                    }
                    
                    .mylearning-header h1 {
                        font-size: 24px;
                    }
                    
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .payment-details {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyLearning;