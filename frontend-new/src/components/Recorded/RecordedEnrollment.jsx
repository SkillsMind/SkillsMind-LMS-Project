import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlayCircle, FaInfinity, FaCertificate, FaDownload, FaRocket } from 'react-icons/fa';
import './RecordedEnrollment.css';

const RecordedEnrollment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { course } = location.state || {};

    if (!course) return <div className="error-boundary">Course data not found!</div>;

    return (
        <div className="recorded-enroll-container">
            {/* Header */}
            <nav className="enroll-nav">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <FaArrowLeft /> Back
                </button>
                <div className="sm-brand">Skills<span>Mind</span> On-Demand</div>
            </nav>

            <div className="recorded-wrapper">
                <motion.div 
                    className="recorded-main-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="recorded-header">
                        <div className="rec-badge">Self-Paced Learning</div>
                        <h1>Instant Access: {course.title}</h1>
                        <p>Unlock all modules immediately and learn according to your own schedule.</p>
                    </div>

                    <div className="recorded-perks-grid">
                        <div className="perk-box">
                            <FaInfinity color="#dc2626" />
                            <span>Lifetime Access</span>
                        </div>
                        <div className="perk-box">
                            <FaDownload color="#dc2626" />
                            <span>Downloadable Assets</span>
                        </div>
                        <div className="perk-box">
                            <FaCertificate color="#dc2626" />
                            <span>Verified Certificate</span>
                        </div>
                    </div>

                    <div className="enrollment-action-box">
                        <div className="price-display">
                            <span className="label">Total Investment:</span>
                            <span className="price">Rs. {course.price}</span>
                        </div>
                        <button className="confirm-recorded-btn">
                            Get Instant Access <FaRocket />
                        </button>
                    </div>
                </motion.div>

                {/* Course Sidebar Info */}
                <div className="recorded-sidebar">
                    <div className="sidebar-course-card">
                        <img src={course.thumbnail || 'https://via.placeholder.com/300'} alt={course.title} />
                        <div className="sidebar-info">
                            <h4>{course.title}</h4>
                            <span>Ready to stream in 4K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordedEnrollment; // Yeh line error khatam karegi