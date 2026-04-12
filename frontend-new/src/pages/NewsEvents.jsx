import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Award, Rocket, Clock, ChevronRight, Star, 
  Trophy, CheckCircle, ArrowRight, TrendingUp, Briefcase, Code, 
  Zap, Target, BookOpen, Video, Headphones, Bell, Laptop, 
  Monitor, Smartphone, PenTool, ShoppingCart, Globe, Palette,
  Newspaper, Sparkles, ChevronLeft, Home
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './NewsEvents.css';

const NewsEvents = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle Back Button Click
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle Home Button Click
  const handleGoHome = () => {
    navigate('/');
  };

  // Completed Batches Data
  const completedBatches = [
    {
      id: 1,
      batch: 'Batch 1',
      title: 'Digital Marketing Mastery',
      students: 245,
      completionRate: '96%',
      year: '2024',
      icon: <TrendingUp size={24} />,
      color: '#000B29'
    },
    {
      id: 2,
      batch: 'Batch 2',
      title: 'Full Stack Development',
      students: 312,
      completionRate: '94%',
      year: '2024',
      icon: <Code size={24} />,
      color: '#e30613'
    },
    {
      id: 3,
      batch: 'Batch 3',
      title: 'AI & Data Science',
      students: 178,
      completionRate: '92%',
      year: '2025',
      icon: <Zap size={24} />,
      color: '#000B29'
    }
  ];

  // Current Courses Offered (6 Courses)
  const offeredCourses = [
    { id: 1, title: 'Basic Computer', icon: <Monitor size={28} />, color: '#000B29', duration: '4 Weeks', level: 'Beginner' },
    { id: 2, title: 'Digital Marketing', icon: <TrendingUp size={28} />, color: '#e30613', duration: '8 Weeks', level: 'Beginner' },
    { id: 3, title: 'UI/UX Designing', icon: <PenTool size={28} />, color: '#000B29', duration: '10 Weeks', level: 'Intermediate' },
    { id: 4, title: 'Shopify', icon: <ShoppingCart size={28} />, color: '#e30613', duration: '6 Weeks', level: 'Beginner' },
    { id: 5, title: 'Web Development', icon: <Code size={28} />, color: '#000B29', duration: '12 Weeks', level: 'Advanced' },
    { id: 6, title: 'Graphic Design', icon: <Palette size={28} />, color: '#e30613', duration: '8 Weeks', level: 'Beginner' }
  ];

  // Upcoming Features
  const upcomingFeatures = [
    { title: 'Mobile App Launch', description: 'Learn on the go with our upcoming mobile app', icon: <Smartphone size={24} />, date: 'Coming May 2026' },
    { title: 'Job Placement Portal', description: 'Direct connections with hiring partners', icon: <Briefcase size={24} />, date: 'Coming June 2026' },
    { title: 'Live Mentorship Sessions', description: 'Weekly live Q&A with industry experts', icon: <Video size={24} />, date: 'Starting Soon' }
  ];

  // Handle course click - navigate to enrollment
  const handleCourseClick = (courseTitle) => {
    localStorage.setItem('selectedCourse', JSON.stringify({ title: courseTitle }));
    navigate('/get-enrolment');
  };

  return (
    <div className="news-events-page">
      
      {/* Hero Section with Buttons Inside */}
      <section className="news-hero-unique">
        {/* 🔥 BUTTONS INSIDE HERO - TOP RIGHT CORNER */}
        <div className="hero-nav-buttons">
          <button onClick={handleGoBack} className="hero-nav-btn back-btn" title="Go Back">
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          <button onClick={handleGoHome} className="hero-nav-btn home-btn" title="Go to Home">
            <Home size={18} />
            <span>Home</span>
          </button>
        </div>

        <div className="hero-pattern"></div>
        <div className="hero-content-unique">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Newspaper size={16} /> Stay Updated
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            News & <span className="red-text">Events</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Stay updated with the latest announcements, batch launches, and success stories from SkillsMind
          </motion.p>
          <motion.div 
            className="hero-stats-mini"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mini-stat">
              <Sparkles size={18} />
              <span>3 Successful Batches</span>
            </div>
            <div className="mini-stat">
              <Users size={18} />
              <span>735+ Students</span>
            </div>
            <div className="mini-stat">
              <Award size={18} />
              <span>94% Success Rate</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Batch 4 Announcement - Navy Blue Theme */}
      <section className="batch-announcement">
        <div className="container">
          <motion.div 
            className="announcement-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="announcement-badge navy">🔥 BATCH 4 - NOW OPEN</div>
            <h2>Batch 4 Registration is Now Open!</h2>
            <p>Join the most comprehensive tech training program in Pakistan. Limited seats available — secure your spot today!</p>
            <div className="announcement-features">
              <span>✓ Live Interactive Classes</span>
              <span>✓ Industry Projects</span>
              <span>✓ Job Placement Support</span>
              <span>✓ Lifetime Access</span>
            </div>
            <Link to="/get-enrolment" className="announcement-btn navy-btn">
              Enroll Now <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Batch Timeline Section - Completed Batches */}
      <section className="batch-timeline">
        <div className="container">
          <div className="section-header">
            <h2>Our <span className="red-text">Journey</span> So Far</h2>
            <div className="red-line"></div>
            <p>From Batch 1 to Batch 4 — Growing stronger every day with real skills</p>
          </div>

          <div className="batch-group">
            <h3 className="batch-group-title">
              <Trophy size={24} color="#10b981" />
              Successfully Completed Batches
            </h3>
            <div className="batches-grid">
              {completedBatches.map((batch, idx) => (
                <motion.div
                  key={batch.id}
                  className="batch-card completed"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="batch-icon" style={{ background: batch.color }}>
                    {batch.icon}
                  </div>
                  <div className="batch-badge completed-badge">{batch.batch}</div>
                  <h4>{batch.title}</h4>
                  <div className="batch-stats">
                    <span><Users size={14} /> {batch.students} Students</span>
                    <span><Award size={14} /> {batch.completionRate} Completion</span>
                  </div>
                  <div className="completion-badge">
                    <CheckCircle size={16} /> Completed in {batch.year}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Offered Section - 6 Cards */}
      <section className="courses-offered-section">
        <div className="container">
          <div className="section-header">
            <h2>Courses We <span className="red-text">Offer</span></h2>
            <div className="red-line"></div>
            <p>Choose your learning path from our premium course catalog</p>
          </div>

          <div className="courses-grid">
            {offeredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                className="course-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                viewport={{ once: true }}
                onClick={() => handleCourseClick(course.title)}
              >
                <div className="course-icon" style={{ background: course.color }}>
                  {course.icon}
                </div>
                <h3>{course.title}</h3>
                <div className="course-meta">
                  <span><Clock size={12} /> {course.duration}</span>
                  <span><Star size={12} /> {course.level}</span>
                </div>
                <button className="course-enroll-btn">Enroll Now →</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>What's <span className="red-text">Coming Next</span></h2>
            <div className="red-line"></div>
            <p>Exciting new features and updates coming soon to SkillsMind</p>
          </div>

          <div className="features-grid">
            {upcomingFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-date">
                  <Calendar size={14} />
                  {feature.date}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="news-cta">
        <div className="container">
          <div className="cta-wrapper">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join SkillsMind today and become part of our growing community of successful students</p>
            <div className="cta-buttons">
              <Link to="/get-enrolment" className="btn-primary">Browse All Courses</Link>
              <Link to="/signup" className="btn-secondary">Join For Free</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsEvents;