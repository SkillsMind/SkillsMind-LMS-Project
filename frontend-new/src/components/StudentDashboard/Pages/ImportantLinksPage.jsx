import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Link2, BookOpen, FileText, Wrench } from 'lucide-react';
import axios from 'axios';
import './ImportantLinksPage.css';

const ImportantLinksPage = ({ onBack }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/important-links/student/my-links', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setLinks(res.data.data || []);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
      setError('Failed to load important links');
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

  const filteredLinks = filter === 'all' 
    ? links 
    : links.filter(l => l.category === filter);

  const categories = ['all', ...new Set(links.map(l => l.category))];

  if (loading) {
    return (
      <div className="ilp-container">
        <div className="ilp-loading">Loading important links...</div>
      </div>
    );
  }

  return (
    <div className="ilp-container">
      <div className="ilp-header">
        <button className="ilp-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Important Links</h1>
        <p>Course-specific resources and references</p>
      </div>

      {error && <div className="ilp-error">{error}</div>}

      {/* Filter Tabs */}
      <div className="ilp-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ilp-filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All Links' : cat}
          </button>
        ))}
      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <div className="ilp-empty">
          <Link2 size={48} className="ilp-empty-icon" />
          <h3>No important links available</h3>
          <p>Your instructor will add links for your enrolled courses soon.</p>
        </div>
      ) : (
        <div className="ilp-grid">
          {filteredLinks.map(link => (
            <a 
              key={link._id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ilp-card"
            >
              <div className="ilp-card-header">
                <div className={`ilp-icon ilp-icon-${link.category?.toLowerCase().replace(' ', '-') || 'other'}`}>
                  {getCategoryIcon(link.category)}
                </div>
                <span className="ilp-category">{link.category || 'Other'}</span>
              </div>
              
              <h3 className="ilp-title">{link.title}</h3>
              <p className="ilp-description">{link.description || 'No description available'}</p>
              
              <div className="ilp-footer">
                <span className="ilp-course">{link.course?.name || 'General'}</span>
                <span className="ilp-visit">
                  Visit <ExternalLink size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantLinksPage;