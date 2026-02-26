import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { ChevronRight, Clock, Award, Briefcase } from 'lucide-react';
import './LearningPaths.css';

const LearningPaths = () => {
  const sectionRef = useScrollAnimation();
  const [activePath, setActivePath] = useState(0);

  const paths = [
    {
      id: 0,
      title: 'Full Stack Developer',
      duration: '6 Months',
      level: 'Beginner to Advanced',
      salary: '80k - 150k PKR',
      steps: [
        { name: 'HTML & CSS Basics', duration: '2 weeks', icon: '🌐' },
        { name: 'JavaScript Mastery', duration: '4 weeks', icon: '⚡' },
        { name: 'React.js Framework', duration: '4 weeks', icon: '⚛️' },
        { name: 'Node.js Backend', duration: '4 weeks', icon: '🟢' },
        { name: 'Database & APIs', duration: '3 weeks', icon: '🗄️' },
        { name: 'Real Projects', duration: '5 weeks', icon: '🚀' },
        { name: 'Job Preparation', duration: '2 weeks', icon: '💼' }
      ]
    },
    {
      id: 1,
      title: 'UI/UX Designer',
      duration: '4 Months',
      level: 'Beginner to Pro',
      salary: '60k - 120k PKR',
      steps: [
        { name: 'Design Fundamentals', duration: '2 weeks', icon: '🎨' },
        { name: 'Figma Mastery', duration: '4 weeks', icon: '🖌️' },
        { name: 'User Research', duration: '3 weeks', icon: '🔍' },
        { name: 'Prototyping', duration: '3 weeks', icon: '📱' },
        { name: 'Portfolio Building', duration: '4 weeks', icon: '💼' }
      ]
    },
    {
      id: 2,
      title: 'Data Scientist',
      duration: '8 Months',
      level: 'Intermediate',
      salary: '100k - 200k PKR',
      steps: [
        { name: 'Python Basics', duration: '3 weeks', icon: '🐍' },
        { name: 'Data Analysis', duration: '4 weeks', icon: '📊' },
        { name: 'Machine Learning', duration: '6 weeks', icon: '🤖' },
        { name: 'Deep Learning', duration: '5 weeks', icon: '🧠' },
        { name: 'Projects & Deployment', duration: '6 weeks', icon: '🚀' }
      ]
    }
  ];

  return (
    <section ref={sectionRef} className="learning-paths-section">
      <div className="learning-paths-container">
        <div className="section-header reveal">
          <div className="section-label">Career Tracks</div>
          <h2 className="section-title">Structured Learning Paths</h2>
          <p className="section-subtitle">
            Follow our expert-curated roadmaps to land your dream job
          </p>
        </div>

        <div className="paths-selector reveal">
          {paths.map((path) => (
            <button
              key={path.id}
              className={`path-tab ${activePath === path.id ? 'active' : ''}`}
              onClick={() => setActivePath(path.id)}
            >
              {path.title}
            </button>
          ))}
        </div>

        <div className="path-content reveal-scale">
          <div className="path-header">
            <div className="path-info">
              <h3>{paths[activePath].title}</h3>
              <div className="path-meta">
                <span className="meta-item">
                  <Clock size={16} />
                  {paths[activePath].duration}
                </span>
                <span className="meta-item">
                  <Award size={16} />
                  {paths[activePath].level}
                </span>
                <span className="meta-item salary">
                  <Briefcase size={16} />
                  {paths[activePath].salary}
                </span>
              </div>
            </div>
            <button className="start-path-btn">
              Start This Path
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="path-timeline">
            {paths[activePath].steps.map((step, index) => (
              <div key={index} className={`timeline-item stagger-${(index % 5) + 1}`}>
                <div className="timeline-connector">
                  <div className="timeline-dot">{index + 1}</div>
                  {index < paths[activePath].steps.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>
                <div className="timeline-content">
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-details">
                    <h4>{step.name}</h4>
                    <span>{step.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningPaths;