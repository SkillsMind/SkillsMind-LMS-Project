import React from 'react';
import './Hero.css';
import img1 from '../../Pictures/Hero1.png'; 

const Hero = () => {
  return (
    <section className="hero-bright">
      <div className="hero-container">
        
        {/* Left Side: Image with Shapes (Mobile par ye compress hogi) */}
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
            <button className="btn-browse-sharp">Browse Courses</button>
            <button className="btn-join-sharp">Join For Free</button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;