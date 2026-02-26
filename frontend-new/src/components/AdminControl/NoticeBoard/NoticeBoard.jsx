import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NoticeBoard.css';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General',
    targetAudience: [],
    priority: 0,
    expiryDate: ''
  });

  useEffect(() => {
    fetchNotices();
    fetchCourses();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/notices');
      // 🔥 FIX: Ensure array
      const noticesData = Array.isArray(res.data) ? res.data : 
                         Array.isArray(res.data?.notices) ? res.data.notices : 
                         Array.isArray(res.data?.data) ? res.data.data : [];
      setNotices(noticesData);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNotices([]);
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
      await axios.post('http://localhost:5000/api/notices', formData);
      fetchNotices();
      resetForm();
    } catch (error) {
      console.error('Error posting notice:', error);
      alert('Error posting notice. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'General',
      targetAudience: [],
      priority: 0,
      expiryDate: ''
    });
  };

  const handleCourseSelect = (e) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setFormData({...formData, targetAudience: values});
  };

  const getNoticeIcon = (type) => {
    switch(type) {
      case 'Urgent': return '🔴';
      case 'Event': return '📅';
      case 'News': return '📰';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <div className="nb-container">
        <div className="nb-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="nb-container">
      <div className="nb-header">
        <h2>📢 Manage Notice Board</h2>
        <p>Post important announcements and news for students</p>
      </div>
      
      {/* Stats */}
      <div className="nb-stats">
        <div className="nb-stat-card">
          <div className="nb-stat-icon">📢</div>
          <div className="nb-stat-info">
            <h3>{notices.length}</h3>
            <p>Active Notices</p>
          </div>
        </div>
        <div className="nb-stat-card">
          <div className="nb-stat-icon">📅</div>
          <div className="nb-stat-info">
            <h3>{notices.filter(n => n.type === 'Event').length}</h3>
            <p>Events</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="nb-form-section">
        <h3 className="nb-form-title">📝 Post New Notice</h3>
        <form onSubmit={handleSubmit} className="nb-form">
          <div className="nb-form-group">
            <label>Notice Title *</label>
            <input
              type="text"
              placeholder="Enter notice title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="nb-form-group full-width">
            <label>Content *</label>
            <textarea
              placeholder="Enter notice content..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
              rows="4"
            />
          </div>
          
          <div className="nb-form-group">
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="General">General</option>
              <option value="Event">Event</option>
              <option value="Urgent">Urgent</option>
              <option value="News">News</option>
            </select>
          </div>
          
          <div className="nb-form-group">
            <label>Target Audience</label>
            <select
              multiple
              value={formData.targetAudience}
              onChange={handleCourseSelect}
              size="4"
            >
              <option value="">All Students (General)</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
          
          <div className="nb-form-group">
            <label>Priority (0-10)</label>
            <div className="nb-priority-slider">
              <input
                type="range"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
              />
              <span className="nb-priority-value">{formData.priority}</span>
            </div>
          </div>
          
          <div className="nb-form-group">
            <label>Expiry Date</label>
            <input
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
            />
          </div>
          
          <div className="nb-form-actions">
            <button type="submit" className="nb-btn nb-btn-primary">
              📢 Post Notice
            </button>
            <button type="button" className="nb-btn nb-btn-secondary" onClick={resetForm}>
              ❌ Reset
            </button>
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div className="nb-notices-section">
        <div className="nb-section-header">
          <h3 className="nb-section-title">📋 Active Notices</h3>
          <div className="nb-filter-tabs">
            <button className="nb-filter-tab active">All</button>
            <button className="nb-filter-tab">Urgent</button>
            <button className="nb-filter-tab">Events</button>
          </div>
        </div>
        
        {notices.length === 0 ? (
          <div className="nb-empty-state">
            <div className="nb-empty-icon">📭</div>
            <h3>No notices yet</h3>
            <p>Create your first notice above</p>
          </div>
        ) : (
          <div className="nb-notices-list">
            {notices.map(notice => (
              <div key={notice._id} className={`nb-notice-card ${notice.type?.toLowerCase() || 'general'}`}>
                <div className="nb-notice-header">
                  <span className={`nb-notice-type ${notice.type?.toLowerCase() || 'general'}`}>
                    {getNoticeIcon(notice.type)} {notice.type || 'General'}
                  </span>
                  <span className="nb-notice-date">
                    📅 {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <h4 className="nb-notice-title">{notice.title}</h4>
                <p className="nb-notice-content">{notice.content}</p>
                <div className="nb-notice-footer">
                  <span className="nb-notice-audience">
                    👥 {notice.targetAudience?.length > 0 ? 'Specific Courses' : 'All Students'}
                  </span>
                  <div className="nb-notice-actions">
                    <button className="nb-btn-small nb-btn-edit-small">Edit</button>
                    <button className="nb-btn-small nb-btn-delete-small">Delete</button>
                  </div>
                </div>
                {notice.priority > 5 && <div className="nb-priority-indicator" title="High Priority"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;