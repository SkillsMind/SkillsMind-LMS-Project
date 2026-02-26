import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ImportantLinks.css';

const ImportantLinks = () => {
  const [links, setLinks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    course: '',
    category: 'Study Material'
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchLinks();
    fetchCourses();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/important-links');
      // 🔥 FIX: Ensure array
      const linksData = Array.isArray(res.data) ? res.data : 
                       Array.isArray(res.data?.links) ? res.data.links : 
                       Array.isArray(res.data?.data) ? res.data.data : [];
      setLinks(linksData);
    } catch (error) {
      console.error('Error fetching links:', error);
      setLinks([]);
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
      if (editingId) {
        await axios.put(`http://localhost:5000/api/important-links/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/important-links', formData);
      }
      fetchLinks();
      resetForm();
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Error saving link. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      course: '',
      category: 'Study Material'
    });
    setEditingId(null);
  };

  const handleEdit = (link) => {
    setFormData({
      title: link.title || '',
      url: link.url || '',
      description: link.description || '',
      course: link.course?._id || link.course || '',
      category: link.category || 'Study Material'
    });
    setEditingId(link._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this link?')) {
      try {
        await axios.delete(`http://localhost:5000/api/important-links/${id}`);
        fetchLinks();
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('Error deleting link.');
      }
    }
  };

  if (loading) {
    return (
      <div className="il-container">
        <div className="il-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="il-container">
      <div className="il-header">
        <h2>🔗 Manage Important Links</h2>
        <p>Add course-specific important links for students</p>
      </div>
      
      {/* Stats */}
      <div className="il-stats">
        <div className="il-stat-card">
          <div className="il-stat-icon">🔗</div>
          <div className="il-stat-info">
            <h3>{links.length}</h3>
            <p>Total Links</p>
          </div>
        </div>
        <div className="il-stat-card">
          <div className="il-stat-icon">📚</div>
          <div className="il-stat-info">
            <h3>{courses.length}</h3>
            <p>Courses</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="il-form-section">
        <h3 className="il-form-title">{editingId ? '✏️ Edit Link' : '➕ Add New Link'}</h3>
        <form onSubmit={handleSubmit} className="il-form">
          <div className="il-form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g., Python Documentation"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="il-form-group">
            <label>URL *</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              required
            />
          </div>
          
          <div className="il-form-group full-width">
            <label>Description</label>
            <textarea
              placeholder="Brief description of this link..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="il-form-group">
            <label>Course *</label>
            <select
              value={formData.course}
              onChange={(e) => setFormData({...formData, course: e.target.value})}
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="il-form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Study Material">Study Material</option>
              <option value="Reference">Reference</option>
              <option value="Tool">Tool</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="il-form-actions">
            <button type="submit" className="il-btn il-btn-primary">
              {editingId ? '💾 Update Link' : '➕ Add Link'}
            </button>
            {editingId && (
              <button type="button" className="il-btn il-btn-secondary" onClick={resetForm}>
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Links List */}
      <div className="il-table-section">
        <div className="il-table-header">
          <h3 className="il-table-title">All Important Links</h3>
          <div className="il-search-box">
            <input type="text" placeholder="Search links..." />
          </div>
        </div>
        
        {links.length === 0 ? (
          <div className="il-empty-state">
            <div className="il-empty-icon">🔗</div>
            <h3>No links found</h3>
            <p>Add your first important link above</p>
          </div>
        ) : (
          <table className="il-table">
            <thead>
              <tr>
                <th>Link Details</th>
                <th>Course</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link._id}>
                  <td>
                    <div className="il-link-cell">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="il-link-title">
                        {link.title}
                      </a>
                      <span className="il-link-url">{link.url}</span>
                    </div>
                  </td>
                  <td>
                    <span className="il-course-badge">
                      {link.course?.name || 'General'}
                    </span>
                  </td>
                  <td>
                    <span className={`il-category-badge il-category-${link.category?.toLowerCase().replace(' ', '-') || 'other'}`}>
                      {link.category || 'Other'}
                    </span>
                  </td>
                  <td>
                    <div className="il-actions">
                      <button className="il-btn-icon il-btn-edit" onClick={() => handleEdit(link)} title="Edit">
                        ✏️
                      </button>
                      <button className="il-btn-icon il-btn-delete" onClick={() => handleDelete(link._id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ImportantLinks;