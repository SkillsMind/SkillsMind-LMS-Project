import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';
import img1 from '../../Pictures/Hero1.png';
import LoginSignup from '../LoginSignup/LoginSignup'; // Your existing component

const Hero = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [popupShown, setPopupShown] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  };

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
          <h1>
            Unlock Your Potential. <br />
            <span className="blue-highlight">Master New Skills</span> With <span className="red-highlight">SkillsMind</span>
          </h1>
          <p>
            Join Pakistan's most advanced learning management system. 
            Empowering youth with industry-leading digital skills. 
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

      {/* Modal with your existing LoginSignup component */}
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
    </section>
  );
};

export default Hero;