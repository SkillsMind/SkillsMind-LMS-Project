import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaPalette, FaMobileAlt, FaUsers, FaRocket } from 'react-icons/fa';
import './ServicePages.css';

const UIUXDesign = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="service-page-wrapper">
      <section className="service-hero-modern">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">UI/UX <span className="highlight">Designing</span></h1>
            <p className="hero-desc">Create beautiful, intuitive interfaces that users love.</p>
            <Link to="/contact" className="btn-primary">Get Started <FaArrowRight /></Link>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Design Project?</h2>
            <Link to="/contact" className="btn-primary-large">Contact Us Today <FaArrowRight /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UIUXDesign;