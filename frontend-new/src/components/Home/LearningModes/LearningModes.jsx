import React from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Video, Users, Calendar, Clock, CheckCircle, Play } from 'lucide-react';
import './LearningModes.css';

const LearningModes = () => {
  const sectionRef = useScrollAnimation();

  const liveFeatures = [
    'Real-time doubt solving with instructors',
    'Interactive batch sessions',
    'Fixed schedule for discipline',
    'Peer collaboration & networking',
    'Immediate feedback on assignments'
  ];

  const recordedFeatures = [
    'Learn anytime, anywhere at your pace',
    'Lifetime access to all content',
    'Downloadable resources & notes',
    'Pause, rewind & rewatch',
    'Compatible with your schedule'
  ];

  const upcomingLive = [
    { title: 'Full Stack Web Dev', date: 'Starting Feb 15', seats: 12 },
    { title: 'UI/UX Design Pro', date: 'Starting Feb 20', seats: 8 },
    { title: 'Data Science Bootcamp', date: 'Starting Mar 1', seats: 15 }
  ];

  return (
    <section ref={sectionRef} className="learning-modes-section">
      <div className="learning-modes-container">
        <div className="section-header reveal">
          <div className="section-label">Flexible Learning</div>
          <h2 className="section-title">Choose Your Learning Style</h2>
          <p className="section-subtitle">
            Whether you prefer live interaction or self-paced learning, we've got you covered
          </p>
        </div>

        <div className="modes-comparison">
          <div className="mode-card live-card reveal-left">
            <div className="mode-header">
              <div className="mode-icon live-icon">
                <Video size={32} />
                <span className="live-pulse"></span>
              </div>
              <div className="mode-badge live-badge">LIVE</div>
            </div>
            <h3 className="mode-title">Live Classes</h3>
            <p className="mode-description">
              Join interactive sessions with expert instructors in real-time
            </p>
            <ul className="mode-features">
              {liveFeatures.map((feature, index) => (
                <li key={index} className={`feature-item stagger-${index + 1}`}>
                  <CheckCircle size={18} className="feature-check" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="mode-btn live-btn">
              Browse Live Classes
            </button>
          </div>

          <div className="mode-divider">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          <div className="mode-card recorded-card reveal-right">
            <div className="mode-header">
              <div className="mode-icon recorded-icon">
                <Play size={32} fill="currentColor" />
              </div>
              <div className="mode-badge recorded-badge">RECORDED</div>
            </div>
            <h3 className="mode-title">Recorded Courses</h3>
            <p className="mode-description">
              Access pre-recorded content and learn at your own convenience
            </p>
            <ul className="mode-features">
              {recordedFeatures.map((feature, index) => (
                <li key={index} className={`feature-item stagger-${index + 1}`}>
                  <CheckCircle size={18} className="feature-check" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="mode-btn recorded-btn">
              Browse Recorded
            </button>
          </div>
        </div>

        <div className="upcoming-live-section reveal">
          <h3 className="upcoming-title">
            <Calendar size={24} />
            Upcoming Live Batches
          </h3>
          <div className="upcoming-grid">
            {upcomingLive.map((batch, index) => (
              <div key={index} className={`upcoming-card stagger-${index + 1}`}>
                <div className="upcoming-info">
                  <h4>{batch.title}</h4>
                  <span className="upcoming-date">{batch.date}</span>
                </div>
                <div className="upcoming-seats">
                  <Users size={16} />
                  <span>{batch.seats} seats left</span>
                </div>
                <button className="reserve-btn">Reserve Seat</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningModes;