import React from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Smartphone, Plus, Home, Share2 } from 'lucide-react';
import './MobileApp.css';

const MobileApp = () => {
  const sectionRef = useScrollAnimation();

  return (
    <section ref={sectionRef} className="mobile-app-section" id="mobile-app">
      <div className="mobile-app-container">
        <div className="mobile-app-header">
          <span className="mobile-badge">
            <Smartphone size={14} />
            Mobile Access
          </span>
          <h2 className="mobile-title">
            Turn SkillsMind into 
            <span> Your Learning App</span>
          </h2>
          <p className="mobile-description">
            No app download needed. Add to home screen and use it like a native app.
          </p>
        </div>

        <div className="mobile-steps-wrapper">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <Share2 size={22} />
            </div>
            <h3>Tap Share</h3>
            <p>Tap the share icon in your browser</p>
          </div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <Plus size={22} />
            </div>
            <h3>Add to Home Screen</h3>
            <p>Select "Add to Home Screen" option</p>
          </div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <Home size={22} />
            </div>
            <h3>Open Like an App</h3>
            <p>Access SkillsMind from your phone screen</p>
          </div>
        </div>

        <div className="mobile-note">
          <span>📱</span>
          <p>Works on iPhone (Safari) & Android (Chrome)</p>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;