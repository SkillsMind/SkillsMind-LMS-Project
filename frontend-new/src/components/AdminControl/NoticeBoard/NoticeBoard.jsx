import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Megaphone, 
  Calendar, 
  AlertTriangle, 
  Newspaper, 
  Info, 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  Eye,
  Clock,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  GraduationCap,
  Users,
  Tag
} from 'lucide-react';
import './NoticeBoard.css';

// 🔥 Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`nboard-toast ${type}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General',
    course: 'all',
    targetCourses: [],
    audience: 'all',
    priority: 0,
    expiryDate: ''
  });

  const API_URL = 'http://localhost:5000/api';
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  // 🔥 Show Toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchNotices();
    fetchCourses();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/notices`, {
        headers: getAuthHeaders()
      });
      
      if (res.data.success) {
        setNotices(res.data.data || []);
      }
    } catch (error) {
      showToast('Failed to load notices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await axios.get(`${API_URL}/notices/courses`, {
        headers: getAuthHeaders()
      });
      
      if (res.data.success && Array.isArray(res.data.data)) {
        setCourses(res.data.data);
      }
    } catch (error) {
      showToast('Failed to load courses', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please fill in title and content', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim()
      };

      if (submitData.course === 'all') {
        submitData.course = null;
      }

      if (editingId) {
        await axios.put(`${API_URL}/notices/${editingId}`, submitData, {
          headers: getAuthHeaders()
        });
        showToast('Notice updated successfully!');
      } else {
        await axios.post(`${API_URL}/notices`, submitData, {
          headers: getAuthHeaders()
        });
        showToast('Notice created successfully!');
      }
      
      fetchNotices();
      resetForm();
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving notice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      await axios.delete(`${API_URL}/notices/${id}`, {
        headers: getAuthHeaders()
      });
      showToast('Notice deleted successfully!');
      fetchNotices();
    } catch (error) {
      showToast('Error deleting notice', 'error');
    }
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type || 'General',
      course: notice.course?._id || 'all',
      targetCourses: notice.targetCourses?.map(c => c._id) || [],
      audience: notice.audience || 'all',
      priority: notice.priority || 0,
      expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'General',
      course: 'all',
      targetCourses: [],
      audience: 'all',
      priority: 0,
      expiryDate: ''
    });
  };

  // 🔥 Group notices by course
  const getNoticesByCourse = () => {
    const grouped = {
      general: notices.filter(n => !n.course && (!n.targetCourses || n.targetCourses.length === 0))
    };
    
    courses.forEach(course => {
      grouped[course._id] = notices.filter(n => 
        n.course?._id === course._id || 
        n.targetCourses?.some(tc => tc._id === course._id)
      );
    });
    
    return grouped;
  };

  const getNoticeIcon = (type) => {
    switch(type) {
      case 'Urgent': return <AlertTriangle size={16} />;
      case 'Event': return <Calendar size={16} />;
      case 'News': return <Newspaper size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getNoticeColor = (type) => {
    switch(type) {
      case 'Urgent': return '#E30613';
      case 'Event': return '#3b82f6';
      case 'News': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const stats = {
    total: notices.length,
    urgent: notices.filter(n => n.type === 'Urgent').length,
    events: notices.filter(n => n.type === 'Event').length,
    news: notices.filter(n => n.type === 'News').length,
    general: notices.filter(n => n.type === 'General').length
  };

  const noticesByCourse = getNoticesByCourse();

  if (loading) {
    return (
      <div className="nboard-container">
        <div className="nboard-loading">
          <Loader2 size={40} className="nboard-spinner" />
          <p>Loading notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nboard-container">
      {/* Toast Container */}
      <div className="nboard-toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
      
      {/* Header */}
      <div className="nboard-header">
        <div className="nboard-header-content">
          <div className="nboard-header-icon">
            <Bell size={28} />
          </div>
          <div className="nboard-header-text">
            <h1>Notice Board</h1>
            <p>Manage announcements & notifications</p>
          </div>
        </div>
        <button 
          className="nboard-btn-primary"
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Close' : 'New Notice'}
        </button>
      </div>

      {/* Stats */}
      <div className="nboard-stats-bar">
        <div className="nboard-stat-item">
          <span className="nboard-stat-number">{stats.total}</span>
          <span className="nboard-stat-label">Total</span>
        </div>
        <div className="nboard-stat-item urgent">
          <span className="nboard-stat-number">{stats.urgent}</span>
          <span className="nboard-stat-label">Urgent</span>
        </div>
        <div className="nboard-stat-item event">
          <span className="nboard-stat-number">{stats.events}</span>
          <span className="nboard-stat-label">Events</span>
        </div>
        <div className="nboard-stat-item news">
          <span className="nboard-stat-number">{stats.news}</span>
          <span className="nboard-stat-label">News</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="nboard-form-card">
          <div className="nboard-form-header">
            <h3>{editingId ? '✏️ Edit Notice' : '📝 Create Notice'}</h3>
            <button className="nboard-icon-btn" onClick={() => setShowForm(false)}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="nboard-form">
            <div className="nboard-form-row">
              <div className="nboard-form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="nboard-form-group">
                <label>Type</label>
                <div className="nboard-type-selector">
                  {['General', 'Event', 'Urgent', 'News'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`nboard-type-btn ${formData.type === type ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, type})}
                      style={{ 
                        '--type-color': getNoticeColor(type),
                        background: formData.type === type ? getNoticeColor(type) : 'transparent',
                        color: formData.type === type ? 'white' : getNoticeColor(type)
                      }}
                    >
                      {getNoticeIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="nboard-form-group full-width">
              <label>Content</label>
              <textarea
                placeholder="Write your notice content..."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
                rows="4"
              />
            </div>

            <div className="nboard-form-row">
              <div className="nboard-form-group">
                <label>
                  <GraduationCap size={16} />
                  Target Course
                </label>
                <select 
                  value={formData.course} 
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  disabled={coursesLoading}
                >
                  <option value="all">All Courses (General)</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nboard-form-group">
                <label>
                  <Users size={16} />
                  Audience
                </label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({...formData, audience: e.target.value})}
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="instructors">Instructors Only</option>
                </select>
              </div>

              <div className="nboard-form-group">
                <label>
                  <Tag size={16} />
                  Priority ({formData.priority})
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  className="nboard-priority-slider"
                />
              </div>
            </div>

            <div className="nboard-form-row">
              <div className="nboard-form-group">
                <label>
                  <Clock size={16} />
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="nboard-form-actions">
              <button type="submit" className="nboard-btn-submit" disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                {editingId ? 'Update Notice' : 'Post Notice'}
              </button>
              <button type="button" className="nboard-btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course-wise Notice List */}
      <div className="nboard-course-list">
        {/* General Notices */}
        <div className="nboard-course-section">
          <button 
            className="nboard-course-header"
            onClick={() => setExpandedCourse(expandedCourse === 'general' ? null : 'general')}
          >
            <div className="nboard-course-info">
              <span className="nboard-course-icon">📢</span>
              <span className="nboard-course-name">General Notices</span>
              <span className="nboard-course-count">{noticesByCourse.general?.length || 0}</span>
            </div>
            {expandedCourse === 'general' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedCourse === 'general' && (
            <div className="nboard-notice-list">
              {noticesByCourse.general?.length === 0 ? (
                <p className="nboard-empty-text">No general notices</p>
              ) : (
                noticesByCourse.general.map(notice => (
                  <NoticeCard 
                    key={notice._id} 
                    notice={notice} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                    getNoticeColor={getNoticeColor}
                    getNoticeIcon={getNoticeIcon}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Course-specific Notices */}
        {courses.map(course => (
          <div key={course._id} className="nboard-course-section">
            <button 
              className="nboard-course-header"
              onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
            >
              <div className="nboard-course-info">
                <span className="nboard-course-icon">📚</span>
                <span className="nboard-course-name">{course.title}</span>
                <span className="nboard-course-count">{noticesByCourse[course._id]?.length || 0}</span>
              </div>
              {expandedCourse === course._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedCourse === course._id && (
              <div className="nboard-notice-list">
                {noticesByCourse[course._id]?.length === 0 ? (
                  <p className="nboard-empty-text">No notices for this course</p>
                ) : (
                  noticesByCourse[course._id].map(notice => (
                    <NoticeCard 
                      key={notice._id} 
                      notice={notice} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete}
                      getNoticeColor={getNoticeColor}
                      getNoticeIcon={getNoticeIcon}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 🔥 Notice Card Component
const NoticeCard = ({ notice, onEdit, onDelete, getNoticeColor, getNoticeIcon }) => (
  <div className="nboard-notice-item">
    <div className="nboard-notice-main">
      <div 
        className="nboard-notice-type"
        style={{ background: getNoticeColor(notice.type) }}
      >
        {getNoticeIcon(notice.type)}
      </div>
      
      <div className="nboard-notice-content">
        <h4>{notice.title}</h4>
        <p>{notice.content}</p>
        
        <div className="nboard-notice-meta">
          <span>
            <Calendar size={12} />
            {new Date(notice.createdAt).toLocaleDateString('en-GB')}
          </span>
          
          {notice.expiryDate && (
            <span className="expiry">
              <Clock size={12} />
              Expires: {new Date(notice.expiryDate).toLocaleDateString('en-GB')}
            </span>
          )}
          
          {notice.priority > 0 && (
            <span className="priority">P{notice.priority}</span>
          )}
        </div>
      </div>
    </div>
    
    <div className="nboard-notice-actions">
      <button onClick={() => onEdit(notice)} className="nboard-action-btn edit">
        <Edit2 size={16} />
      </button>
      <button onClick={() => onDelete(notice._id)} className="nboard-action-btn delete">
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

export default NoticeBoard;