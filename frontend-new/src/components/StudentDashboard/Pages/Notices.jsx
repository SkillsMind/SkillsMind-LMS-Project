import React, { useState, useEffect } from 'react';
import { Bell, Calendar, AlertCircle, Newspaper, Info, X } from 'lucide-react';
import axios from 'axios';
import './Notices.css';

// Widget version for Dashboard
export const NoticesWidget = ({ onViewAll }) => {
  const [notices, setNotices] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notices/student/my-notices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setNotices(res.data.data.slice(0, 3) || []);
        setNewCount(res.data.newCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Urgent': return <AlertCircle size={16} color="#E30613" />;
      case 'Event': return <Calendar size={16} color="#3b82f6" />;
      case 'News': return <Newspaper size={16} color="#8b5cf6" />;
      default: return <Info size={16} color="#64748b" />;
    }
  };

  if (loading) return <div className="nw-loading">Loading...</div>;

  return (
    <div className="nw-widget">
      <div className="nw-widget-header">
        <h3>Notice Board</h3>
        {newCount > 0 && <span className="nw-badge">{newCount} New</span>}
      </div>
      
      <div className="nw-list">
        {notices.length === 0 ? (
          <p className="nw-empty">No notices available</p>
        ) : (
          notices.map(notice => (
            <div key={notice._id} className={`nw-item nw-${notice.type?.toLowerCase() || 'general'}`}>
              <div className="nw-icon">{getIcon(notice.type)}</div>
              <div className="nw-content">
                <h4>{notice.title}</h4>
                <p>{notice.content?.substring(0, 60)}...</p>
                <span className="nw-date">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button className="nw-view-all" onClick={onViewAll}>
        View All Notices
      </button>
    </div>
  );
};

// Full Page version
const NoticesPage = ({ onBack }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notices/student/my-notices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setNotices(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Urgent': return <AlertCircle size={24} />;
      case 'Event': return <Calendar size={24} />;
      case 'News': return <Newspaper size={24} />;
      default: return <Info size={24} />;
    }
  };

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.type === filter);

  const isNew = (date) => {
    const noticeDate = new Date(date);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return noticeDate > yesterday;
  };

  if (loading) {
    return (
      <div className="np-container">
        <div className="np-loading">Loading notices...</div>
      </div>
    );
  }

  return (
    <div className="np-container">
      <div className="np-header">
        <button className="np-back-btn" onClick={onBack}>
          <span>←</span> Back to Dashboard
        </button>
        <h1>Notice Board</h1>
        <p>Stay updated with latest announcements</p>
      </div>

      {/* Filters */}
      <div className="np-filters">
        {['all', 'General', 'Event', 'Urgent', 'News'].map(type => (
          <button
            key={type}
            className={`np-filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="np-empty">
          <Bell size={48} />
          <h3>No notices found</h3>
          <p>Check back later for updates</p>
        </div>
      ) : (
        <div className="np-list">
          {filteredNotices.map(notice => (
            <div key={notice._id} className={`np-card np-${notice.type?.toLowerCase() || 'general'}`}>
              <div className="np-card-header">
                <div className="np-type-icon">
                  {getIcon(notice.type)}
                </div>
                <div className="np-meta">
                  <span className={`np-type np-type-${notice.type?.toLowerCase() || 'general'}`}>
                    {notice.type || 'General'}
                  </span>
                  {isNew(notice.createdAt) && <span className="np-new">NEW</span>}
                </div>
                <span className="np-date">
                  {new Date(notice.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <h3 className="np-title">{notice.title}</h3>
              <p className="np-content">{notice.content}</p>
              
              {notice.targetAudience?.length > 0 && (
                <div className="np-audience">
                  <span>📚 For specific courses</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticesPage;