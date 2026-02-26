import React from 'react';
import { ArrowLeft, Megaphone, Calendar, ChevronRight, Bell } from 'lucide-react';
import './Announcements.css';

const AnnouncementsPage = ({ onBack }) => {
  const announcements = [
    {
      id: 1,
      title: "New Course: Advanced SEO",
      date: "Jan 20, 2024",
      category: "New Course",
      description: "We're excited to launch our new Advanced SEO course starting next month. Enroll now to get early bird discount!",
      isNew: true
    },
    {
      id: 2,
      title: "System Maintenance Scheduled",
      date: "Jan 22, 2024",
      category: "Maintenance",
      description: "Our platform will be under maintenance on Jan 25 from 2 AM to 4 AM. Please save your work accordingly.",
      isNew: true
    },
    {
      id: 3,
      title: "Winter Break Notice",
      date: "Jan 15, 2024",
      category: "Holiday",
      description: "The academy will remain closed during winter break from Feb 1-10. Classes will resume on Feb 11.",
      isNew: false
    },
    {
      id: 4,
      title: "Certificate Distribution Ceremony",
      date: "Jan 10, 2024",
      category: "Event",
      description: "Join us for the certificate distribution ceremony on Jan 30, 2024 at 10:00 AM.",
      isNew: false
    }
  ];

  return (
    <div className="announcements-page">
      {/* Back Button */}
      <button className="announcements-back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Page Header */}
      <div className="announcements-header">
        <div className="announcements-icon-wrapper">
          <Megaphone size={32} />
        </div>
        <div className="announcements-title-section">
          <h1>Announcements</h1>
          <p>Stay updated with latest news and updates</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="announcements-container">
        {announcements.map(item => (
          <div key={item.id} className={`announcement-item ${item.isNew ? 'new' : ''}`}>
            <div className="announcement-badge">
              {item.isNew && <Bell size={14} />}
              <span>{item.isNew ? 'NEW' : item.category}</span>
            </div>
            
            <div className="announcement-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>

            <div className="announcement-footer">
              <div className="announcement-date">
                <Calendar size={16} />
                <span>{item.date}</span>
              </div>
              <button className="announcements-read-more">
                Read More <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;