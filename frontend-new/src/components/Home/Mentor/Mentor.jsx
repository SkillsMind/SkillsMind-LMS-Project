import React, { useState, useEffect, useRef } from 'react';
import './Mentor.css';

const Mentor = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const mentors = [
    {
      id: 1,
      name: "Shamlan Safdar",
      role: "Marketing Manager",
      image: "/Shamlan.png",
      description: "Expert in digital marketing strategies with proven track record of successful campaigns.",
      experience: "2 years",
      students: "180+",
      rating: "4.9",
      courses: "3",
      specialization: "Digital Marketing",
      social: {
        linkedin: "#",
        twitter: "#",
        instagram: "#",
        youtube: "#"
      }
    },
    {
      id: 2,
      name: "Zulafiqar Haider",
      role: "UI/UX Designer",
      image: "/professer.png",
      description: "Creative designer specializing in user-centered design and seamless digital experiences.",
      experience: "8 years",
      students: "320+",
      rating: "4.8",
      courses: "5",
      specialization: "Product Design",
      social: {
        linkedin: "#",
        twitter: "#",
        instagram: "#",
        youtube: "#"
      }
    },
    {
      id: 3,
      name: "Noman",
      role: "Web Developer",
      image: "/Nouman.png",
      description: "Full-stack developer passionate about building scalable web applications.",
      experience: "4 years",
      students: "400+",
      rating: "4.9",
      courses: "6",
      specialization: "Full Stack Development",
      social: {
        linkedin: "#",
        twitter: "#",
        instagram: "#",
        youtube: "#"
      }
    },
    {
      id: 4,
      name: "Anas Iftikahr",
      role: "Data Scientist",
      image: "/anas.png",
      description: "Data expert turning complex data into actionable business insights.",
      experience: "7 years",
      students: "4,100+",
      rating: "5.0",
      courses: "18",
      specialization: "Machine Learning",
      social: {
        linkedin: "#",
        twitter: "#",
        instagram: "#",
        youtube: "#"
      }
    }
  ];

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-play slider
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % mentors.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, mentors.length]);

  const handleMouseEnter = (index) => {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <section className={`mentor-section ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
      {/* Background Shapes */}
      <div className="bg-shapes">
        <div className="shape-left"></div>
        <div className="shape-right"></div>
        <div className="shape-mobile-top"></div>
        <div className="shape-mobile-bottom"></div>
      </div>

      <div className="mentor-container">
        {/* Header with View All Link */}
        <div className={`section-header ${isVisible ? 'animate-in' : ''}`}>
          <div className="header-top">
            <div className="header-left">
              <span className="header-tag">MENTORS</span>
            </div>
            <a href="/mentors" className="view-all-link">
              View All Mentors <i className="fas fa-arrow-right"></i>
            </a>
          </div>
          <h2 className="main-heading">
            Meet Our <span className="highlight-red">Expert</span> <span className="highlight-blue">Mentors</span>
          </h2>
          <p className="sub-heading"></p>
        </div>

        {/* Compact Mentor Card */}
        <div className={`mentor-card-box ${isVisible ? 'animate-in' : ''}`}>
          <div className="mentor-card-inner">
            
            {/* Left - Main Image (Desktop) / Middle (Mobile) */}
            <div className="mentor-display-image">
              <div className="image-frame">
                {mentors.map((mentor, index) => (
                  <img
                    key={mentor.id}
                    src={mentor.image}
                    alt={mentor.name}
                    className={`display-img ${index === activeIndex ? 'active' : ''}`}
                  />
                ))}
                <div className="image-accent"></div>
              </div>
            </div>

            {/* Center - Info */}
            <div className="mentor-details-panel">
              <div className="details-wrapper">
                {mentors.map((mentor, index) => (
                  <div
                    key={mentor.id}
                    className={`mentor-profile ${index === activeIndex ? 'active' : ''}`}
                  >
                    <div className="info-content">
                      <span className="role-pill">{mentor.role}</span>
                      <h3 className="mentor-name">{mentor.name}</h3>
                      <p className="mentor-desc">{mentor.description}</p>
                      
                      <div className="info-list">
                        <div className="info-item">
                          <i className="fas fa-briefcase"></i>
                          <span><strong>Experience :</strong> {mentor.experience}</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-user-graduate"></i>
                          <span><strong>Students :</strong> {mentor.students}</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-star"></i>
                          <span><strong>Rating :</strong> {mentor.rating}</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-book"></i>
                          <span><strong>Courses :</strong> {mentor.courses}</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-award"></i>
                          <span><strong>Specialization :</strong> {mentor.specialization}</span>
                        </div>
                      </div>

                      <div className="social-section">
                        <span className="social-label">Social Media :</span>
                        <div className="social-links">
                          <a href={mentor.social.linkedin} className="social-icon linkedin">
                            <i className="fab fa-linkedin-in"></i>
                          </a>
                          <a href={mentor.social.twitter} className="social-icon twitter">
                            <i className="fab fa-twitter"></i>
                          </a>
                          <a href={mentor.social.instagram} className="social-icon instagram">
                            <i className="fab fa-instagram"></i>
                          </a>
                          <a href={mentor.social.youtube} className="social-icon youtube">
                            <i className="fab fa-youtube"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - 2x2 Thumbnails Grid (Desktop) / Top (Mobile) */}
            <div className="thumbnails-grid">
              {mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className={`thumb-box ${index === activeIndex ? 'active' : ''}`}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="thumb-img-container">
                    <img src={mentor.image} alt={mentor.name} />
                    <div className="thumb-hover">
                      <i className="fas fa-arrow-right"></i>
                    </div>
                    <div className="thumb-progress">
                      <div 
                        className="progress-fill" 
                        style={{
                          animationDuration: index === activeIndex && isAutoPlaying ? '4s' : '0s'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom Dots */}
        <div className={`nav-dots ${isVisible ? 'animate-in' : ''}`}>
          {mentors.map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mentor;