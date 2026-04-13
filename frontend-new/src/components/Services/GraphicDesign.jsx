import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import './ServicePages.css';

const GraphicDesign = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="service-page-wrapper">
      <section className="service-hero-modern">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Graphic <span className="highlight">Designing</span></h1>
            <p className="hero-desc">Create stunning visuals that capture attention.</p>
            <Link to="/contact" className="btn-primary">Get Started <FaArrowRight /></Link>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Design Your Brand?</h2>
            <Link to="/contact" className="btn-primary-large">Contact Us Today <FaArrowRight /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GraphicDesign;