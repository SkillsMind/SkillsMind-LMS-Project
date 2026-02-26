import React from 'react';
import { useScrollAnimation, useCountUp } from '../../../hooks/useScrollAnimation';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import './StatsSection.css';

const StatItem = ({ icon: Icon, end, suffix, label }) => {
  const [count, ref] = useCountUp(end, 2000);
  
  return (
    <div ref={ref} className="stat-item reveal-scale">
      <div className="stat-icon-wrapper">
        <Icon size={28} className="stat-icon" />
      </div>
      <div className="stat-number">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

const StatsSection = () => {
  const sectionRef = useScrollAnimation();

  const stats = [
    { icon: Users, end: 50000, suffix: '+', label: 'Active Students' },
    { icon: BookOpen, end: 250, suffix: '+', label: 'Expert Courses' },
    { icon: Award, end: 95, suffix: '%', label: 'Success Rate' },
    { icon: TrendingUp, end: 150, suffix: '+', label: 'Hiring Partners' }
  ];

  return (
    <section ref={sectionRef} className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stagger-${index + 1}`}>
              <StatItem {...stat} />
            </div>
          ))}
        </div>
        
        <div className="trust-badge reveal">
          <span className="trust-text">Trusted by leading companies</span>
          <div className="company-logos">
            <div className="company-logo">Jazz</div>
            <div className="company-logo">Careem</div>
            <div className="company-logo">Telenor</div>
            <div className="company-logo">Systems</div>
            <div className="company-logo">Arbisoft</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;