import React, { useState, useEffect, useRef } from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  X,
  Send,
  User,
  MessageSquare,
  Heart
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

  const footerLinks = {
    courses: [
      { name: 'Web Development', id: 'web-dev' },
      { name: 'UI/UX Design', id: 'uiux' },
      { name: 'Digital Marketing', id: 'marketing' },
      { name: 'Data Science', id: 'data-science' },
      { name: 'Mobile Development', id: 'mobile' },
      { name: 'Cloud Computing', id: 'cloud' }
    ],
    company: [
      'About Us',
      'Careers',
      'Blog',
      'Press',
      'Partners'
    ],
    support: [
      'Help Center',
      'Terms of Service',
      'Privacy Policy',
      'Refund Policy',
      'Sitemap'
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: '#1877f2' },
    { icon: Twitter, href: '#', label: 'Twitter', color: '#1da1f2' },
    { icon: Instagram, href: '#', label: 'Instagram', color: '#e4405f' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: '#0077b5' },
    { icon: Youtube, href: '#', label: 'YouTube', color: '#ff0000' }
  ];

  const handleCourseClick = (courseId) => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
    const specificCourse = document.getElementById(courseId);
    if (specificCourse) {
      specificCourse.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setShowContactModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowContactModal(false);
    document.body.style.overflow = 'unset';
    setShowSuccess(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => {
      closeModal();
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <footer className={`footer ${isVisible ? 'visible' : ''}`} ref={footerRef}>
        {/* Cut-out Shape Backgrounds */}
        <div className="footer-shape shape-1"></div>
        <div className="footer-shape shape-2"></div>
        <div className="footer-shape shape-3"></div>
        <div className="footer-grid-pattern"></div>
        
        <div className="footer-container">
          {/* Main Footer Grid - Ultra Compressed */}
          <div className="footer-grid">
            {/* Brand Column with Logo */}
            <div className={`footer-brand ${isVisible ? 'animate-in' : ''}`}>
              <div className="logo-wrapper">
                <img 
                  src="/Skills_Mind_Logo.png" 
                  alt="SkillsMind" 
                  className="footer-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="footer-logo-text" style={{display: 'none'}}>
                  <span className="logo-skills">skills</span>
                  <span className="logo-mind">mind</span>
                  <div className="logo-dot"></div>
                </div>
              </div>
              <p className="footer-tagline">
                Empowering Pakistani youth with industry-leading digital skills.
              </p>
              <div className="footer-contact-compact">
                <div className="contact-item">
                  <MapPin size={12} />
                  <span>Lahore, Pakistan</span>
                </div>
                <div className="contact-item">
                  <Phone size={12} />
                  <span>+92 300 1234567</span>
                </div>
              </div>
              
              <div className="newsletter-compact">
                <input type="email" placeholder="Your email" />
                <button><Send size={14} /></button>
              </div>
            </div>

            {/* Links Columns */}
            <div className={`footer-links-column ${isVisible ? 'animate-in delay-1' : ''}`}>
              <h4>Courses</h4>
              <ul>
                {footerLinks.courses.map((course, index) => (
                  <li key={index}>
                    <button 
                      className="footer-link course-link"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <ChevronRight size={10} className="link-arrow" />
                      <span>{course.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`footer-links-column ${isVisible ? 'animate-in delay-2' : ''}`}>
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href="#" className="footer-link">
                      <ChevronRight size={10} className="link-arrow" />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`footer-links-column ${isVisible ? 'animate-in delay-3' : ''}`}>
              <h4>Support</h4>
              <ul>
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a href="#" className="footer-link">
                      <ChevronRight size={10} className="link-arrow" />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
              
              <button className="contact-btn-compact" onClick={handleContactClick}>
                <MessageSquare size={14} />
                Contact
              </button>

              <div className="social-compact">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index} 
                    href={social.href} 
                    className="social-icon-compact"
                    style={{ '--social-color': social.color }}
                    aria-label={social.label}
                  >
                    <social.icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright Bar - Moved UP above the line with cut-out style */}
          <div className={`footer-copyright-bar ${isVisible ? 'animate-in delay-4' : ''}`}>
            <div className="copyright-content">
              <span className="copyright-text">
                © 2025 SkillsMind. Made with <Heart size={12} className="heart-icon" /> in Pakistan
              </span>
              <div className="legal-links">
                <a href="#">Privacy</a>
                <span className="divider">|</span>
                <a href="#">Terms</a>
                <span className="divider">|</span>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-icon">
                  <MessageSquare size={24} />
                </div>
                <div className="modal-title">
                  <h3>Get in Touch</h3>
                  <p>We'd love to hear from you!</p>
                </div>
                <button className="modal-close" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              {showSuccess ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h4>Message Sent!</h4>
                  <p>We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label><User size={14} /> Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label><Mail size={14} /> Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label><MessageSquare size={14} /> Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows="3" required></textarea>
                  </div>
                  <button type="submit" className={`submit-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? <><span className="spinner"></span>Sending...</> : <><Send size={16} />Send</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;