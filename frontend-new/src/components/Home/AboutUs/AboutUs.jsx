import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Target, Eye, Lightbulb, Users, ChevronDown, ChevronUp,
  Award, BookOpen, TrendingUp, CheckCircle, Star, Zap
} from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  const [activeCard, setActiveCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const expandRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      id: 'vision',
      icon: <Eye size={28} />,
      title: 'Vision & Mission',
      shortDesc: 'Meet our founder & our roadmap',
      type: 'mentor',
      content: {
        image: '/mentor-ahmed.jpg',
        name: 'Anas Iftikhar',
        role: 'CO Founder Of SkillsMind',
        vision: 'To make Pakistan a global hub for digital talent by 2030, where every student has access to world-class education regardless of their background.',
        mission: 'Bridging the gap between academic learning and industry demands through practical, hands-on training that transforms beginners into professionals.'
      }
    },
    {
      id: 'whatis',
      icon: <Lightbulb size={28} />,
      title: 'What is SkillsMind?',
      shortDesc: 'Discover our story & purpose',
      type: 'info',
      content: {
        title: 'The SkillsMind Story',
        subtitle: 'Born from Necessity',
        points: [
          { icon: <Zap size={20} />, text: 'Founded in 2024 by industry professionals who saw the gap between education and employment' },
          { icon: <BookOpen size={20} />, text: 'Not just courses—complete career transformation programs' },
          { icon: <Users size={20} />, text: 'Community-driven learning with peer collaboration' },
          { icon: <Award size={20} />, text: 'Certificates recognized by top tech companies in Pakistan' }
        ],
        stats: [
          { value: '50+', label: 'Industry Partners' },
          { value: '100%', label: 'Practical Training' },
          { value: '24/7', label: 'Mentor Support' }
        ]
      }
    },
    {
      id: 'whyus',
      icon: <Target size={28} />,
      title: 'Why SkillsMind?',
      shortDesc: 'What makes us different',
      type: 'features',
      content: {
        title: 'The SkillsMind Advantage',
        features: [
          { 
            icon: <CheckCircle size={24} />, 
            title: 'Learn by Doing',
            desc: 'Real projects, not just theory. Build your portfolio while learning.'
          },
          { 
            icon: <Star size={24} />, 
            title: 'Expert Mentors',
            desc: 'Learn from professionals working at top tech companies.'
          },
          { 
            icon: <TrendingUp size={24} />, 
            title: 'Job Guarantee',
            desc: '90% of our graduates land jobs within 3 months of completion.'
          },
          { 
            icon: <Zap size={24} />, 
            title: 'Lifetime Access',
            desc: 'Get lifetime access to course materials and community.'
          }
        ]
      }
    },
    {
      id: 'join',
      icon: <Users size={28} />,
      title: 'Who Should Join?',
      shortDesc: 'Is this program for you?',
      type: 'audience',
      content: {
        title: 'Perfect For',
        audiences: [
          { icon: '🎓', title: 'Fresh Graduates', desc: 'Looking to start a career in tech' },
          { icon: '🔄', title: 'Career Switchers', desc: 'Want to transition into digital roles' },
          { icon: '💼', title: 'Freelancers', desc: 'Aiming to upskill and get better clients' },
          { icon: '🚀', title: 'Entrepreneurs', desc: 'Building their own digital products' }
        ],
        note: 'No prior experience needed. Just bring your dedication and we will handle the rest.'
      }
    }
  ];

  const handleCardClick = (id) => {
    if (activeCard === id) {
      setActiveCard(null);
    } else {
      setActiveCard(id);
      setTimeout(() => {
        if (expandRef.current) {
          const yOffset = -100;
          const element = expandRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  const closeExpand = (e) => {
    e.stopPropagation();
    setActiveCard(null);
  };

  const renderExpandContent = (card) => {
    switch (card.type) {
      case 'mentor':
        return (
          <div className="detail-card mentor-layout animate-in">
            <div className="detail-left">
              <div className="image-frame">
                <img 
                  src={card.content.image} 
                  alt={card.content.name}
                  onError={(e) => {
                    e.target.src = 'public/Mentor pic.jpeg';
                  }}
                />
                <div className="image-overlay"></div>
                <div className="person-info">
                  <h4>{card.content.name}</h4>
                  <span>{card.content.role}</span>
                </div>
              </div>
            </div>
            <div className="detail-right">
              <div className="vision-block">
                <div className="block-header">
                  <Eye size={24} />
                  <h3>Our Vision</h3>
                </div>
                <p>{card.content.vision}</p>
              </div>
              <div className="mission-block">
                <div className="block-header">
                  <Target size={24} />
                  <h3>Our Mission</h3>
                </div>
                <p>{card.content.mission}</p>
              </div>
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="detail-card info-layout animate-in">
            <div className="info-header">
              <h3>{card.content.title}</h3>
              <span className="subtitle">{card.content.subtitle}</span>
            </div>
            <div className="info-points">
              {card.content.points.map((point, idx) => (
                <div key={idx} className="info-point">
                  <div className="point-icon">{point.icon}</div>
                  <p>{point.text}</p>
                </div>
              ))}
            </div>
            <div className="info-stats">
              {card.content.stats.map((stat, idx) => (
                <div key={idx} className="info-stat">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="detail-card features-layout animate-in">
            <h3 className="features-title">{card.content.title}</h3>
            <div className="features-grid">
              {card.content.features.map((feature, idx) => (
                <div key={idx} className="feature-item">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4>{feature.title}</h4>
                  <p>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'audience':
        return (
          <div className="detail-card audience-layout animate-in">
            <h3 className="audience-title">{card.content.title}</h3>
            <div className="audience-grid">
              {card.content.audiences.map((audience, idx) => (
                <div key={idx} className="audience-item">
                  <span className="audience-icon">{audience.icon}</span>
                  <h4>{audience.title}</h4>
                  <p>{audience.desc}</p>
                </div>
              ))}
            </div>
            <div className="audience-note">
              <Zap size={20} />
              <p>{card.content.note}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="about-section" id="about" ref={sectionRef}>
      {/* Simple Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-dots"></div>
      </div>

      <div className="about-container">
        {/* Left Side - Text Content */}
        <div className={`about-left ${isVisible ? 'slide-in-left' : ''}`}>
          <span className="section-tag">About Us</span>
          <h2 className="about-title">
            Welcome to <span className="highlight">SkillsMind</span>
          </h2>
          <p className="about-description">
            We are just getting started, but our vision is crystal clear. SkillsMind is 
            Pakistan's freshest platform for digital skills, built by mentors who actually 
            work in the industry. No fluff, no outdated courses—just real skills that get 
            you hired.
          </p>
          <p className="about-subtext">
            Whether you want to code, design, or market—we are here to guide you from 
            absolute beginner to job-ready professional. Join our first batch and be 
            part of something big from day one.
          </p>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-number">10+</span>
              <span className="stat-label">Expert Mentors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Students Enrolled</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Right Side - Cards Grid */}
        <div className={`about-right ${isVisible ? 'slide-in-right' : ''}`}>
          <div className="cards-grid">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`info-card ${activeCard === card.id ? 'active' : ''}`}
                onClick={() => handleCardClick(card.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-icon">{card.icon}</div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-short">{card.shortDesc}</p>
                <div className="card-hint">
                  {activeCard === card.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <div 
        className={`expand-section ${activeCard ? 'expanded' : ''}`} 
        ref={expandRef}
      >
        {activeCard && (
          <div className="expand-content">
            <button className="close-btn" onClick={closeExpand}>
              <X size={24} />
            </button>
            {cards.map((card) => (
              card.id === activeCard && (
                <div key={card.id}>
                  {renderExpandContent(card)}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutUs;