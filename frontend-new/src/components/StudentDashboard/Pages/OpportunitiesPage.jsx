import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, ExternalLink, GraduationCap } from 'lucide-react';
import axios from 'axios';
import './OpportunitiesPage.css';

const OpportunitiesPage = ({ onBack }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/jobs-internships/student/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setJobs(res.data.data || []);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load opportunities');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(j => j.type === filter);

  const isUrgent = (deadline) => {
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  if (loading) {
    return (
      <div className="op-container">
        <div className="op-loading">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="op-container">
      <div className="op-header">
        <button className="op-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Jobs & Internships</h1>
        <p>Opportunities matching your skills and courses</p>
      </div>

      {error && <div className="op-error">{error}</div>}

      {/* Stats */}
      <div className="op-stats">
        <div className="op-stat">
          <span className="op-stat-number">{jobs.filter(j => j.type === 'Job').length}</span>
          <span className="op-stat-label">Jobs</span>
        </div>
        <div className="op-stat">
          <span className="op-stat-number">{jobs.filter(j => j.type === 'Internship').length}</span>
          <span className="op-stat-label">Internships</span>
        </div>
        <div className="op-stat">
          <span className="op-stat-number">{jobs.length}</span>
          <span className="op-stat-label">Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="op-filters">
        <button 
          className={`op-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Opportunities
        </button>
        <button 
          className={`op-filter-btn ${filter === 'Job' ? 'active' : ''}`}
          onClick={() => setFilter('Job')}
        >
          💼 Jobs
        </button>
        <button 
          className={`op-filter-btn ${filter === 'Internship' ? 'active' : ''}`}
          onClick={() => setFilter('Internship')}
        >
          🎓 Internships
        </button>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="op-empty">
          <Briefcase size={48} className="op-empty-icon" />
          <h3>No opportunities available</h3>
          <p>New opportunities will appear here when they match your enrolled courses.</p>
        </div>
      ) : (
        <div className="op-grid">
          {filteredJobs.map(job => (
            <div key={job._id} className="op-card">
              <div className="op-card-header">
                <div className="op-type-badge op-type-badge--job">
                  {job.type === 'Job' ? '💼' : '🎓'} {job.type}
                </div>
                {isUrgent(job.deadline) && (
                  <span className="op-urgent-badge">⏰ Urgent</span>
                )}
              </div>

              <h3 className="op-title">{job.title}</h3>
              <p className="op-company">{job.company}</p>
              
              <p className="op-description">{job.description}</p>

              <div className="op-details">
                {job.location && (
                  <div className="op-detail">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.salary && job.salary !== 'Not disclosed' && (
                  <div className="op-detail">
                    <DollarSign size={16} />
                    <span>{job.salary}</span>
                  </div>
                )}
                <div className="op-detail">
                  <Clock size={16} />
                  <span className={isUrgent(job.deadline) ? 'op-urgent-text' : ''}>
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="op-skills">
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="op-skill">{skill}</span>
                  ))}
                </div>
              )}

              <div className="op-footer">
                {job.applicationUrl ? (
                  <a 
                    href={job.applicationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="op-apply-btn"
                  >
                    Apply Now <ExternalLink size={16} />
                  </a>
                ) : (
                  <button className="op-apply-btn" disabled>
                    Apply via Portal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;