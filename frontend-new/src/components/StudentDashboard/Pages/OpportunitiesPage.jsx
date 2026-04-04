import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, ExternalLink, GraduationCap, Building2 } from 'lucide-react';
import axios from 'axios';
import './OpportunitiesPage.css';

const OpportunitiesPage = ({ onBack }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const API_URL = '${import.meta.env.VITE_API_URL}/api';

  useEffect(() => {
    fetchJobs();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // ✅ Fetch jobs for student's enrolled courses
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
const res = await axios.get(`${API_URL}/jobs/student/available`, getAuthHeaders());      
      console.log('Student jobs fetched:', res.data);
      
      if (res.data.success) {
        setJobs(res.data.data || []);
        setDebugInfo(res.data.debug);
        
        // Show warning if no courses found
        if (res.data.debug?.courseCount === 0) {
          console.warn('No enrolled courses found!');
        }
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load opportunities: ' + (err.response?.data?.message || err.message));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Check enrollment status
  const checkEnrollment = async () => {
    try {
      const res = await axios.get(`${API_URL}/student-dashboard/my-courses`, getAuthHeaders());
      console.log('Enrollment check:', res.data);
      alert(`Enrollment Status:\n${JSON.stringify(res.data.enrollmentResults, null, 2)}`);
    } catch (err) {
      console.error('Error checking enrollment:', err);
      alert('Error checking enrollment: ' + err.message);
    }
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(j => j.type === filter);

  const isUrgent = (deadline) => {
    if (!deadline) return false;
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft >= 0;
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return 'No deadline';
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (loading) {
    return (
      <div className="op-container">
        <div className="op-loading">
          <div className="op-spinner"></div>
          Loading opportunities...
        </div>
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
        <p>Exclusive opportunities matching your enrolled courses</p>
      </div>

      {error && <div className="op-error">{error}</div>}

      {/* Debug Info */}
      {debugInfo && debugInfo.courseCount === 0 && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          color: '#92400e'
        }}>
          <strong>⚠️ Not enrolled in any courses</strong>
          <p style={{margin: '8px 0'}}>You need to enroll in a course to see job opportunities.</p>
          <button 
            onClick={checkEnrollment}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Check Enrollment Status
          </button>
        </div>
      )}

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
          <span className="op-stat-label">Available</span>
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
          <p>
            {debugInfo?.courseCount === 0 
              ? "You are not enrolled in any courses. Please enroll in a course first."
              : "New opportunities will appear here when they match your enrolled courses."
            }
          </p>
          <button 
            onClick={fetchJobs} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#000B29',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Refresh
          </button>
          {debugInfo?.courseCount === 0 && (
            <button 
              onClick={checkEnrollment}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#E30613',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔍 Check Enrollment
            </button>
          )}
        </div>
      ) : (
        <div className="op-grid">
          {filteredJobs.map(job => (
            <div key={job._id} className="op-card">
              <div className="op-card-header">
                <div className={`op-type-badge op-type-badge--${job.type?.toLowerCase() || 'job'}`}>
                  {job.type === 'Job' ? '💼' : '🎓'} {job.type}
                </div>
                {isUrgent(job.deadline) && (
                  <span className="op-urgent-badge">⏰ Urgent</span>
                )}
              </div>

              <h3 className="op-title">{job.title}</h3>
              <p className="op-company">
                <Building2 size={16} />
                {job.company}
              </p>
              
              <p className="op-description">{job.description}</p>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="op-requirements">
                  <h4>Requirements:</h4>
                  <ul>
                    {job.requirements.slice(0, 3).map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                    {job.requirements.length > 3 && (
                      <li className="op-more">+{job.requirements.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

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
                    {getDaysLeft(job.deadline)}
                  </span>
                </div>
                {job.relevantCourses && job.relevantCourses.length > 0 && (
                  <div className="op-detail op-courses">
                    <GraduationCap size={16} />
                    <span>For: {job.relevantCourses.map(c => c.title || c.name || 'Course').join(', ')}</span>
                  </div>
                )}
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="op-skills">
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="op-skill">{skill}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="op-skill op-skill-more">+{job.skills.length - 4}</span>
                  )}
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
                    Apply via Portal (Coming Soon)
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