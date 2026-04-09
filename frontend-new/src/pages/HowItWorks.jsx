import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaCertificate, 
  FaLaptopCode, 
  FaArrowRight, 
  FaStar, 
  FaPlayCircle, 
  FaRegClock, 
  FaTrophy 
} from 'react-icons/fa';
import './HowItWorks.css';

const HowItWorks = () => {
  // Steps data
  const steps = [
    {
      id: 1,
      title: 'Sign Up',
      description: 'Create your free account with email or Google sign-in. Join thousands of learners already on SkillsMind.',
      icon: <FaUserGraduate />,
      color: '#e30613'
    },
    {
      id: 2,
      title: 'Choose Your Path',
      description: 'Browse our premium courses and select the one that matches your career goals. From beginner to advanced.',
      icon: <FaLaptopCode />,
      color: '#000B29'
    },
    {
      id: 3,
      title: 'Start Learning',
      description: 'Access high-quality video lectures, downloadable resources, and hands-on projects. Learn at your own pace.',
      icon: <FaPlayCircle />,
      color: '#e30613'
    },
    {
      id: 4,
      title: 'Get Certified',
      description: 'Complete the course and earn an industry-recognized certificate to boost your career.',
      icon: <FaCertificate />,
      color: '#000B29'
    }
  ];

  // Features data
  const features = [
    { title: 'Expert Instructors', description: 'Learn from industry professionals with years of experience.', icon: <FaChalkboardTeacher /> },
    { title: 'Flexible Learning', description: 'Study anytime, anywhere at your own pace.', icon: <FaRegClock /> },
    { title: 'Certificate of Completion', description: 'Get certified and showcase your skills.', icon: <FaCertificate /> },
    { title: 'Hands-on Projects', description: 'Apply your knowledge with real-world projects.', icon: <FaTrophy /> }
  ];

  // Stats data
  const stats = [
    { number: '10,000+', label: 'Active Students', icon: <FaUserGraduate /> },
    { number: '50+', label: 'Expert Instructors', icon: <FaChalkboardTeacher /> },
    { number: '100+', label: 'Premium Courses', icon: <FaLaptopCode /> },
    { number: '95%', label: 'Success Rate', icon: <FaStar /> }
  ];

  return (
    <div className="howitworks-container">
      {/* Hero Section */}
      <section className="hiw-hero">
        <div className="hiw-hero-overlay"></div>
        <div className="hiw-hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How <span className="red-text">SkillsMind</span> Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Your journey to mastering new skills in just 4 simple steps
          </motion.p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="hiw-steps">
        <div className="container">
          <div className="section-header">
            <h2>Your Learning Journey</h2>
            <div className="red-line"></div>
            <p>Follow these simple steps to start your learning adventure</p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                className="step-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="step-number" style={{ background: step.color }}>{step.id}</div>
                <div className="step-icon" style={{ color: step.color }}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < steps.length - 1 && <div className="step-arrow"><FaArrowRight /></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="hiw-stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="stat-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="hiw-features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SkillsMind?</h2>
            <div className="red-line"></div>
            <p>What makes us different from others</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hiw-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of students already learning on SkillsMind</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn-primary">Sign Up Now</Link>
              <Link to="/courses" className="btn-secondary">Browse Courses</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;