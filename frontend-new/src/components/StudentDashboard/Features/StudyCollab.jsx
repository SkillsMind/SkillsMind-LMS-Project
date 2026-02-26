import React, { useState } from 'react';
import { Users, Search, MessageCircle, Video, Calendar, Star } from 'lucide-react';
import './StudyCollab.css';

const StudyCollab = () => {
  const [buddies] = useState([
    { id: 1, name: 'Fatima Khan', course: 'React Mastery', status: 'online', match: 95, avatar: 'FK' },
    { id: 2, name: 'Ali Raza', course: 'Node.js', status: 'studying', match: 88, avatar: 'AR' },
    { id: 3, name: 'Sara Ahmed', course: 'UI/UX Design', status: 'offline', match: 82, avatar: 'SA' },
  ]);

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>👥 Study Collab Hub</h2>
        <p>Find study partners based on your courses</p>
      </div>

      <div className="collab-grid">
        <div className="find-partners">
          <div className="search-box-large">
            <Search className="w-5 h-5" />
            <input type="text" placeholder="Find study buddies..." />
          </div>
          
          <div className="buddies-list">
            {buddies.map((buddy) => (
              <div key={buddy.id} className="buddy-card">
                <div className="buddy-avatar-large" style={{ background: `hsl(${buddy.id * 60}, 70%, 50%)` }}>
                  {buddy.avatar}
                  <div className={`status-dot ${buddy.status}`}></div>
                </div>
                <div className="buddy-info">
                  <h4>{buddy.name}</h4>
                  <p>{buddy.course}</p>
                  <div className="match-badge">
                    <Star className="w-3 h-3" />
                    {buddy.match}% Match
                  </div>
                </div>
                <div className="buddy-actions">
                  <button className="icon-btn"><MessageCircle className="w-4 h-4" /></button>
                  <button className="icon-btn call"><Video className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="study-rooms">
          <h3>🔴 Live Study Rooms</h3>
          <div className="room-card">
            <div className="room-header">
              <span className="live-badge">LIVE NOW</span>
              <span className="room-count">12 students</span>
            </div>
            <h4>React Hooks Deep Dive</h4>
            <p>Focus session: 45 mins remaining</p>
            <button className="join-room-btn">Join Room</button>
          </div>

          <div className="upcoming-sessions">
            <h3>📅 Upcoming Sessions</h3>
            <div className="session-item">
              <Calendar className="w-5 h-5" />
              <div>
                <p>JavaScript Quiz Practice</p>
                <span>Tomorrow, 3:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCollab;