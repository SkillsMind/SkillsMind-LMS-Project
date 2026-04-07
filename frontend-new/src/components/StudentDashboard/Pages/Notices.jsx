import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  AlertCircle, 
  Newspaper, 
  Info, 
  ChevronLeft,
  Clock,
  Eye,
  ChevronRight,
  FileText,
  Instagram,
  Mail,
  Phone,
  CheckCircle2,
  Circle
} from 'lucide-react';
import axios from 'axios';
import './Notices.css';

// ============================================
// FULL PAGE VERSION
// ============================================
const NoticesPage = ({ onBack }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notices/student/my-notices`, {        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const data = res.data.data || [];
        setNotices(data);
        if (data.length > 0 && !selectedNotice) {
          setSelectedNotice(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (noticeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notices/${noticeId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotices(prev => prev.map(n => 
        n._id === noticeId ? { ...n, isRead: true } : n
      ));
      
      if (selectedNotice?._id === noticeId) {
        setSelectedNotice(prev => ({ ...prev, isRead: true }));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    if (!notice.isRead) {
      markAsRead(notice._id);
    }
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  // ==== BACK BUTTON HANDLER - FIXED ====
  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Back button clicked');
    
    // Method 1: If onBack prop is provided
    if (onBack && typeof onBack === 'function') {
      console.log('Using onBack prop');
      onBack();
      return;
    }
    
    // Method 2: Try to use React Router navigate from window
    if (window.navigate && typeof window.navigate === 'function') {
      console.log('Using window.navigate');
      window.navigate('/student-dashboard');
      return;
    }
    
    // Method 3: Use history API
    if (window.history.length > 1) {
      console.log('Using history.back()');
      window.history.back();
    } else {
      // Method 4: Direct location change
      console.log('Using window.location');
      window.location.href = '/student-dashboard';
    }
  };

  // ==== CONTACT HANDLERS ====
  
  const handleWhatsAppClick = () => {
    const phone = '923116735509';
    const message = `Assalam-o-Alaikum,\n\nI have a query regarding this notice:\n"${selectedNotice?.title || 'General Query'}"\n\nPlease assist me.\n\nSent from SkillsMind Student Portal`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleInstagramClick = () => {
    const username = 'skillsmind786';
    window.open(`https://ig.me/m/${username}`, '_blank');
  };

  const handleEmailClick = () => {
    const email = 'skillsmind786@gmail.com';
    const subject = `Query about Notice: ${selectedNotice?.title || 'General Query'}`;
    const body = `Assalam-o-Alaikum,\n\nI have a query regarding this notice:\n"${selectedNotice?.title || 'General Query'}"\n\nMy Question:\n[Write your question here]\n\nSent from SkillsMind Student Portal`;
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    window.location.href = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  const getIcon = (type, size = 20) => {
    switch(type) {
      case 'Urgent': return <AlertCircle size={size} />;
      case 'Event': return <Calendar size={size} />;
      case 'News': return <Newspaper size={size} />;
      default: return <FileText size={size} />;
    }
  };

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.type === filter);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="notices-page">
        <div className="notices-loading">
          <div className="notices-spinner"></div>
          <p>Loading notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notices-page">
      {/* ==== BANNER ==== */}
      <div className="notices-banner-simple">
        <button 
          type="button"
          className="banner-back-btn" 
          onClick={handleBackClick}
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        
        <div className="banner-center">
          <Bell size={24} />
          <h1>NOTICE BOARD</h1>
        </div>
        
        <div className="banner-spacer"></div>
      </div>

      {/* Mobile Filter Tabs */}
      <div className="mobile-filter-tabs">
        {['all', 'Urgent', 'Event', 'News', 'General'].map((type) => (
          <button
            key={type}
            className={`mobile-tab ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All' : type}
            <span className="tab-count">
              {type === 'all' ? notices.length : notices.filter(n => n.type === type).length}
            </span>
          </button>
        ))}
      </div>

      <div className="notices-main-container">
        {/* Left Sidebar */}
        <div className={`notices-sidebar ${mobileView === 'detail' ? 'mobile-hidden' : ''}`}>
          {/* Desktop Filters */}
          <div className="notices-filters desktop-only">
            <div className="filter-pills">
              {[
                { key: 'all', label: 'All' },
                { key: 'Urgent', label: 'Urgent' },
                { key: 'Event', label: 'Events' },
                { key: 'News', label: 'News' },
                { key: 'General', label: 'General' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-pill ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  <span className="pill-count">
                    {key === 'all' ? notices.length : notices.filter(n => n.type === key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notice List */}
          <div className="notices-list-container">
            {filteredNotices.length === 0 ? (
              <div className="notices-empty-small">
                <FileText size={32} color="#cbd5e1" />
                <p>No notices found</p>
              </div>
            ) : (
              filteredNotices.map(notice => (
                <div 
                  key={notice._id} 
                  className={`notice-item ${selectedNotice?._id === notice._id ? 'active' : ''} ${!notice.isRead ? 'unread' : ''}`}
                  onClick={() => handleNoticeClick(notice)}
                >
                  <div className={`notice-item-icon ${notice.type?.toLowerCase()}`}>
                    {getIcon(notice.type, 18)}
                  </div>
                  <div className="notice-item-content">
                    <div className="notice-item-header">
                      <h4>{notice.title}</h4>
                      <div className="notice-status">
                        {notice.isRead ? (
                          <span className="status-read">
                            <CheckCircle2 size={14} />
                            Read
                          </span>
                        ) : (
                          <span className="status-unread">
                            <Circle size={14} />
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="notice-item-preview">{notice.content?.substring(0, 70)}...</p>
                    <div className="notice-item-meta">
                      <span className={`notice-type ${notice.type?.toLowerCase()}`}>
                        {notice.type || 'General'}
                      </span>
                      <span className="notice-date">{formatDate(notice.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="notice-arrow" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className={`notices-content ${mobileView === 'list' ? 'mobile-hidden' : ''}`}>
          {selectedNotice ? (
            <div className="notice-detail">
              <button className="mobile-back-btn" onClick={handleBackToList}>
                <ChevronLeft size={18} />
                Back to Notices
              </button>

              <div className="notice-detail-card">
                <div className="notice-detail-header">
                  <div className="notice-detail-title-row">
                    <div className={`notice-detail-icon ${selectedNotice.type?.toLowerCase()}`}>
                      {getIcon(selectedNotice.type, 22)}
                    </div>
                    <div className="notice-detail-title-info">
                      <div className="notice-detail-badges">
                        <span className={`badge type ${selectedNotice.type?.toLowerCase()}`}>
                          {selectedNotice.type || 'General'}
                        </span>
                        {selectedNotice.priority > 5 && <span className="badge priority">High Priority</span>}
                      </div>
                      <h2>{selectedNotice.title}</h2>
                    </div>
                  </div>
                  
                  <div className="notice-read-status">
                    {selectedNotice.isRead ? (
                      <span className="read-badge">
                        <CheckCircle2 size={16} />
                        You have read this notice
                      </span>
                    ) : (
                      <span className="unread-badge" onClick={() => markAsRead(selectedNotice._id)}>
                        <Circle size={16} />
                        Click to mark as read
                      </span>
                    )}
                  </div>

                  <div className="notice-detail-meta">
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{formatDate(selectedNotice.createdAt)} at {formatTime(selectedNotice.createdAt)}</span>
                    </div>
                    {selectedNotice.course && (
                      <div className="meta-item">
                        <Eye size={14} />
                        <span>{selectedNotice.course.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="notice-detail-body">
                  <div className="notice-detail-content">
                    {selectedNotice.content}
                  </div>

                  {selectedNotice.expiryDate && (
                    <div className="notice-expiry">
                      <AlertCircle size={16} />
                      <span>This notice expires on {formatDate(selectedNotice.expiryDate)}</span>
                    </div>
                  )}

                  {/* ==== SIMPLE CONTACT ICONS ==== */}
                  <div className="notice-query-section">
                    <div className="query-header">
                      <h3>📞 Contact Support</h3>
                      <p>Have a question about this notice? Reach out to us!</p>
                    </div>
                    
                    <div className="contact-icons-row">
                      {/* WhatsApp */}
                      <div className="contact-icon-item whatsapp" onClick={handleWhatsAppClick}>
                        <div className="contact-icon-circle">
                          <Phone size={24} />
                        </div>
                        <span>WhatsApp</span>
                      </div>

                      {/* Instagram */}
                      <div className="contact-icon-item instagram" onClick={handleInstagramClick}>
                        <div className="contact-icon-circle">
                          <Instagram size={24} />
                        </div>
                        <span>Instagram</span>
                      </div>

                      {/* Email */}
                      <div className="contact-icon-item email" onClick={handleEmailClick}>
                        <div className="contact-icon-circle">
                          <Mail size={24} />
                        </div>
                        <span>Email</span>
                      </div>
                    </div>

                    <div className="query-info">
                      <p>💡 Click any icon above to directly message us regarding this notice</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="notice-empty-state">
              <FileText size={48} color="#e2e8f0" />
              <h3>Select a notice</h3>
              <p>Choose a notice from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticesPage;