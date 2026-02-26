import React, { useState } from 'react';
import { Bell, Search, Settings, Crown, Flame, Menu, X } from 'lucide-react';
import './Topbar.css';

const Topbar = ({ toggleSidebar, sidebarOpen, hidden = false }) => {
  // Agar hidden prop true hai toh kuch mat render karo
  if (hidden) {
    return null; // Ya <div style={{display: 'none'}}></div>
  }

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { 
      id: 1, 
      title: 'Assignment Graded', 
      message: 'SEO Report: 95/100 - Excellent work!', 
      time: '5 min ago', 
      type: 'success',
      unread: true 
    },
    { 
      id: 2, 
      title: 'Live Session Starting', 
      message: 'React Hooks session starts in 15 minutes', 
      time: '15 min ago', 
      type: 'info',
      unread: true 
    },
    { 
      id: 3, 
      title: 'New Badge Earned', 
      message: 'You earned "Fast Learner" badge!', 
      time: '2 hours ago', 
      type: 'achievement',
      unread: false 
    }
  ];

  return (
    <header className="skills-topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <div className="search-container">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search courses, tasks, mentors..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Streak Badge */}
        <div className="streak-widget">
          <div className="flame-icon">
            <Flame className="w-5 h-5" />
          </div>
          <div className="streak-text">
            <span className="streak-count">12</span>
            <span className="streak-label">Day Streak</span>
          </div>
        </div>

        {/* XP Badge */}
        <div className="xp-widget">
          <Crown className="xp-crown" />
          <span className="xp-points">2,450 XP</span>
        </div>

        {/* Notifications */}
        <div className="notification-container">
          <button 
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            <span className="notification-badge">2</span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-all">Mark all read</button>
              </div>
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                    <div className={`notif-dot ${notif.type}`}></div>
                    <div className="notif-content">
                      <h4>{notif.title}</h4>
                      <p>{notif.message}</p>
                      <span className="notif-time">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="view-all-btn">View All Notifications</button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="profile-container">
          <button 
            className="profile-btn"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="avatar-small">AS</div>
            <div className="profile-info">
              <span className="profile-name">Ahmad Student</span>
              <span className="profile-role">Level 12 Scholar</span>
            </div>
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-profile-header">
                <div className="avatar-large">AS</div>
                <div>
                  <h4>Ahmad Student</h4>
                  <p>ahmad@skillsmind.pk</p>
                </div>
              </div>
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button className="dropdown-item logout">
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;