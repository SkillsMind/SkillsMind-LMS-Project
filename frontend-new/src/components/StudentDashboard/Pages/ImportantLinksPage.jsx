import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Link2, 
  BookOpen, 
  FileText, 
  Wrench, 
  AlertCircle,
  Filter,
  ChevronRight,
  Globe,
  Layers
} from 'lucide-react';
import axios from 'axios';
import './ImportantLinksPage.css';

const ImportantLinksPage = ({ onBack }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view important links');
        setLoading(false);
        return;
      }

      const res = await axios.get('${import.meta.env.VITE_API_URL}/api/important-links/student/my-links', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setLinks(res.data.data || []);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load important links. Please try again later.');
      }
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Study Material': return <BookOpen size={20} />;
      case 'Reference': return <FileText size={20} />;
      case 'Tool': return <Wrench size={20} />;
      default: return <Link2 size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Study Material': return '#000B29';
      case 'Reference': return '#E30613';
      case 'Tool': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesFilter = filter === 'all' || link.category === filter;
    const matchesSearch = !searchQuery || 
      link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.course?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['all', ...new Set(links.map(l => l.category).filter(Boolean))];
  
  const categoryStats = categories.reduce((acc, cat) => {
    if (cat === 'all') return acc;
    acc[cat] = links.filter(l => l.category === cat).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="ilp-container">
        <div className="ilp-loading-state">
          <div className="ilp-spinner-wrapper">
            <div className="ilp-spinner"></div>
          </div>
          <h3>Loading Resources</h3>
          <p>Fetching your important links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ilp-container">
      {/* Top Navigation Bar */}
      <nav className="ilp-top-nav">
        <button className="ilp-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <div className="ilp-nav-actions">
          <div className="ilp-search-box">
            <Globe size={16} className="ilp-search-icon" />
            <input 
              type="text" 
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ilp-search-input"
            />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="ilp-hero">
        <div className="ilp-hero-content">
          <div className="ilp-hero-badge">
            <Layers size={14} />
            <span>Learning Resources</span>
          </div>
          <h1>Important Links</h1>
          <p>Access course-specific resources, study materials, and tools curated by your instructors</p>
        </div>
        
        {!error && links.length > 0 && (
          <div className="ilp-hero-stats">
            <div className="ilp-stat-card">
              <span className="ilp-stat-value">{links.length}</span>
              <span className="ilp-stat-label">Total Links</span>
            </div>
            <div className="ilp-stat-divider"></div>
            <div className="ilp-stat-card">
              <span className="ilp-stat-value">{new Set(links.map(l => l.course?._id)).size}</span>
              <span className="ilp-stat-label">Courses</span>
            </div>
            <div className="ilp-stat-divider"></div>
            <div className="ilp-stat-card">
              <span className="ilp-stat-value">{categories.length - 1}</span>
              <span className="ilp-stat-label">Categories</span>
            </div>
          </div>
        )}
      </header>

      {/* Error Message */}
      {error && (
        <div className="ilp-alert ilp-alert-error">
          <AlertCircle size={20} />
          <div className="ilp-alert-content">
            <strong>Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filter Section */}
      {!error && categories.length > 1 && (
        <div className="ilp-filter-section">
          <div className="ilp-filter-header">
            <Filter size={16} />
            <span>Filter by Category</span>
          </div>
          <div className="ilp-filter-pills">
            {categories.map(cat => (
              <button
                key={cat}
                className={`ilp-pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat === 'all' ? (
                  <>All Resources</>
                ) : (
                  <>
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                    <span className="ilp-pill-count">{categoryStats[cat]}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <main className="ilp-content">
        {filteredLinks.length === 0 ? (
          <div className="ilp-empty-state">
            <div className="ilp-empty-icon">
              <Link2 size={48} strokeWidth={1.5} />
            </div>
            <h3>
              {searchQuery 
                ? 'No matching links found' 
                : filter !== 'all' 
                  ? 'No links in this category' 
                  : 'No important links available'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : filter !== 'all' 
                  ? 'Try selecting a different category or check back later' 
                  : 'Your instructor will add links for your enrolled courses soon.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button 
                className="ilp-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="ilp-links-grid">
            {filteredLinks.map((link, index) => (
              <a 
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ilp-link-card"
                style={{ '--category-color': getCategoryColor(link.category) }}
              >
                <div className="ilp-card-accent"></div>
                
                <div className="ilp-card-main">
                  <div className="ilp-card-icon-wrapper">
                    <div 
                      className="ilp-card-icon"
                      style={{ backgroundColor: `${getCategoryColor(link.category)}15`, color: getCategoryColor(link.category) }}
                    >
                      {getCategoryIcon(link.category)}
                    </div>
                    <div className="ilp-card-category">{link.category || 'Resource'}</div>
                  </div>
                  
                  <div className="ilp-card-info">
                    <h3 className="ilp-card-title">{link.title}</h3>
                    <p className="ilp-card-description">
                      {link.description || 'Click to access this resource'}
                    </p>
                  </div>
                </div>

                <div className="ilp-card-meta">
                  <div className="ilp-course-tag">
                    <BookOpen size={12} />
                    <span>{link.course?.name || 'General Resource'}</span>
                  </div>
                  <div className="ilp-visit-btn">
                    <span>Open</span>
                    <ExternalLink size={14} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="ilp-footer">
        <p>Resources are regularly updated by your course instructors</p>
      </footer>
    </div>
  );
};

export default ImportantLinksPage;