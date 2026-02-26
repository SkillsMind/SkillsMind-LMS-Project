import React, { useState } from 'react';
import { Briefcase, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import './CareerSimulator.css';

const CareerSimulator = () => {
  const [selectedPath, setSelectedPath] = useState('frontend');
  
  const paths = {
    frontend: {
      title: 'Frontend Developer',
      salary: '$75k - $120k',
      timeline: '6-12 months',
      skills: [
        { name: 'HTML/CSS', level: 90 },
        { name: 'JavaScript', level: 75 },
        { name: 'React', level: 60 },
        { name: 'TypeScript', level: 40 }
      ],
      milestones: [
        { level: 'Junior', salary: '$45k', time: '0-1 year', done: true },
        { level: 'Mid-level', salary: '$75k', time: '1-3 years', done: false },
        { level: 'Senior', salary: '$110k', time: '3-5 years', done: false },
        { level: 'Lead', salary: '$150k+', time: '5+ years', done: false }
      ]
    }
  };

  const currentPath = paths[selectedPath];

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>🚀 Career Path Simulator</h2>
        <p>Visualize your career trajectory</p>
      </div>

      <div className="simulator-layout">
        <div className="path-selector">
          {['frontend', 'backend', 'fullstack', 'devops'].map((path) => (
            <button
              key={path}
              className={`path-btn ${selectedPath === path ? 'active' : ''}`}
              onClick={() => setSelectedPath(path)}
            >
              {path.charAt(0).toUpperCase() + path.slice(1)}
            </button>
          ))}
        </div>

        <div className="career-overview">
          <div className="overview-card">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <div>
              <label>Role</label>
              <h3>{currentPath.title}</h3>
            </div>
          </div>
          <div className="overview-card">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <label>Salary Range</label>
              <h3>{currentPath.salary}</h3>
            </div>
          </div>
          <div className="overview-card">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <label>Timeline</label>
              <h3>{currentPath.timeline}</h3>
            </div>
          </div>
        </div>

        <div className="career-timeline">
          <h3>Career Progression</h3>
          <div className="timeline-track">
            {currentPath.milestones.map((milestone, idx) => (
              <div key={idx} className={`milestone ${milestone.done ? 'completed' : ''}`}>
                <div className="milestone-dot">
                  {milestone.done && <CheckCircle className="w-5 h-5" />}
                </div>
                <div className="milestone-info">
                  <h4>{milestone.level}</h4>
                  <p className="salary">{milestone.salary}</p>
                  <p className="time">{milestone.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="skill-gap">
          <h3>Skill Gap Analysis</h3>
          {currentPath.skills.map((skill) => (
            <div key={skill.name} className="skill-row">
              <span>{skill.name}</span>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${skill.level}%` }}
                ></div>
                <span>{skill.level}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerSimulator;