// Footer.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight,
  X,
  Send,
  MessageSquare,
  Heart,
  Instagram,
  Mail
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Courses - 6 courses
  const footerLinks = {
    courses: [
      { name: 'Web Development', id: 'web-development' },
      { name: 'Digital Marketing', id: 'digital-marketing' },
      { name: 'UI/UX Design', id: 'ui-ux-design' },
      { name: 'Shopify', id: 'shopify' },
      { name: 'Photo/Video Editing', id: 'photo-video-editing' },
      { name: 'Basic Computer', id: 'basic-computer' }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'News & Events', path: '/news' },
      { name: 'How It Works', path: '/how-it-works' }
    ],
    support: [
      { name: 'Help Center', path: '/contact' },
      { name: 'FAQs', path: '/faqs' },
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Refund Policy', path: '/refund-policy' }
    ]
  };

  // Contact Methods - Fixed Email Link (Gmail Compose)
  const contactMethods = [
    { 
      name: 'WhatsApp', 
      icon: <MessageSquare size={18} />, 
      link: 'https://wa.me/923116735509',
      color: '#25D366'
    },
    { 
      name: 'Instagram', 
      icon: <Instagram size={18} />, 
      link: 'https://instagram.com/skillsmind786',
      color: '#E4405F'
    },
    { 
      name: 'Email', 
      icon: <Mail size={18} />, 
      link: 'https://mail.google.com/mail/?view=cm&fs=1&to=skillsmind786@gmail.com',
      color: '#e30613'
    }
  ];

  // Handle Course Click
  const handleCourseClick = (courseId) => {
    if (location.pathname === '/') {
      const coursesSection = document.getElementById('courses');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const coursesSection = document.getElementById('courses');
        if (coursesSection) {
          coursesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    }
  };

  // Handle Contact Us Click - Direct to Contact Page (No Modal)
  const handleContactUsClick = () => {
    navigate('/contact');
  };

  return (
    <>
      <footer className={`footer ${isVisible ? 'visible' : ''}`} ref={footerRef}>
        <div className="footer-container">
          <div className="footer-grid">
            
            {/* Brand Column - Bigger Logo */}
            <div className={`footer-brand ${isVisible ? 'animate-in' : ''}`}>
              <div className="logo-wrapper">
                <img 
                  src="/Skills_Mind_Logo.png" 
                  alt="SkillsMind" 
                  className="footer-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.footer-logo-fallback').style.display = 'flex';
                  }}
                />
                <div className="footer-logo-fallback" style={{ display: 'none' }}>
                  <span className="fallback-skills">SKILLS</span>
                  <span className="fallback-mind">MIND</span>
                </div>
              </div>
              <p className="footer-tagline">
                Empowering Pakistani youth with industry-leading digital skills.
              </p>
              
              {/* Contact Methods */}
              <div className="footer-contact-methods">
                {contactMethods.map((method, idx) => (
                  <a 
                    key={idx}
                    href={method.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-method-link"
                    style={{ '--hover-color': method.color }}
                  >
                    <span className="contact-method-icon" style={{ color: method.color }}>
                      {method.icon}
                    </span>
                    <span className="contact-method-name">{method.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Courses Column */}
            <div className={`footer-links-column ${isVisible ? 'animate-in delay-1' : ''}`}>
              <h4>Courses</h4>
              <ul>
                {footerLinks.courses.map((course, index) => (
                  <li key={index}>
                    <button 
                      className="footer-link"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <ChevronRight size={12} className="link-arrow" />
                      <span>{course.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div className={`footer-links-column ${isVisible ? 'animate-in delay-2' : ''}`}>
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((item, index) => (
                  <li key={index}>
                    <Link to={item.path} className="footer-link">
                      <ChevronRight size={12} className="link-arrow" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div className={`footer-links-column ${isVisible ? 'animate-in delay-3' : ''}`}>
              <h4>Support</h4>
              <ul>
                {footerLinks.support.map((item, index) => (
                  <li key={index}>
                    <Link to={item.path} className="footer-link">
                      <ChevronRight size={12} className="link-arrow" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Contact Us Button - Direct to Contact Page */}
              <button className="contact-btn-compact" onClick={handleContactUsClick}>
                <MessageSquare size={14} />
                Contact Us
              </button>
            </div>
          </div>

          {/* Copyright */}
          <div className={`footer-bottom ${isVisible ? 'animate-in delay-4' : ''}`}>
            <div className="copyright">
              <span>
                © 2025 SkillsMind. Made with <Heart size={12} className="heart-icon" /> in Pakistan
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;