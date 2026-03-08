import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ImportantLinks.css';

const ImportantLinks = () => {
  const [links, setLinks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/important-links', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const linksData = res.data?.data || res.data || [];
      setLinks(Array.isArray(linksData) ? linksData : []);
    } catch (error) {
      console.error('Error fetching links:', error);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Proper courses fetch using your existing endpoint
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Use the correct endpoint that returns all courses
      const res = await axios.get('http://localhost:5000/api/courses/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Raw courses response:', res.data); // Debug log
      
      // Handle different response formats
      let coursesData = [];
      
      if (Array.isArray(res.data)) {
        // Direct array response
        coursesData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        // { data: [...] } format
        coursesData = res.data.data;
      } else if (res.data?.courses && Array.isArray(res.data.courses)) {
        // { courses: [...] } format
        coursesData = res.data.courses;
      }
      
      // Map courses to ensure they have required fields
      const formattedCourses = coursesData.map(course => ({
        _id: course._id,
        name: course.title || course.name || 'Unnamed Course',
        code: course.code || course.category || '',
        category: course.category || ''
      }));
      
      console.log('Formatted courses:', formattedCourses);
      setCourses(formattedCourses);
      
      if (formattedCourses.length === 0) {
        console.warn('No courses found in database');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCourses([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/important-links/${editingId}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/api/important-links', formData, config);
      }
      fetchLinks();
      resetForm();
      alert(editingId ? 'Link updated successfully!' : 'Link created successfully!');
    } catch (error) {
      console.error('Error saving link:', error);
      alert(error.response?.data?.message || 'Error saving link. Please try again.');
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
    document.querySelector('.il-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/important-links/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchLinks();
        alert('Link deleted successfully!');
      } catch (error) {
        console.error('Error deleting link:', error);
        alert(error.response?.data?.message || 'Error deleting link.');
      }
    }
  };

  const filteredLinks = links.filter(link => 
    link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryClass = (category) => {
    const map = {
      'Study Material': 'study-material',
      'Reference': 'reference',
      'Tool': 'tool',
      'Other': 'other'
    };
    return map[category] || 'other';
  };

  if (loading) {
    return (
      <div className="il-container">
        <div className="il-loading">
          <div className="il-spinner"></div>
          <p>Loading important links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="il-container">
      {/* Header */}
      <div className="il-header">
        <h2>🔗 Important Links Manager</h2>
        <p>Create and manage course-specific resources for your students</p>
      </div>
      
      {/* Stats */}
      <div className="il-stats">
        <div className="il-stat-card">
          <div className="il-stat-icon links">🔗</div>
          <div className="il-stat-info">
            <h3>{links.length}</h3>
            <p>Total Links</p>
          </div>
        </div>
        <div className="il-stat-card">
          <div className="il-stat-icon courses">📚</div>
          <div className="il-stat-info">
            <h3>{courses.length}</h3>
            <p>Active Courses</p>
          </div>
        </div>
        <div className="il-stat-card">
          <div className="il-stat-icon study">📖</div>
          <div className="il-stat-info">
            <h3>{links.filter(l => l.category === 'Study Material').length}</h3>
            <p>Study Materials</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="il-form-section">
        <h3 className="il-form-title">
          {editingId ? '✏️ Edit Link' : '➕ Add New Link'}
        </h3>
        <form onSubmit={handleSubmit} className="il-form">
          <div className="il-form-row">
            <div className="il-form-group">
              <label>Link Title *</label>
              <input
                type="text"
                placeholder="e.g., Python Official Documentation"
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
          </div>
          
          <div className="il-form-group full-width">
            <label>Description</label>
            <textarea
              placeholder="Brief description of what this link contains..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="il-form-row">
            <div className="il-form-group">
              <label>Course *</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                required
                className={courses.length === 0 ? 'il-select-empty' : ''}
              >
                <option value="">
                  {courses.length === 0 ? '⚠️ No courses in database' : '📚 Select a Course'}
                </option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name} {course.code ? `(${course.code})` : ''}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <small className="il-error-text">
                  ⚠️ Please add courses in "Add New Course" section first
                </small>
              )}
              {courses.length > 0 && (
                <small className="il-success-text">
                  ✅ {courses.length} courses available
                </small>
              )}
            </div>
            
            <div className="il-form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Study Material">📖 Study Material</option>
                <option value="Reference">📚 Reference</option>
                <option value="Tool">🛠️ Tool</option>
                <option value="Other">📌 Other</option>
              </select>
            </div>
          </div>
          
          <div className="il-form-actions">
            <button 
              type="submit" 
              className="il-btn il-btn-primary"
              disabled={courses.length === 0}
            >
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

      {/* Links Table */}
      <div className="il-table-section">
        <div className="il-table-header">
          <h3 className="il-table-title">All Important Links</h3>
          <div className="il-search-box">
            <input 
              type="text" 
              placeholder="Search links..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredLinks.length === 0 ? (
          <div className="il-empty-state">
            <div className="il-empty-icon">🔗</div>
            <h3>{searchTerm ? 'No matching links found' : 'No links added yet'}</h3>
            <p>{searchTerm ? 'Try a different search term' : 'Add your first important link using the form above'}</p>
          </div>
        ) : (
          <div className="il-table-wrapper">
            <table className="il-table">
              <thead>
                <tr>
                  <th>Link Details</th>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map(link => (
                  <tr key={link._id}>
                    <td>
                      <div className="il-link-cell">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="il-link-title"
                          title={link.url}
                        >
                          {link.title}
                        </a>
                        <span className="il-link-url">{link.url}</span>
                        {link.description && (
                          <span className="il-link-desc">{link.description}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="il-course-badge">
                        {link.course?.name || link.course?.title || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`il-category-badge il-category-${getCategoryClass(link.category)}`}>
                        {link.category || 'Other'}
                      </span>
                    </td>
                    <td>
                      <span className="il-date">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="il-actions">
                        <button 
                          className="il-btn-icon il-btn-edit" 
                          onClick={() => handleEdit(link)} 
                          title="Edit Link"
                        >
                          ✏️
                        </button>
                        <button 
                          className="il-btn-icon il-btn-delete" 
                          onClick={() => handleDelete(link._id)} 
                          title="Delete Link"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportantLinks;