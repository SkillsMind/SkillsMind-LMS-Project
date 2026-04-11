// ContactSidebar.js
import React, { useState } from 'react';
import './ContactSidebar.css';
import { FaWhatsapp, FaInstagram, FaQuestionCircle, FaHeadset, FaTimes, FaExternalLinkAlt, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ContactSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const navigate = useNavigate();

  const items = [
    { 
      id: 1, 
      name: 'WhatsApp', 
      icon: <FaWhatsapp />, 
      val: '+92 311 6735509', 
      color: 'whatsapp-bg', 
      link: 'https://wa.me/923116735509',
      external: true 
    },
    { 
      id: 2, 
      name: 'Instagram', 
      icon: <FaInstagram />, 
      val: '@skillsmind786', 
      color: 'instagram-bg', 
      link: 'https://instagram.com/skillsmind786',
      external: true 
    },
    { 
      id: 3, 
      name: 'Email', 
      icon: <FaEnvelope />, 
      val: 'skillsmind786@gmail.com', 
      color: 'email-bg', 
      link: 'https://mail.google.com/mail/?view=cm&fs=1&to=skillsmind786@gmail.com',
      external: true 
    },
    { 
      id: 4, 
      name: 'FAQs', 
      icon: <FaQuestionCircle />, 
      val: 'Frequently Asked Questions', 
      color: 'faq-bg', 
      link: '/faqs',
      external: false 
    }
  ];

  const handleItemClick = (item) => {
    if (item.external) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
      setActiveItem(null);
      setIsOpen(false);
    } else {
      navigate(item.link);
      setActiveItem(null);
      setIsOpen(false);
    }
  };

  const handleInfoCardClick = (item) => {
    if (item.external) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.link);
    }
    setActiveItem(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* Background Blur Overlay */}
      {isOpen && <div className="sidebar-blur-overlay" onClick={() => {setIsOpen(false); setActiveItem(null);}}></div>}

      <div className={`sticky-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        
        {/* Main Support Button */}
        <div className="mobile-toggle-btn" onClick={() => {setIsOpen(!isOpen); setActiveItem(null);}}>
          {isOpen ? <FaTimes /> : <FaHeadset />}
        </div>

        {/* Icons Wrapper */}
        <div className="sidebar-items-wrapper">
          {items.map((item) => (
            <div key={item.id} className="sidebar-item info-item">
              {/* Desktop Hover Content */}
              <div className="hover-content desktop-only">{item.val}</div>
              
              <div 
                className={`icon-box ${item.color}`} 
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    setActiveItem(activeItem?.id === item.id ? null : item);
                  } else {
                    handleItemClick(item);
                  }
                }}
              >
                {item.icon}
              </div>

              {/* Mobile Info Card */}
              {activeItem?.id === item.id && (
                <div className="mobile-info-card">
                  <h4>{item.name}</h4>
                  <p>{item.val}</p>
                  <button className="action-link" onClick={() => handleInfoCardClick(item)}>
                    Open <FaExternalLinkAlt />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ContactSidebar;