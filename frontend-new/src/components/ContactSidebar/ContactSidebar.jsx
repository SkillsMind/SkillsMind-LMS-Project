import React, { useState } from 'react';
import './ContactSidebar.css';
import { FaPhoneAlt, FaEnvelope, FaQuestionCircle, FaInfoCircle, FaHeadset, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

const ContactSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // Clicked icon ki info ke liye

  const items = [
    { id: 1, name: 'Phone', icon: <FaPhoneAlt />, val: '03116735509', color: 'yellow-bg', link: 'tel:03041111570' },
    { id: 2, name: 'Email', icon: <FaEnvelope />, val: 'skillsmind786@gmail.com', color: 'orange-bg', link: 'mailto:info@skillsmind.com' },
    { id: 3, name: 'FAQs', icon: <FaQuestionCircle />, val: 'Frequently Asked Questions', color: 'light-orange-bg', link: '/faqs' },
    { id: 4, name: 'About', icon: <FaInfoCircle />, val: 'Learn about SkillsMind', color: 'red-bg', link: '/about' }
  ];

  return (
    <>
      {/* Background Blur Overlay: Jab open ho to piche ka content hide ho jaye */}
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
              {/* Desktop Hover Content (Same as before) */}
              <div className="hover-content desktop-only">{item.val}</div>
              
              <div className={`icon-box ${item.color}`} onClick={() => setActiveItem(item)}>
                {item.icon}
              </div>

              {/* Unique Mobile Card: Jab icon click ho to niche open ho */}
              {activeItem?.id === item.id && (
                <div className="mobile-info-card">
                  <h4>{item.name}</h4>
                  <p>{item.val}</p>
                  <a href={item.link} className="action-link">Open <FaExternalLinkAlt /></a>
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