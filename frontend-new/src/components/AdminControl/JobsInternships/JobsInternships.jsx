import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobsInternships.css';

const JobsInternships = () => {
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    type: 'Job',
    description: '',
    requirements: '',
    skills: '',
    relevantCourses: [],
    location: '',
    salary: '',
    applicationUrl: '',
    deadline: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchCourses();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/careers');
      // 🔥 FIX: Ensure array
      const jobsData = Array.isArray(res.data) ? res.data : 
                      Array.isArray(res.data?.jobs) ? res.data.jobs : 
                      Array.isArray(res.data?.data) ? res.data.data : [];
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      // 🔥 FIX: Ensure array
      const coursesData = Array.isArray(res.data) ? res.data : 
                         Array.isArray(res.data?.courses) ? res.data.courses : 
                         Array.isArray(res.data?.data) ? res.data.data : [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : []
      };
      await axios.post('http://localhost:5000/api/jobs-internships', data);
      fetchJobs();
      resetForm();
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      type: 'Job',
      description: '',
      requirements: '',
      skills: '',
      relevantCourses: [],
      location: '',
      salary: '',
      applicationUrl: '',
      deadline: ''
    });
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(j => j.type?.toLowerCase() === filter.toLowerCase());

  if (loading) {
    return (
      <div className="ji-container">
        <div className="ji-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ji-container">
      <div className="ji-header">
        <h2>💼 Manage Jobs & Internships</h2>
        <p>Post job and internship opportunities for students</p>
      </div>
      
      {/* Stats */}
      <div className="ji-stats">
        <div className="ji-stat-card">
          <div className="ji-stat-icon">💼</div>
          <div className="ji-stat-info">
            <h3>{jobs.filter(j => j.type === 'Job').length}</h3>
            <p>Jobs</p>
          </div>
        </div>
        <div className="ji-stat-card">
          <div className="ji-stat-icon">🎓</div>
          <div className="ji-stat-info">
            <h3>{jobs.filter(j => j.type === 'Internship').length}</h3>
            <p>Internships</p>
          </div>
        </div>
        <div className="ji-stat-card">
          <div className="ji-stat-icon">📊</div>
          <div className="ji-stat-info">
            <h3>{jobs.length}</h3>
            <p>Total</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="ji-form-section">
        <h3 className="ji-form-title">➕ Post New Opportunity</h3>
        <form onSubmit={handleSubmit} className="ji-form">
          <div className="ji-form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g., Frontend Developer"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="ji-form-group">
            <label>Company *</label>
            <input
              type="text"
              placeholder="e.g., Google"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              required
            />
          </div>
          
          <div className="ji-form-group">
            <label>Type</label>
            <div className="ji-type-toggle">
              <button
                type="button"
                className={`ji-type-option ${formData.type === 'Job' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, type: 'Job'})}
              >
                💼 Job
              </button>
              <button
                type="button"
                className={`ji-type-option ${formData.type === 'Internship' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, type: 'Internship'})}
              >
                🎓 Internship
              </button>
            </div>
          </div>
          
          <div className="ji-form-group full-width">
            <label>Description *</label>
            <textarea
              placeholder="Job description..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows="4"
            />
          </div>
          
          <div className="ji-form-group full-width">
            <label>Requirements (one per line)</label>
            <textarea
              placeholder="Bachelor's degree&#10;2 years experience&#10;React knowledge"
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="ji-form-group">
            <label>Skills (comma separated)</label>
            <input
              type="text"
              placeholder="React, Node.js, MongoDB"
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
            />
          </div>
          
          <div className="ji-form-group">
            <label>Relevant Courses</label>
            <select
              multiple
              value={formData.relevantCourses}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                setFormData({...formData, relevantCourses: values});
              }}
              size="4"
            >
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="ji-form-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Remote, Lahore"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          
          <div className="ji-form-group">
            <label>Salary (Optional)</label>
            <input
              type="text"
              placeholder="e.g., 50k-80k PKR"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
            />
          </div>
          
          <div className="ji-form-group">
            <label>Application URL</label>
            <input
              type="url"
              placeholder="https://careers.company.com"
              value={formData.applicationUrl}
              onChange={(e) => setFormData({...formData, applicationUrl: e.target.value})}
            />
          </div>
          
          <div className="ji-form-group">
            <label>Deadline *</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              required
            />
          </div>
          
          <div className="ji-form-actions">
            <button type="submit" className="ji-btn ji-btn-primary">
              🚀 Post Opportunity
            </button>
            <button type="button" className="ji-btn ji-btn-secondary" onClick={resetForm}>
              ❌ Reset
            </button>
          </div>
        </form>
      </div>

      {/* Jobs List */}
      <div className="ji-jobs-section">
        <div className="ji-section-header">
          <h3 className="ji-section-title">📋 Posted Opportunities</h3>
          <div className="ji-filters">
            <button 
              className={`ji-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`ji-filter-btn ${filter === 'job' ? 'active' : ''}`}
              onClick={() => setFilter('job')}
            >
              Jobs
            </button>
            <button 
              className={`ji-filter-btn ${filter === 'internship' ? 'active' : ''}`}
              onClick={() => setFilter('internship')}
            >
              Internships
            </button>
          </div>
        </div>
        
        {filteredJobs.length === 0 ? (
          <div className="ji-empty-state">
            <div className="ji-empty-icon">💼</div>
            <h3>No opportunities yet</h3>
            <p>Post your first job or internship above</p>
          </div>
        ) : (
          <div className="ji-jobs-grid">
            {filteredJobs.map(job => (
              <div key={job._id} className="ji-job-card">
                <div className="ji-status active" title="Active"></div>
                <div className="ji-job-header">
                  <div>
                    <h4 className="ji-job-title">{job.title}</h4>
                    <p className="ji-job-company">{job.company}</p>
                  </div>
                  <span className={`ji-job-type ${job.type?.toLowerCase() || 'job'}`}>
                    {job.type || 'Job'}
                  </span>
                </div>
                
                <div className="ji-job-details">
                  {job.location && (
                    <div className="ji-job-detail">
                      <span className="ji-job-detail-icon">📍</span>
                      {job.location}
                    </div>
                  )}
                  {job.salary && (
                    <div className="ji-job-detail">
                      <span className="ji-job-detail-icon">💰</span>
                      {job.salary}
                    </div>
                  )}
                </div>
                
                <p className="ji-job-description">{job.description}</p>
                
                {job.skills && job.skills.length > 0 && (
                  <div className="ji-job-skills">
                    {job.skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="ji-skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
                
                <div className="ji-job-footer">
                  <span className={`ji-deadline ${new Date(job.deadline) < new Date(Date.now() + 7*24*60*60*1000) ? 'urgent' : ''}`}>
                    ⏰ Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}
                  </span>
                  <div className="ji-job-actions">
                    {job.applicationUrl && (
                      <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="ji-btn-view">
                        Apply ↗
                      </a>
                    )}
                    <button className="ji-btn-icon ji-btn-edit">✏️</button>
                    <button className="ji-btn-icon ji-btn-delete">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsInternships;