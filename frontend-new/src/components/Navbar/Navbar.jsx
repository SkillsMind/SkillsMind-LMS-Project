import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes, FaChevronDown, FaVideo } from 'react-icons/fa';
import './Navbar.css';

import logoImage from '../../assets/Skills_Mind_Logo.png'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = () => {
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeWebinars, setActiveWebinars] = useState([]);
  const [showWebinarDropdown, setShowWebinarDropdown] = useState(false);
  const [hasActiveWebinar, setHasActiveWebinar] = useState(false);
  const [loadingWebinars, setLoadingWebinars] = useState(true);
  
  const navigate = useNavigate();

  // Fetch active webinars on mount
  useEffect(() => {
    fetchActiveWebinars();
  }, []);

  const fetchActiveWebinars = async () => {
    try {
      const response = await fetch(`${API_URL}/api/webinar/active/all`);
      const data = await response.json();
      
      if (data.success && data.webinars && data.webinars.length > 0) {
        setActiveWebinars(data.webinars);
        setHasActiveWebinar(true);
      } else {
        setHasActiveWebinar(false);
      }
    } catch (error) {
      console.error('Error fetching webinars:', error);
      setHasActiveWebinar(false);
    } finally {
      setLoadingWebinars(false);
    }
  };

  // Handle Courses click with DIRECT localStorage check (MOST SECURE)
  const handleCoursesClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const isLoggedIn = !!(token && userId);
    
    if (isLoggedIn) {
      navigate('/get-enrolment');
    } else {
      localStorage.setItem('redirectAfterLogin', '/get-enrolment');
      navigate('/login');
    }
  };

  // Handle Webinar click
  const handleWebinarClick = (e) => {
    e.preventDefault();
    navigate('/webinar');
    setShowWebinarDropdown(false);
    setIsMobileMenu(false);
  };

  // Handle direct webinar course click from dropdown
  const handleCourseWebinarClick = (courseId) => {
    navigate('/webinar');
    setShowWebinarDropdown(false);
    setIsMobileMenu(false);
  };

  return (
    <nav className="skillsmind-nav">
      <div className="nav-container">
        
        {/* SECTION 1: LOGO */}
        <div className="nav-logo">
          <Link to="/">
            <img src={logoImage} alt="SkillsMind" />
          </Link>
        </div>

        {/* SECTION 2: DESKTOP LINKS */}
        <div className="nav-links-wrapper">
          <ul className="desktop-links">
            <li><Link to="/">Home</Link></li>
            <li>
              <Link 
                to="#" 
                onClick={handleCoursesClick}
                style={{ color: '#ffffff' }}
              >
                Courses
              </Link>
            </li>
            
            {/* 🔥🔥🔥 WEBINAR TAB - Only show if active webinars exist 🔥🔥🔥 */}
            {hasActiveWebinar && (
              <li 
                className="webinar-nav-item"
                onMouseEnter={() => setShowWebinarDropdown(true)}
                onMouseLeave={() => setShowWebinarDropdown(false)}
              >
                <Link 
                  to="/webinar" 
                  className="webinar-nav-link"
                  onClick={handleWebinarClick}
                >
                  <FaVideo size={14} />
                  <span>Webinar</span>
                  <FaChevronDown size={10} className="dropdown-arrow" />
                </Link>
                
                {/* Webinar Dropdown - Shows all active webinars */}
                {showWebinarDropdown && activeWebinars.length > 0 && (
                  <div className="webinar-dropdown">
                    <div className="dropdown-header">
                      <span>Live Webinars</span>
                    </div>
                    {activeWebinars.map(webinar => (
                      <div 
                        key={webinar._id} 
                        className="dropdown-item"
                        onClick={() => handleCourseWebinarClick(webinar.courseId)}
                      >
                        <div className="dropdown-item-icon">
                          <FaVideo size={12} />
                        </div>
                        <div className="dropdown-item-content">
                          <div className="dropdown-item-title">{webinar.title}</div>
                          <div className="dropdown-item-course">{webinar.courseName}</div>
                          <div className="dropdown-item-date">
                            {webinar.startDate ? new Date(webinar.startDate).toLocaleDateString() : 'Coming Soon'}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="dropdown-footer">
                      <Link to="/webinar" onClick={() => setShowWebinarDropdown(false)}>
                        View All Webinars →
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            )}
            
            <li><Link to="/news">News & Events</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* SECTION 3: RIGHT ACTIONS */}
        <div className="nav-actions">
          <div className="desktop-search-icon" onClick={() => setIsSearchVisible(!isSearchVisible)}>
            <FaSearch />
          </div>

          <div className="mobile-search-icon" onClick={() => setIsSearchVisible(!isSearchVisible)}>
            <FaSearch />
          </div>

          <div className="auth-group">
            <Link to="/login" className="signin-text">Sign In</Link>
            <Link to="/signup" className="signup-btn-red">Sign Up</Link>
          </div>

          <div className="mobile-menu-toggle" onClick={() => setIsMobileMenu(!isMobileMenu)}>
            {isMobileMenu ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </div>

      {/* MOBILE SEARCH OVERLAY */}
      <div className={`mobile-search-overlay ${isSearchVisible ? 'show' : ''}`}>
        <div className="mobile-search-box">
          <input type="text" placeholder="Please enter text to search" />
          <button className="go-btn-orange">GO</button>
        </div>
      </div>

      {/* MOBILE SIDEBAR MENU */}
      <div className={`mobile-sidebar-menu ${isMobileMenu ? 'open' : ''}`}>
        <ul className="sidebar-list">
          <li><Link to="/" onClick={() => setIsMobileMenu(false)}>Home</Link></li>
          <li>
            <Link 
              to="#" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenu(false);
                handleCoursesClick(e);
              }}
            >
              Courses
            </Link>
          </li>
          
          {/* 🔥 Mobile Webinar Link (Only if active) */}
          {hasActiveWebinar && (
            <li>
              <Link 
                to="/webinar" 
                onClick={() => setIsMobileMenu(false)}
                className="mobile-webinar-link"
              >
                <FaVideo size={14} />
                <span>Webinar</span>
                {activeWebinars.length > 0 && (
                  <span className="mobile-webinar-badge">{activeWebinars.length}</span>
                )}
              </Link>
            </li>
          )}
          
          <li><Link to="/news" onClick={() => setIsMobileMenu(false)}>News & Events</Link></li>
          <li><Link to="/how-it-works" onClick={() => setIsMobileMenu(false)}>How It Works</Link></li>
          <li><Link to="/faqs" onClick={() => setIsMobileMenu(false)}>FAQs</Link></li>
          <li><Link to="/contact" onClick={() => setIsMobileMenu(false)}>Contact Us</Link></li>
          <hr className="divider" />
          <li><Link to="/login" onClick={() => setIsMobileMenu(false)}>Sign In</Link></li>
          <li><Link to="/signup" className="sidebar-signup" onClick={() => setIsMobileMenu(false)}>Sign Up</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;