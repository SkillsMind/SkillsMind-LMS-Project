// Hero.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';
import img1 from '../../Pictures/Hero1.png';
import LoginSignup from '../LoginSignup/LoginSignup';

const Hero = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [popupShown, setPopupShown] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  // Registration deadline: 30 April 2026
  const registrationDeadline = new Date(2026, 3, 30); // April is 3 (0-indexed)
  const [daysLeft, setDaysLeft] = useState(0);

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  };

  // Calculate days remaining until deadline
  useEffect(() => {
    const calculateDaysLeft = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = registrationDeadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays > 0 ? diffDays : 0);
    };
    calculateDaysLeft();
  }, []);

  // Handle navigation after login check
  const handleNavigateToCourses = () => {
    if (isLoggedIn()) {
      navigate('/get-enrolment');
    } else {
      setRedirectPath('/get-enrolment');
      setShowModal(true);
    }
  };

  const handleJoinForFree = () => {
    if (isLoggedIn()) {
      navigate('/get-enrolment');
    } else {
      setRedirectPath('/get-enrolment');
      setShowModal(true);
    }
  };

  // Auto modal popup for non-logged in users (5 seconds)
  useEffect(() => {
    if (!isLoggedIn() && !popupShown) {
      const timer = setTimeout(() => {
        setPopupShown(true);
        setRedirectPath('/get-enrolment');
        setShowModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [popupShown]);

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setShowModal(false);
    if (redirectPath) {
      navigate(redirectPath);
    }
  };

  return (
    <>
      {/* ========== NOTICE BOARD WITH TICKER (DIGISKILL STYLE) ========== */}
      <div className="notice-ticker-wrapper">
        <div className="notice-container">
          <div className="notice-label">
            📢 ANNOUNCEMENT
          </div>
          <div className="ticker-area">
            <div className="ticker-slide">
              <span>🔥 <strong>BATCH 04</strong> – Limited Seats! Registration Closes: <strong className="deadline-date">30 April 2026</strong> {daysLeft > 0 && `(${daysLeft} days left)`}</span>
              <span>🚀 100+ Freelancing & Tech Courses | Earn While You Learn</span>
              <span>🎓 Get Certified by SkillsMind & Industry Partners</span>
              <span>📌 Live Q&A Sessions Every Week | Mentorship Available</span>
              <span>⭐ 350+ Students Already Enrolled in Batch 3</span>
              <span>💻 New Courses: AI, Web Dev, Cloud Computing, Graphic Design</span>
              <span>🔥 <strong>BATCH 04</strong> – Register Before 30 April 2026!</span>
            </div>
          </div>
          <div className="deadline-pill">
            📅 Last Date: <span className="date-highlight">30 April 2026</span>
            {daysLeft > 0 && <span className="days-badge">{daysLeft} days remaining</span>}
          </div>
        </div>
      </div>

      {/* ========== MAIN HERO SECTION ========== */}
      <section className="hero-bright">
        <div className="hero-container">
          
          {/* Left Side: Image with Shapes */}
          <div className="hero-visual animate-from-left">
            <div className="shape-blob-red"></div>
            <div className="shape-polygon-blue"></div>
            
            <div className="image-main-wrapper">
              <img 
                src={img1} 
                alt="SkillsMind Representative" 
                className="hero-main-img-clean"
              />
            </div>

            <div className="dots-grid-pattern"></div>
          </div>

          {/* Right Side: Text Content */}
          <div className="hero-text-content animate-from-right">
            <div className="batch-badge">
              🎯 BATCH 04 - REGISTRATION OPEN
            </div>
            <h1>
              Unlock Your Potential. <br />
              <span className="blue-highlight">Master New Skills</span> With <span className="red-highlight">SkillsMind</span>
            </h1>
            <p>
              Join Pakistan's most advanced learning management system. 
              Empowering youth with industry-leading digital skills.
              <strong className="deadline-note"> Last date to enroll: 30 April 2026</strong>
            </p>
            <div className="hero-action-btns"> 
              <button 
                className="btn-browse-sharp" 
                onClick={handleNavigateToCourses}
              >
                Browse Courses
              </button>
              <button 
                className="btn-join-sharp" 
                onClick={handleJoinForFree}
              >
                Join For Free
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Modal with LoginSignup component */}
      {showModal && (
        <div className="hero-modal-overlay" onClick={handleModalClose}>
          <div className="hero-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="hero-modal-close" onClick={handleModalClose}>✕</button>
            <LoginSignup 
              onSuccess={handleLoginSuccess}
              isModalMode={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;