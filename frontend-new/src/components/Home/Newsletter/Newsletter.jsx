import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import './Newsletter.css';

const Newsletter = () => {
  const sectionRef = useScrollAnimation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section ref={sectionRef} className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-content reveal">
          <div className="newsletter-icon">
            <Mail size={48} />
          </div>
          <h2 className="newsletter-title">Join 50,000+ Learners</h2>
          <p className="newsletter-description">
            Get weekly insights, free resources, and exclusive course discounts delivered to your inbox
          </p>

          {!subscribed ? (
            <form className="newsletter-form" onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="subscribe-btn">
                Subscribe
                <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            <div className="success-message">
              <CheckCircle size={32} />
              <span>Thank you for subscribing!</span>
            </div>
          )}

          <div className="newsletter-features">
            <span>✓ No spam, ever</span>
            <span>✓ Unsubscribe anytime</span>
            <span>✓ Weekly updates</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;