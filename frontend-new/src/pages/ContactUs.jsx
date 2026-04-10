import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Instagram, MessageCircle, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import './ContactUs.css';
import visitImage from '../assets/visit-image.png';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Server error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { name: 'WhatsApp', icon: <MessageCircle size={22} />, link: 'https://wa.me/923116735509', color: '#25D366' },
    { name: 'Instagram', icon: <Instagram size={22} />, link: 'https://instagram.com/skillsmind786', color: '#E4405F' },
    { name: 'Email', icon: <Mail size={22} />, link: 'mailto:skillsmind786@gmail.com', color: '#e30613' }
  ];

  return (
    <div className="contact-page">
      <Toaster position="top-center" />
      
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Get In <span className="red-text">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We'd love to hear from you! Whether you have a question about our courses, 
            need support, or just want to say hello.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            
            {/* Left Side: Clean Image - No Card Effect */}
            <motion.div 
              className="contact-image-side"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <img src={visitImage} alt="SkillsMind Support" className="contact-clean-image" />
            </motion.div>

            {/* Right Side: Contact Form */}
            <motion.div 
              className="contact-form-side"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="form-wrapper">
                <h2>Send us a Message</h2>
                <p>We'll respond to your message within 24 hours</p>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="input-group">
                      <label>Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <>Sending <span className="spinner"></span></> : <>Send Message <Send size={18} /></>}
                  </button>
                </form>

                {/* Social Links - Clean Style */}
                <div className="social-links">
                  <h4>Connect With Us</h4>
                  <div className="social-icons">
                    {socialLinks.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <span className="social-icon" style={{ color: social.color }}>{social.icon}</span>
                        <span>{social.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="contact-faq-cta">
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">
              <Headphones size={40} />
            </div>
            <h3>Frequently Asked Questions</h3>
            <p>Find quick answers to common questions about our courses and services.</p>
            <Link to="/faqs" className="cta-btn">Visit FAQ Page</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;