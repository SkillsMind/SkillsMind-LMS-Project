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
            <div style={{ textAlign: 'center', padding: '100px', background: '#fff', height: '100vh' }}>
                <div style={{ 
                    border: '4px solid #f3f3f3', 
                    borderTop: '4px solid #000B29', 
                    borderRadius: '50%', 
                    width: '50px', 
                    height: '50px', 
                    animation: 'spin 1s linear infinite', 
                    margin: 'auto' 
                }}></div>
                <h2 style={{ color: '#000B29', marginTop: '20px', fontWeight: '600' }}>
                    Accessing SkillsMind Portal...
                </h2>
            </div>
        );
    }

    if (error || !paymentData) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', background: '#fff', height: '100vh' }}>
                <FaLock size={60} color="#64748b" />
                <h2 style={{ marginTop: '20px', color: '#000B29' }}>Access Restricted</h2>
                <p style={{ color: '#64748b' }}>{error}</p>
                <button 
                    onClick={() => navigate('/courses')} 
                    style={{ 
                        marginTop: '20px', 
                        padding: '12px 30px', 
                        background: '#000B29', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold' 
                    }}
                >
                    Browse Courses
                </button>
            </div>
        );
    }

    const currentStatus = paymentData.status ? paymentData.status.toLowerCase() : 'pending';
    const isApproved = currentStatus === 'approved';
    const isRejected = currentStatus === 'rejected';

    return (
        <div style={{ background: '#fff', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: 'auto', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
                
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ color: '#000B29', fontSize: '32px', marginBottom: '10px' }}>
                        Student Dashboard
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                        Welcome back, <b style={{ color: '#000B29' }}>{paymentData.studentName}</b>
                    </p>
                </header>

                {/* REJECTED STATE */}
                {isRejected && (
                    <div style={{ 
                        background: '#fff', 
                        padding: '60px 40px', 
                        borderRadius: '24px', 
                        boxShadow: '0 20px 40px rgba(239, 68, 68, 0.1)', 
                        border: '1px solid #fee2e2', 
                        textAlign: 'center' 
                    }}>
                        <div style={{ 
                            background: '#fef2f2', 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 25px' 
                        }}>
                            <FaExclamationTriangle size={45} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#000B29', fontSize: '28px' }}>
                            Payment Verification Failed
                        </h2>
                        <p style={{ color: '#64748b', maxWidth: '600px', margin: '15px auto 30px', lineHeight: '1.8' }}>
                            We couldn't verify the payment for <b>{paymentData.courseName}</b>.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button 
                                onClick={() => navigate('/contact')} 
                                style={{ 
                                    padding: '15px 35px', 
                                    background: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px' 
                                }}
                            >
                                <FaHeadset /> Contact Support
                            </button>
                            <button 
                                onClick={() => navigate('/get-enrolment')} 
                                style={{ 
                                    padding: '15px 35px', 
                                    background: 'white', 
                                    color: '#ef4444', 
                                    border: '2px solid #ef4444', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold' 
                                }}
                            >
                                Re-submit Payment
                            </button>
                        </div>
                    </div>
                )}

                {/* PENDING STATE */}
                {!isApproved && !isRejected && (
                    <div style={{ 
                        background: '#fff', 
                        padding: '60px 40px', 
                        borderRadius: '24px', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)', 
                        border: '1px solid #e2e8f0', 
                        textAlign: 'center' 
                    }}>
                        <div style={{ 
                            background: '#fff9db', 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 25px' 
                        }}>
                            <FaClock size={45} color="#fab005" />
                        </div>
                        <h2 style={{ color: '#000B29', fontSize: '28px' }}>
                            Verification in Progress
                        </h2>
                        <p style={{ color: '#64748b', maxWidth: '600px', margin: '15px auto 30px', lineHeight: '1.8' }}>
                            Our team is currently reviewing your payment for <b>{paymentData.courseName}</b>.
                        </p>
                        <div style={{ 
                            display: 'inline-block', 
                            padding: '10px 20px', 
                            background: '#f8fafc', 
                            borderRadius: '30px', 
                            color: '#64748b', 
                            fontSize: '14px', 
                            border: '1px solid #e2e8f0' 
                        }}>
                           ⏳ Expected Time: 2 - 4 Business Hours
                        </div>
                    </div>
                )}

                {/* APPROVED STATE - YAHAN SE NEW DASHBOARD KHULEGA */}
                {isApproved && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            marginBottom: '25px', 
                            color: '#22c55e' 
                        }}>
                            <FaCheckCircle size={28} />
                            <h2 style={{ margin: 0, fontWeight: '700' }}>
                                Course Active & Verified
                            </h2>
                        </div>

                        <div style={{ 
                            background: '#fff', 
                            borderRadius: '24px', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', 
                            border: '1px solid #e2e8f0', 
                            minHeight: '380px' 
                        }}>
                            {/* Left Banner */}
                            <div style={{ 
                                width: '320px', 
                                background: '#000B29', 
                                color: 'white', 
                                padding: '40px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                textAlign: 'center' 
                            }}>
                                <div style={{ 
                                    background: 'rgba(34, 197, 94, 0.15)', 
                                    padding: '25px', 
                                    borderRadius: '50%', 
                                    marginBottom: '20px' 
                                }}>
                                    <FaVideo size={50} color="#22c55e" />
                                </div>
                                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                                    Live Class Ready
                                </h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                                    Welcome to SkillsMind. Your premium access is now active.
                                </p>
                            </div>

                            {/* Right Content */}
                            <div style={{ 
                                padding: '50px', 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center' 
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    marginBottom: '15px' 
                                }}>
                                    <span style={{ 
                                        background: '#dcfce7', 
                                        color: '#16a34a', 
                                        padding: '6px 16px', 
                                        borderRadius: '30px', 
                                        fontSize: '12px', 
                                        fontWeight: '800', 
                                        letterSpacing: '0.5px' 
                                    }}>
                                        PREMIUM ENROLLMENT
                                    </span>
                                </div>
                                <h2 style={{ 
                                    fontSize: '36px', 
                                    color: '#000B29', 
                                    margin: '0 0 15px 0' 
                                }}>
                                    {paymentData.courseName}
                                </h2>
                                <p style={{ 
                                    color: '#64748b', 
                                    fontSize: '17px', 
                                    lineHeight: '1.7', 
                                    marginBottom: '35px' 
                                }}>
                                    Your enrollment is successful. You now have full access to live 
                                    interactive sessions, mentor support, and all exclusive learning resources.
                                </p>
                                
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    {/* 🎯 YEH BUTTON AB NEW DASHBOARD PE LE JAYEGA */}
                                    <button 
                                        onClick={() => navigate('/student-dashboard')}
                                        style={{ 
                                            background: '#22c55e', 
                                            color: 'white', 
                                            padding: '18px 40px', 
                                            border: 'none', 
                                            borderRadius: '15px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px', 
                                            fontSize: '16px', 
                                            boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <FaPlayCircle size={20} /> Start Live Learning
                                    </button>
                                    
                                    <button 
                                        style={{ 
                                            background: 'white', 
                                            color: '#000B29', 
                                            padding: '18px 30px', 
                                            border: '2px solid #e2e8f0', 
                                            borderRadius: '15px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px', 
                                            fontSize: '16px' 
                                        }}
                                    >
                                        <FaFileDownload /> Resources
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default MyLearning;