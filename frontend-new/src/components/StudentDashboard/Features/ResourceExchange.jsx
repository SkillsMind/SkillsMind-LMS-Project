import React, { useState } from 'react';
import { Upload, Download, FileText, Star, Search, Filter, Heart } from 'lucide-react';
import './ResourceExchange.css';

const ResourceExchange = () => {
  const [resources] = useState([
    { 
      id: 1, 
      title: 'React Hooks Cheat Sheet', 
      type: 'PDF', 
      downloads: 234, 
      rating: 4.8, 
      uploader: 'Ali K.',
      category: 'Development',
      liked: false
    },
    { 
      id: 2, 
      title: 'CSS Grid Complete Guide', 
      type: 'Notion', 
      downloads: 189, 
      rating: 4.9, 
      uploader: 'Sara M.',
      category: 'Design',
      liked: true
    },
    { 
      id: 3, 
      title: 'Freelancing Proposal Templates', 
      type: 'DOC', 
      downloads: 456, 
      rating: 4.7, 
      uploader: 'Hassan R.',
      category: 'Business',
      liked: false
    }
  ]);

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>📚 Resource Exchange</h2>
        <p>Community-driven learning materials</p>
        <button className="upload-resource-btn">
          <Upload className="w-5 h-5" />
          Share Resource
        </button>
      </div>

      <div className="exchange-controls">
        <div className="search-resource">
          <Search className="w-5 h-5" />
          <input type="text" placeholder="Search resources..." />
        </div>
        <button className="filter-btn">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="resources-grid">
        {resources.map((res) => (
          <div key={res.id} className="resource-card">
            <div className="resource-header">
              <div className={`file-icon ${res.type.toLowerCase()}`}>
                <FileText className="w-6 h-6" />
              </div>
              <button className={`like-btn ${res.liked ? 'liked' : ''}`}>
                <Heart className={`w-5 h-5 ${res.liked ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="resource-body">
              <span className="category-tag">{res.category}</span>
              <h3>{res.title}</h3>
              <div className="resource-meta">
                <span className="file-type">{res.type}</span>
                <span className="uploader">By {res.uploader}</span>
              </div>
            </div>

            <div className="resource-footer">
              <div className="resource-stats">
                <span className="rating">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {res.rating}
                </span>
                <span className="downloads">
                  <Download className="w-4 h-4" />
                  {res.downloads}
                </span>
              </div>
              <button className="download-btn">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceExchange;