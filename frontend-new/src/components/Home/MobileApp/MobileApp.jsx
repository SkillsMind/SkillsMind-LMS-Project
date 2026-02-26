import React from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Download, Wifi, Bell, Smartphone } from 'lucide-react';
import './MobileApp.css';

const MobileApp = () => {
  const sectionRef = useScrollAnimation();

  const features = [
    { icon: Wifi, title: 'Offline Learning', desc: 'Download courses and learn without internet' },
    { icon: Bell, title: 'Smart Reminders', desc: 'Never miss a class with personalized notifications' },
    { icon: Smartphone, title: 'Sync Progress', desc: 'Seamlessly switch between devices' }
  ];

  return (
    <section ref={sectionRef} className="mobile-app-section">
      <div className="mobile-app-container">
        <div className="mobile-app-content">
          <div className="app-info reveal-left">
            <div className="app-badge">📱 Mobile App</div>
            <h2 className="app-title">Learn Anytime, Anywhere</h2>
            <p className="app-description">
              Download our mobile app and take your learning on the go. 
              Access courses offline, get notifications, and sync your progress across all devices.
            </p>
            
            <div className="app-features">
              {features.map((feature, index) => (
                <div key={index} className={`app-feature stagger-${index + 1}`}>
                  <div className="app-feature-icon">
                    <feature.icon size={24} />
                  </div>
                  <div className="app-feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="app-downloads">
              <button className="store-btn">
                <div className="store-icon">🍎</div>
                <div className="store-text">
                  <span>Download on the</span>
                  <strong>App Store</strong>
                </div>
              </button>
              <button className="store-btn">
                <div className="store-icon">🤖</div>
                <div className="store-text">
                  <span>Get it on</span>
                  <strong>Google Play</strong>
                </div>
              </button>
            </div>
          </div>

          <div className="app-demo reveal-right">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="screen-notch"></div>
                </div>
                <div className="screen-content">
                  <div className="app-header">
                    <div className="app-logo">SM</div>
                    <div className="app-menu"></div>
                  </div>
                  <div className="app-courses">
                    <div className="course-thumb active"></div>
                    <div className="course-thumb"></div>
                    <div className="course-thumb"></div>
                  </div>
                  <div className="app-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <span>65% Complete</span>
                  </div>
                </div>
              </div>
              <div className="floating-card card-1">
                <span>🔔</span>
                <p>Class starting in 10 min!</p>
              </div>
              <div className="floating-card card-2">
                <span>🏆</span>
                <p>Assignment submitted!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;