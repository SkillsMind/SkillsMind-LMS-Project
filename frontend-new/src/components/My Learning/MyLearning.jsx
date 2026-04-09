import React, { useState, useEffect } from 'react';
import { 
    FaClock, FaCheckCircle, FaPlayCircle, FaFileDownload, 
    FaLock, FaExclamationTriangle, FaHeadset, FaVideo 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLearning = () => {
    const navigate = useNavigate();
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const studentEmail = localStorage.getItem('studentEmail'); 

    useEffect(() => {
        const fetchStatus = async () => {
            if (!studentEmail) {
                setError("Session expired. Please log in again.");
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/my-status/${studentEmail}`);
                if (res.data) {
                    setPaymentData(res.data);
                } else {
                    setError("No enrollment record found.");
                }
            } catch (err) {
                setError("Unable to retrieve records. Check server.");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [studentEmail]);

    if (loading) {
        return (
            <div className="mylearning-loading">
                <div className="mylearning-spinner"></div>
                <h2>Accessing SkillsMind Portal...</h2>
            </div>
        );
    }

    if (error || !paymentData) {
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

    const currentStatus = paymentData.status ? paymentData.status.toLowerCase() : 'pending';
    const isApproved = currentStatus === 'approved';
    const isRejected = currentStatus === 'rejected';

    return (
        <div className="mylearning-container">
            <div className="mylearning-inner">
                
                {/* Header */}
                <header className="mylearning-header">
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, <strong>{paymentData.studentName}</strong></p>
                </header>

                {/* REJECTED STATE */}
                {/* REJECTED STATE */}
{isRejected && (
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
                {!isApproved && !isRejected && (
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

                {/* APPROVED STATE */}
                {isApproved && (
                    <div className="mylearning-approved">
                        <div className="mylearning-approved-header">
                            <FaCheckCircle size={28} />
                            <h2>Course Active & Verified</h2>
                        </div>

                        <div className="mylearning-approved-card">
                            {/* Left Banner */}
                            <div className="mylearning-banner">
                                <div className="mylearning-banner-icon">
                                    <FaVideo size={50} color="#22c55e" />
                                </div>
                                <h3>Live Class Ready</h3>
                                <p>Welcome to SkillsMind. Your premium access is now active.</p>
                            </div>

                            {/* Right Content */}
                            <div className="mylearning-content">
                                <div className="mylearning-badge">PREMIUM ENROLLMENT</div>
                                <h2>{paymentData.courseName}</h2>
                                <p>Your enrollment is successful. You now have full access to live interactive sessions, mentor support, and all exclusive learning resources.</p>
                                
                                <div className="mylearning-action-buttons">
                                    <button className="mylearning-btn-start" onClick={() => navigate('/student-dashboard')}>
                                        <FaPlayCircle size={20} /> Start Live Learning
                                    </button>
                                    <button className="mylearning-btn-resources">
                                        <FaFileDownload /> Resources
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Styles */}
            <style>{`
                /* ============================================
                   MYLEARNING - FULLY RESPONSIVE
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
                
                /* Error State */
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
                
                /* Main Container */
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
                
                /* Header */
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
                
                /* Common Card Styles */
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
                
                /* Approved State */
                .mylearning-approved {
                    animation: fadeIn 0.5s ease;
                }
                
                .mylearning-approved-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 25px;
                    color: #22c55e;
                }
                
                .mylearning-approved-header h2 {
                    margin: 0;
                    font-weight: 700;
                    font-size: 24px;
                }
                
                .mylearning-approved-card {
                    background: #fff;
                    border-radius: 24px;
                    overflow: hidden;
                    display: flex;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    min-height: 380px;
                }
                
                .mylearning-banner {
                    width: 320px;
                    background: #000B29;
                    color: white;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                
                .mylearning-banner-icon {
                    background: rgba(34, 197, 94, 0.15);
                    padding: 25px;
                    border-radius: 50%;
                    margin-bottom: 20px;
                }
                
                .mylearning-banner h3 {
                    font-size: 20px;
                    margin-bottom: 10px;
                }
                
                .mylearning-banner p {
                    font-size: 14px;
                    color: #94a3b8;
                }
                
                .mylearning-content {
                    padding: 50px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .mylearning-badge {
                    background: #dcfce7;
                    color: #16a34a;
                    padding: 6px 16px;
                    border-radius: 30px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    display: inline-block;
                    width: fit-content;
                    margin-bottom: 15px;
                }
                
                .mylearning-content h2 {
                    font-size: 32px;
                    color: #000B29;
                    margin: 0 0 15px 0;
                }
                
                .mylearning-content p {
                    color: #64748b;
                    font-size: 17px;
                    line-height: 1.7;
                    margin-bottom: 35px;
                }
                
                .mylearning-action-buttons {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .mylearning-btn-start {
                    background: #22c55e;
                    color: white;
                    padding: 14px 35px;
                    border: none;
                    border-radius: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);
                }
                
                .mylearning-btn-start:hover {
                    background: #16a34a;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 25px rgba(34, 197, 94, 0.3);
                }
                
                .mylearning-btn-resources {
                    background: white;
                    color: #000B29;
                    padding: 14px 30px;
                    border: 2px solid #e2e8f0;
                    border-radius: 15px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }
                
                .mylearning-btn-resources:hover {
                    border-color: #000B29;
                    transform: translateY(-2px);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* ============================================
                   RESPONSIVE BREAKPOINTS
                ============================================ */
                
                /* Tablet (768px - 1024px) */
                @media (max-width: 1024px) {
                    .mylearning-approved-card {
                        flex-direction: column;
                    }
                    
                    .mylearning-banner {
                        width: 100%;
                        flex-direction: row;
                        padding: 30px;
                        gap: 30px;
                    }
                    
                    .mylearning-banner-icon {
                        margin-bottom: 0;
                        padding: 20px;
                    }
                    
                    .mylearning-banner h3 {
                        font-size: 18px;
                    }
                    
                    .mylearning-banner p {
                        font-size: 13px;
                    }
                    
                    .mylearning-content {
                        padding: 40px;
                    }
                }
                
                /* Mobile (481px - 768px) */
                @media (max-width: 768px) {
                    .mylearning-container {
                        padding: 30px 16px;
                    }
                    
                    .mylearning-header h1 {
                        font-size: 28px;
                    }
                    
                    .mylearning-header p {
                        font-size: 14px;
                    }
                    
                    .mylearning-card {
                        padding: 30px 20px;
                    }
                    
                    .mylearning-card h2 {
                        font-size: 24px;
                    }
                    
                    .mylearning-card p {
                        font-size: 14px;
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
                    
                    .mylearning-approved-header h2 {
                        font-size: 20px;
                    }
                    
                    .mylearning-banner {
                        flex-direction: column;
                        text-align: center;
                        padding: 30px 20px;
                    }
                    
                    .mylearning-banner-icon {
                        margin-bottom: 15px;
                    }
                    
                    .mylearning-content {
                        padding: 30px 20px;
                        text-align: center;
                    }
                    
                    .mylearning-badge {
                        margin: 0 auto 15px;
                    }
                    
                    .mylearning-content h2 {
                        font-size: 24px;
                    }
                    
                    .mylearning-content p {
                        font-size: 15px;
                    }
                    
                    .mylearning-action-buttons {
                        justify-content: center;
                    }
                    
                    .mylearning-btn-start,
                    .mylearning-btn-resources {
                        padding: 12px 25px;
                        font-size: 14px;
                    }
                }
                
                /* Small Mobile (up to 480px) */
                @media (max-width: 480px) {
                    .mylearning-container {
                        padding: 20px 12px;
                    }
                    
                    .mylearning-header h1 {
                        font-size: 24px;
                    }
                    
                    .mylearning-card {
                        padding: 25px 15px;
                    }
                    
                    .mylearning-card h2 {
                        font-size: 20px;
                    }
                    
                    .mylearning-icon-circle {
                        width: 70px;
                        height: 70px;
                    }
                    
                    .mylearning-icon-circle svg {
                        width: 35px !important;
                        height: 35px !important;
                    }
                    
                    .mylearning-eta {
                        font-size: 12px;
                        padding: 8px 16px;
                    }
                    
                    .mylearning-banner {
                        padding: 25px 15px;
                    }
                    
                    .mylearning-banner-icon {
                        padding: 15px;
                    }
                    
                    .mylearning-banner-icon svg {
                        width: 35px !important;
                        height: 35px !important;
                    }
                    
                    .mylearning-banner h3 {
                        font-size: 16px;
                    }
                    
                    .mylearning-content {
                        padding: 25px 15px;
                    }
                    
                    .mylearning-content h2 {
                        font-size: 20px;
                    }
                    
                    .mylearning-action-buttons {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .mylearning-btn-start,
                    .mylearning-btn-resources {
                        justify-content: center;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyLearning;