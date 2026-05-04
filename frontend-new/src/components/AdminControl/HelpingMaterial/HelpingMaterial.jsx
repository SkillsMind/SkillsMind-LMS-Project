import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HelpingMaterial.css';

const HelpingMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState({ total: 0, pdf: 0, documents: 0 });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileType: 'pdf',
    course: '',
    lectureTopic: '',
    weekNumber: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    if (filterCourse || filterType) {
      fetchMaterials();
    }
  }, [filterCourse, filterType]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${import.meta.env.VITE_API_URL}/api/helping-materials`;
      const params = new URLSearchParams();
      if (filterCourse) params.append('courseId', filterCourse);
      if (filterType) params.append('fileType', filterType);
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data?.data || res.data || [];
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/helping-materials/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let coursesData = [];
      if (Array.isArray(res.data)) coursesData = res.data;
      else if (res.data?.data && Array.isArray(res.data.data)) coursesData = res.data.data;
      else if (res.data?.courses && Array.isArray(res.data.courses)) coursesData = res.data.courses;
      
      setCourses(coursesData.map(c => ({ _id: c._id, name: c.title || c.name || c.code })));
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/helping-materials/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/helping-materials/${editingId}`, formData, config);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/helping-materials`, formData, config);
      }
      fetchMaterials();
      fetchStats();
      resetForm();
      setShowForm(false);
      alert(editingId ? 'Material updated!' : 'Material created!');
    } catch (error) {
      console.error('Error saving material:', error);
      alert(error.response?.data?.message || 'Error saving material');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', fileUrl: '', fileName: '', fileType: 'pdf', 
      course: '', lectureTopic: '', weekNumber: ''
    });
    setEditingId(null);
  };

  const handleEdit = (m) => {
    setFormData({
      title: m.title || '',
      description: m.description || '',
      fileUrl: m.fileUrl || '',
      fileName: m.fileName || '',
      fileType: m.fileType || 'pdf',
      course: m.course?._id || m.course || '',
      lectureTopic: m.lectureTopic || '',
      weekNumber: m.weekNumber || ''
    });
    setEditingId(m._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/helping-materials/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchMaterials();
        fetchStats();
        alert('Material deleted');
      } catch (error) {
        alert('Error deleting material');
      }
    }
  };

  const getFileIcon = (type) => {
    const icons = { pdf: '📄', doc: '📘', docx: '📘', ppt: '📊', pptx: '📊', image: '🖼️', video: '🎥', other: '📁' };
    return icons[type] || icons.other;
  };

  const getFileBadgeClass = (type) => {
    const classes = { pdf: 'badge-pdf', doc: 'badge-word', docx: 'badge-word', ppt: 'badge-ppt', pptx: 'badge-ppt' };
    return classes[type] || 'badge-other';
  };

  return (
    <div className="hm-container">
      <div className="hm-header">
        <div className="hm-header-content">
          <h2>📚 Helping Material Manager</h2>
          <p>Share Google Drive links with students - they can download directly</p>
        </div>
        <button className="hm-btn-primary hm-btn-large" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '− Close Form' : '+ Add New Material'}
        </button>
      </div>

      <div className="hm-stats">
        <div className="hm-stat-card">
          <div className="hm-stat-icon">📚</div>
          <div className="hm-stat-info"><h3>{stats.total}</h3><p>Total Materials</p></div>
        </div>
        <div className="hm-stat-card">
          <div className="hm-stat-icon">📄</div>
          <div className="hm-stat-info"><h3>{stats.pdf}</h3><p>PDF Files</p></div>
        </div>
        <div className="hm-stat-card">
          <div className="hm-stat-icon">📘</div>
          <div className="hm-stat-info"><h3>{stats.documents}</h3><p>Documents</p></div>
        </div>
        <div className="hm-stat-card">
          <div className="hm-stat-icon">🎓</div>
          <div className="hm-stat-info"><h3>{courses.length}</h3><p>Active Courses</p></div>
        </div>
      </div>

      {showForm && (
        <div className="hm-form-section">
          <h3 className="hm-form-title">{editingId ? '✏️ Edit Material' : '➕ Share New Material'}</h3>
          <form onSubmit={handleSubmit} className="hm-form">
            <div className="hm-form-row">
              <div className="hm-form-group">
                <label>Material Title *</label>
                <input type="text" placeholder="e.g., Week 1 Lecture Notes" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="hm-form-group">
                <label>Lecture Topic</label>
                <input type="text" placeholder="e.g., Introduction to Python" value={formData.lectureTopic} onChange={(e) => setFormData({...formData, lectureTopic: e.target.value})} />
              </div>
            </div>

            <div className="hm-form-group full-width">
              <label>Description</label>
              <textarea placeholder="Brief description of this material..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" />
            </div>

            {/* 🔥 GOOGLE DRIVE LINK FIELD - Button Style */}
            <div className="hm-form-group full-width">
              <label>🔗 Google Drive File Link *</label>
              <div className="hm-drive-link-field">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/XXXXXX/view?usp=sharing"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                  required
                  className="hm-drive-input"
                />
                <button 
                  type="button" 
                  className="hm-drive-btn"
                  onClick={() => {
                    if (formData.fileUrl) {
                      window.open(formData.fileUrl, '_blank');
                    }
                  }}
                >
                  📂 Open Drive
                </button>
              </div>
              <small>1. Upload file to Google Drive → 2. Get shareable link → 3. Paste here</small>
            </div>

            <div className="hm-form-row">
              <div className="hm-form-group">
                <label>Course *</label>
                <select value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} required>
                  <option value="">Select Course</option>
                  {courses.map(course => (<option key={course._id} value={course._id}>{course.name}</option>))}
                </select>
              </div>
              
              <div className="hm-form-group">
                <label>File Type</label>
                <select value={formData.fileType} onChange={(e) => setFormData({...formData, fileType: e.target.value})}>
                  <option value="pdf">📄 PDF Document</option>
                  <option value="doc">📘 Word Document</option>
                  <option value="ppt">📊 PowerPoint</option>
                  <option value="image">🖼️ Image</option>
                  <option value="video">🎥 Video</option>
                  <option value="other">📁 Other</option>
                </select>
              </div>

              <div className="hm-form-group">
                <label>Week Number</label>
                <input type="number" placeholder="Week (1-52)" min="1" max="52" value={formData.weekNumber} onChange={(e) => setFormData({...formData, weekNumber: e.target.value})} />
              </div>
            </div>

            <div className="hm-form-actions">
              <button type="submit" className="hm-btn-primary">{editingId ? '💾 Update' : '📤 Share Material'}</button>
              <button type="button" className="hm-btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="hm-filters">
        <div className="hm-filter-group">
          <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && fetchMaterials()} className="hm-search-input" />
          <button onClick={fetchMaterials} className="hm-search-btn">Search</button>
        </div>
        <div className="hm-filter-group">
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="doc">Word</option>
            <option value="ppt">PowerPoint</option>
          </select>
          {(filterCourse || filterType || searchTerm) && (<button onClick={() => { setFilterCourse(''); setFilterType(''); setSearchTerm(''); fetchMaterials(); }} className="hm-clear-btn">Clear</button>)}
        </div>
      </div>

      <div className="hm-table-section">
        <div className="hm-table-header"><h3>📖 All Materials</h3><span className="hm-table-count">{materials.length} found</span></div>
        {loading ? (
          <div className="hm-loading"><div className="hm-spinner"></div><p>Loading...</p></div>
        ) : materials.length === 0 ? (
          <div className="hm-empty-state"><div className="hm-empty-icon">📭</div><h3>No materials</h3><p>Share your first material using the form above</p></div>
        ) : (
          <div className="hm-table-wrapper">
            <table className="hm-table">
              <thead><tr><th>Material</th><th>Course</th><th>Lecture</th><th>Type</th><th>Stats</th><th>Added</th><th>Actions</th></tr></thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m._id}>
                    <td><div className="hm-material-info"><span className="hm-material-icon">{getFileIcon(m.fileType)}</span><div><div className="hm-material-title">{m.title}</div>{m.fileName && <div className="hm-material-filename">{m.fileName}</div>}</div></div></td>
                    <td><span className="hm-course-badge">{m.course?.name}</span></td>
                    <td>{m.lectureTopic || '—'}</td>
                    <td><span className={`hm-type-badge ${getFileBadgeClass(m.fileType)}`}>{m.fileType?.toUpperCase()}</span></td>
                    <td className="hm-stats-cell"><span>📥 {m.downloadCount || 0}</span><span>👁️ {m.viewCount || 0}</span></td>
                    <td className="hm-date">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td><div className="hm-actions"><a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="hm-action-view" title="Open Drive">🔗</a><button onClick={() => handleEdit(m)} className="hm-action-edit" title="Edit">✏️</button><button onClick={() => handleDelete(m._id)} className="hm-action-delete" title="Delete">🗑️</button></div></td>
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

export default HelpingMaterial;