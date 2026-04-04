import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobsInternships.css';

const JobsInternships = () => {
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingJob, setEditingJob] = useState(null);
  
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

  const API_URL = '${import.meta.env.VITE_API_URL}/api';

  useEffect(() => {
    fetchJobs();
    fetchCourses();
    
    // 🔥 Real-time refresh every 10 seconds for admin
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/jobs`, getAuthHeaders());
      console.log('Fetched jobs:', res.data);
      setJobs(res.data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Error loading jobs: ' + (error.response?.data?.message || error.message));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses/for-assignments`, getAuthHeaders());
      console.log('Fetched courses:', res.data);
      
      let coursesData = [];
      if (res.data.courses) {
        coursesData = res.data.courses;
      } else if (Array.isArray(res.data)) {
        coursesData = res.data;
      } else if (res.data.data) {
        coursesData = res.data.data;
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.relevantCourses.length === 0) {
      alert('Please select at least one relevant course!');
      return;
    }

    try {
      setSubmitting(true);
      
      const data = {
        ...formData,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : []
      };

      console.log('Submitting job data:', data);

      if (editingJob) {
        await axios.put(`${API_URL}/jobs/${editingJob._id}`, data, getAuthHeaders());
        alert('Job updated successfully!');
      } else {
        await axios.post(`${API_URL}/jobs`, data, getAuthHeaders());
        alert('Job posted successfully! Students will see this immediately.');
      }
      
      fetchJobs();
      resetForm();
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      type: job.type || 'Job',
      description: job.description || '',
      requirements: job.requirements ? job.requirements.join('\n') : '',
      skills: job.skills ? job.skills.join(', ') : '',
      relevantCourses: job.relevantCourses?.map(c => c._id || c) || [],
      location: job.location || '',
      salary: job.salary || '',
      applicationUrl: job.applicationUrl || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
    });
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}`, getAuthHeaders());
      alert('Job deleted successfully!');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setEditingJob(null);
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

  if (loading && jobs.length === 0) {
    return (
      <div className="ji-container">
        <div className="ji-loading">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="ji-container">
      <div className="ji-header">
        <h2>Manage Jobs & Internships</h2>
        <p>Post job and internship opportunities for students (Real-time updates)</p>
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
            <p>Total Active</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="ji-form-section">
        <h3 className="ji-form-title">
          {editingJob ? '✏️ Edit Opportunity' : '➕ Post New Opportunity'}
        </h3>
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
            <label>Relevant Courses *</label>
            <select
              multiple
              value={formData.relevantCourses}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, o => o.value);
                setFormData({...formData, relevantCourses: values});
              }}
              size="4"
              required
            >
              {courses.length === 0 ? (
                <option disabled>Loading courses...</option>
              ) : (
                courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title || course.name || 'Untitled Course'}
                  </option>
                ))
              )}
            </select>
            <small>
              {formData.relevantCourses.length > 0 
                ? `${formData.relevantCourses.length} course(s) selected` 
                : 'Select courses for which this opportunity is relevant'}
            </small>
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
            <label>Application URL *</label>
            <input
              type="url"
              placeholder="https://careers.company.com"
              value={formData.applicationUrl}
              onChange={(e) => setFormData({...formData, applicationUrl: e.target.value})}
              required
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
            <button 
              type="submit" 
              className="ji-btn ji-btn-primary"
              disabled={submitting}
            >
              {submitting ? '⏳ Saving...' : (editingJob ? '💾 Update Opportunity' : '🚀 Post Opportunity')}
            </button>
            {editingJob && (
              <button 
                type="button" 
                className="ji-btn ji-btn-secondary" 
                onClick={resetForm}
                disabled={submitting}
              >
                ❌ Cancel Edit
              </button>
            )}
            {!editingJob && (
              <button 
                type="button" 
                className="ji-btn ji-btn-secondary" 
                onClick={resetForm}
                disabled={submitting}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Jobs List */}
      <div className="ji-jobs-section">
        <div className="ji-section-header">
          <h3 className="ji-section-title">📋 Posted Opportunities ({jobs.length})</h3>
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
                  {job.relevantCourses && job.relevantCourses.length > 0 && (
                    <div className="ji-job-detail">
                      <span className="ji-job-detail-icon">📚</span>
                      {job.relevantCourses.length} course(s): {job.relevantCourses.map(c => c.title || c.name || 'Course').join(', ')}
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
                      <a 
                        href={job.applicationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ji-btn-view"
                        title="Open application link"
                      >
                        Apply ↗
                      </a>
                    )}
                    <button 
                      className="ji-btn-icon ji-btn-edit" 
                      onClick={() => handleEdit(job)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="ji-btn-icon ji-btn-delete" 
                      onClick={() => handleDelete(job._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
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