import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

import logoImage from '../../assets/Skills_Mind_Logo.png'; 

const Navbar = () => {
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/news">News & Events</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/contact">Instructor</Link></li>
          </ul>
        </div>

        {/* SECTION 3: RIGHT ACTIONS */}
        <div className="nav-actions">
          {/* Desktop Search Icon Only */}
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

      {/* MOBILE OVERLAYS */}
      <div className={`mobile-search-overlay ${isSearchVisible ? 'show' : ''}`}>
        <div className="mobile-search-box">
          <input type="text" placeholder="Please enter text to search" />
          <button className="go-btn-orange">GO</button>
        </div>
      </div>

      <div className={`mobile-sidebar-menu ${isMobileMenu ? 'open' : ''}`}>
        <ul className="sidebar-list">
          <li><Link to="/" onClick={() => setIsMobileMenu(false)}>Home</Link></li>
          <li><Link to="/courses" onClick={() => setIsMobileMenu(false)}>Courses</Link></li>
          <li><Link to="/news" onClick={() => setIsMobileMenu(false)}>News & Events</Link></li>
          <li><Link to="/how-it-works" onClick={() => setIsMobileMenu(false)}>How It Works</Link></li>
          <li><Link to="/blog" onClick={() => setIsMobileMenu(false)}>Blog</Link></li>
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