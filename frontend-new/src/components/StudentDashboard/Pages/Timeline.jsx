import React from 'react';
import { Clock, CheckCircle, Circle, Award } from 'lucide-react';
import './Design.css';

const Timeline = () => {
  const timelineEvents = [
    { id: 1, title: 'Course Enrolled', date: 'Jan 15, 2024', status: 'completed', description: 'Started Digital Marketing Mastery' },
    { id: 2, title: 'First Assignment', date: 'Jan 20, 2024', status: 'completed', description: 'Submitted SEO Analysis Report' },
    { id: 3, title: 'Mid-term Quiz', date: 'Jan 28, 2024', status: 'current', description: 'Scored 85% - Great performance!' },
    { id: 4, title: 'Project Submission', date: 'Feb 5, 2024', status: 'upcoming', description: 'Client Proposal Project due' },
    { id: 5, title: 'Final Exam', date: 'Feb 15, 2024', status: 'upcoming', description: 'Comprehensive final assessment' },
    { id: 6, title: 'Certificate', date: 'Feb 20, 2024', status: 'locked', description: 'Course completion certificate' }
  ];

  const getIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={20} className="icon-completed" />;
    if (status === 'current') return <Circle size={20} className="icon-current pulse" />;
    if (status === 'locked') return <Award size={20} className="icon-locked" />;
    return <Clock size={20} className="icon-upcoming" />;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Learning Timeline</h1>
        <p>Your journey through the course</p>
      </div>

      <div className="timeline-container">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className={`timeline-row ${event.status}`}>
            <div className="timeline-marker">
              {getIcon(event.status)}
              {index !== timelineEvents.length - 1 && <div className="timeline-line"></div>}
            </div>
            <div className="timeline-card">
              <div className="timeline-date">{event.date}</div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <span className={`status-label ${event.status}`}>
                {event.status === 'completed' && 'Completed'}
                {event.status === 'current' && 'In Progress'}
                {event.status === 'upcoming' && 'Upcoming'}
                {event.status === 'locked' && 'Locked'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;