// AboutUs.js
import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Target, Users, Award, Heart, TrendingUp, ChevronLeft, ChevronRight, ArrowRight, 
  Code, Monitor, Database, Cloud, Shield, Zap, Globe, BookOpen, Video, Headphones, 
  FileCode, Layout, Smartphone, Laptop, Cpu, Network, Terminal, GitBranch, 
  Figma, ShoppingBag, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

// IMPORT IMAGES
import founderImg from '../../../assets/images/founder.jpg';

const AboutUs = () => {
  const sectionRef = useScrollAnimation();
  const navigate = useNavigate();

  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return token && userId;
  };

  // Handle Explore Courses button click
  const handleExploreCourses = () => {
    if (isLoggedIn()) {
      navigate('/get-enrolment');
    } else {
      localStorage.setItem('redirectAfterLogin', '/get-enrolment');
      navigate('/login');
    }
  };

  // Handle Tech Card Click
  const handleTechCardClick = (courseTitle) => {
    if (isLoggedIn()) {
      localStorage.setItem('selectedCourse', courseTitle);
      navigate('/get-enrolment');
    } else {
      localStorage.setItem('redirectAfterLogin', '/get-enrolment');
      localStorage.setItem('selectedCourse', courseTitle);
      navigate('/login');
    }
  };

  const stats = [
    { icon: Users, value: '250+', label: 'Students Trained' },
    { icon: Award, value: '13+', label: 'Hiring Partners' },
    { icon: TrendingUp, value: '92%', label: 'Placement Rate' },
    { icon: Heart, value: '4.9', label: 'Student Rating' }
  ];

  // Tech Categories - With click handlers
  const techCategories = [
    { 
      title: 'Web Development', 
      icon: Code, 
      color: '#E30613',
      skills: ['HTML/CSS', 'JavaScript', 'React.js', 'Node.js', 'Next.js'],
      courseId: 'web-development'
    },
    { 
      title: 'Digital Marketing', 
      icon: Megaphone, 
      color: '#000B29',
      skills: ['Google Ads', 'SEO', 'Meta Ads', 'Email Marketing'],
      courseId: 'digital-marketing'
    },
    { 
      title: 'UI/UX Design', 
      icon: Figma, 
      color: '#E30613',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Wireframing'],
      courseId: 'ui-ux-design'
    },
    { 
      title: 'Shopify', 
      icon: ShoppingBag, 
      color: '#000B29',
      skills: ['Store Setup', 'Theme Customization', 'App Integration', 'Dropshipping'],
      courseId: 'shopify'
    }
  ];

  const learningFeatures = [
    { icon: Video, title: 'Live Interactive Classes', desc: 'Real-time learning with industry experts' },
    { icon: FileCode, title: 'Hands-on Projects', desc: 'Build real-world applications' },
    { icon: Headphones, title: '24/7 Mentorship', desc: 'Get help whenever you need' },
    { icon: Award, title: 'Industry Certification', desc: 'Recognized by top companies' },
    { icon: Zap, title: 'Fast-Track Learning', desc: 'Complete courses at your pace' },
    { icon: Globe, title: 'Global Community', desc: 'Connect with learners worldwide' }
  ];

  return (
    <section ref={sectionRef} className="about-section" id="about">
      <div className="about-container">
        
        {/* Hero Section */}
        <div className="about-hero reveal">
          <div className="hero-badge">About SkillsMind</div>
          <h1 className="hero-title">
            Pakistan's Premier 
            <span> Online Learning Platform</span>
          </h1>
          <p className="hero-description">
            Empowering youth with industry-ready skills since 2022
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="vision-mission-wrapper">
          <div className="vision-text reveal-left">
            <div className="section-label">Our Vision & Mission</div>
            <h3 className="vm-title">Bridging the gap between <span>education and industry</span></h3>
            <p className="vm-paragraph">
              To become Pakistan's leading ed-tech platform that bridges the gap between 
              academic education and industry requirements, creating skilled professionals 
              who drive the nation's digital economy.
            </p>
            <p className="vm-paragraph second">
              To provide accessible, high-quality, and job-oriented technical education 
              to every aspiring student in Pakistan, empowering them with skills that 
              guarantee career success and financial independence.
            </p>
            <div className="vm-stats">
              {stats.map((stat, idx) => (
                <div key={idx} className="vm-stat">
                  <span className="vm-stat-value">{stat.value}</span>
                  <span className="vm-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Single Image Section - No Card, No Border, No Radius */}
          <div className="vision-image reveal-right">
            <img 
              src={founderImg} 
              alt="Mentor & Co-founder of SkillsMind" 
              className="full-width-image"
            />
            <div className="image-caption">
              <h4>Mentor & Co-founder of SkillsMind</h4>
              <p>Leading the vision for Pakistan's digital future</p>
            </div>
          </div>
        </div>

        {/* Tech Stack & Courses Section - CLICKABLE CARDS */}
        <div className="tech-section">
          <div className="section-header reveal">
            <span className="section-badge">What You'll Learn</span>
            <h2 className="section-title">Master <span>In-Demand Skills</span></h2>
            <p className="section-subtitle">Click on any course to start your learning journey</p>
          </div>

          {/* Tech Categories Grid - CLICKABLE */}
          <div className="tech-grid">
            {techCategories.map((tech, index) => (
              <div 
                key={index} 
                className={`tech-card clickable reveal-card delay-${index}`}
                onClick={() => handleTechCardClick(tech.title)}
              >
                <div className="tech-icon" style={{ backgroundColor: tech.color }}>
                  <tech.icon size={32} />
                </div>
                <h3>{tech.title}</h3>
                <div className="tech-skills">
                  {tech.skills.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
                <div className="card-hover-effect">
                  <span>Enroll Now →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Learning Features Grid */}
          <div className="features-graphics">
            <div className="features-header">
              <span className="features-badge">✨ The SkillsMind Experience</span>
              <h3>Learn the Way You Want</h3>
            </div>
            <div className="features-grid-graphic">
              {learningFeatures.map((feature, index) => (
                <div key={index} className={`feature-graphic-card stagger-${index + 1}`}>
                  <div className="feature-graphic-icon">
                    <feature.icon size={24} />
                  </div>
                  <div className="feature-graphic-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journey Section */}
        <div className="journey-section reveal">
          <div className="journey-content">
            <h3>Our Journey So Far</h3>
            <div className="journey-stats">
              <div className="journey-stat">
                <span className="journey-number">2024</span>
                <span className="journey-label">Founded</span>
              </div>
              <div className="journey-stat">
                <span className="journey-number">8+</span>
                <span className="journey-label">Courses</span>
              </div>
              <div className="journey-stat">
                <span className="journey-number">4</span>
                <span className="journey-label">Batches</span>
              </div>
              <div className="journey-stat">
                <span className="journey-number">250+</span>
                <span className="journey-label">Students</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="about-cta reveal">
          <h3>Ready to Start Your Journey?</h3>
          <p className="cta-subtitle">Join thousands of successful students who transformed their careers</p>
          <button className="cta-button" onClick={handleExploreCourses}>
            Explore Courses <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default AboutUs;