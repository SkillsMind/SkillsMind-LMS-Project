import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Eye, FileText, BookOpen, Search, 
  ChevronRight, X, ExternalLink, Layers, Database,
  Clock, Award, TrendingUp, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './HelpingMaterialsPage.css';

const HelpingMaterialsPage = ({ onBack, onNavigate, studentName }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [courses, setCourses] = useState([]);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view helping materials');
      setLoading(false);
      return;
    }
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/helping-materials/student/my-materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const data = res.data.data || [];
        setMaterials(data);
        
        const uniqueCourses = {};
        data.forEach(m => {
          if (m.course && m.course._id) {
            uniqueCourses[m.course._id] = m.course.name;
          }
        });
        setCourses(Object.entries(uniqueCourses).map(([id, name]) => ({ id, name })));
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load helping materials');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Handle Back to Dashboard
  const handleBackToDashboard = () => {
    Swal.fire({
      title: 'Going Back?',
      text: 'Return to your student dashboard',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000B29',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, go back',
      cancelButtonText: 'Stay Here',
      background: '#ffffff',
      timer: 3000,
      timerProgressBar: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Method 1: Use onBack prop if provided
        if (onBack && typeof onBack === 'function') {
          onBack();
        } 
        // Method 2: Use onNavigate prop if provided
        else if (onNavigate && typeof onNavigate === 'function') {
          onNavigate('dashboard');
        }
        // Method 3: Fallback - navigate to dashboard
        else {
          window.location.href = '/student-dashboard';
        }
      }
    });
  };

  const handleDownload = (material) => {
    setDownloading(material._id);
    
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = `${import.meta.env.VITE_API_URL}/api/helping-materials/download/${material._id}?token=${token}`;
      window.open(downloadUrl, '_blank');
      
      // Show success toast
      Swal.fire({
        title: 'Opening File',
        text: 'Redirecting to Google Drive...',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff'
      });
    } catch (err) {
      console.error('Download error:', err);
      Swal.fire({
        title: 'Download Failed',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#E30613'
      });
    } finally {
      setTimeout(() => setDownloading(null), 2000);
    }
  };

  const handlePreview = (material) => {
    setPreviewMaterial(material);
    setPreviewOpen(true);
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(`${import.meta.env.VITE_API_URL}/api/helping-materials/${material._id}/track-view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.log('Track error:', err.message));
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewMaterial(null);
  };

  const getFileIcon = (type) => {
    const icons = { pdf: '📄', doc: '📘', docx: '📘', ppt: '📊', pptx: '📊', image: '🖼️', video: '🎥', other: '📁' };
    return icons[type] || icons.other;
  };

  const getFileColor = (type) => {
    const colors = { pdf: '#dc2626', doc: '#2563eb', docx: '#2563eb', ppt: '#ea580c', pptx: '#ea580c', image: '#10b981', video: '#8b5cf6' };
    return colors[type] || '#64748b';
  };

  const filteredMaterials = materials.filter(m => {
    const matchSearch = !searchQuery || 
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = selectedCourse === 'all' || m.course?._id === selectedCourse;
    const matchType = selectedType === 'all' || m.fileType === selectedType;
    return matchSearch && matchCourse && matchType;
  });

  if (loading) {
    return (
      <div className="hmp-container">
        <div className="hmp-loading">
          <div className="hmp-spinner"></div>
          <h3>Loading Materials</h3>
          <p>Fetching your learning resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hmp-container">
      
      {/* Preview Modal */}
      {previewOpen && previewMaterial && (
        <div className="hmp-preview-modal" onClick={closePreview}>
          <div className="hmp-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="hmp-preview-header">
              <h3>
                <span className="preview-icon">{getFileIcon(previewMaterial.fileType)}</span>
                {previewMaterial.title}
              </h3>
              <button onClick={closePreview} className="hmp-preview-close">
                <X size={22} />
              </button>
            </div>
            <div className="hmp-preview-body">
              <iframe 
                src={previewMaterial.fileUrl}
                className="hmp-preview-iframe"
                title={previewMaterial.title}
              />
            </div>
            <div className="hmp-preview-footer">
              <div className="preview-info">
                {previewMaterial.description && (
                  <p className="preview-description">{previewMaterial.description}</p>
                )}
                <div className="preview-meta">
                  <span>📁 {previewMaterial.fileType?.toUpperCase()}</span>
                  <span>📦 {previewMaterial.fileSize || 'Unknown'}</span>
                  <span>👁️ {previewMaterial.viewCount || 0} views</span>
                  <span>📥 {previewMaterial.downloadCount || 0} downloads</span>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(previewMaterial)} 
                className="hmp-btn-drive"
                disabled={downloading === previewMaterial._id}
              >
                {downloading === previewMaterial._id ? 'Opening...' : <><ExternalLink size={16} /> Open in Drive</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="hmp-nav">
        <button className="hmp-back-btn" onClick={handleBackToDashboard}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <div className="hmp-nav-right">
          <div className="hmp-nav-badge">
            <Layers size={14} />
            <span>Learning Resources</span>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="hmp-hero-banner">
        <div className="hmp-banner-content">
          <div className="hmp-banner-icon">
            <BookOpen size={32} />
          </div>
          <div className="hmp-banner-text">
            <h1>Helping Materials</h1>
            <p>Access lecture notes, PDFs, and study resources shared by your instructors</p>
          </div>
        </div>
        <div className="hmp-banner-stats">
          <div className="banner-stat">
            <Database size={18} />
            <span>{materials.length} Materials</span>
          </div>
          <div className="banner-stat">
            <BookOpen size={18} />
            <span>{courses.length} Courses</span>
          </div>
          <div className="banner-stat">
            <FileText size={18} />
            <span>{materials.filter(m => m.fileType === 'pdf').length} PDFs</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="hmp-error">
          <span>⚠️</span>
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="hmp-search-bar">
        <div className="hmp-search-wrapper">
          <Search size={18} className="hmp-search-icon" />
          <input 
            type="text" 
            placeholder="Search by title, topic, or description..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="hmp-search-input"
          />
        </div>
        <button 
          className={`hmp-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <ChevronDown size={18} className={`filter-arrow ${showFilters ? 'rotate' : ''}`} />
          <span>Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="hmp-filter-panel">
          <div className="hmp-filter-group">
            <label>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="all">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="hmp-filter-group">
            <label>File Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="pdf">📄 PDF Document</option>
              <option value="doc">📘 Word Document</option>
              <option value="ppt">📊 PowerPoint</option>
              <option value="image">🖼️ Image</option>
              <option value="video">🎥 Video</option>
            </select>
          </div>
          {(selectedCourse !== 'all' || selectedType !== 'all' || searchQuery) && (
            <button 
              className="hmp-clear-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('all');
                setSelectedType('all');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Materials Grid */}
      <main className="hmp-content">
        {filteredMaterials.length === 0 ? (
          <div className="hmp-empty">
            <div className="hmp-empty-icon">📭</div>
            <h3>No materials found</h3>
            <p>
              {searchQuery || selectedCourse !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your instructor will add materials for your enrolled courses soon.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hmp-results-info">
              <span>Found {filteredMaterials.length} materials</span>
            </div>
            <div className="hmp-grid">
              {filteredMaterials.map((material) => (
                <div key={material._id} className="hmp-card">
                  <div className="hmp-card-accent" style={{ backgroundColor: getFileColor(material.fileType) }}></div>
                  <div className="hmp-card-header">
                    <div 
                      className="hmp-card-icon" 
                      style={{ backgroundColor: `${getFileColor(material.fileType)}15`, color: getFileColor(material.fileType) }}
                    >
                      {getFileIcon(material.fileType)}
                    </div>
                    <div className="hmp-card-type">{material.fileType?.toUpperCase()}</div>
                  </div>
                  
                  <div className="hmp-card-body">
                    <h3 className="hmp-card-title">{material.title}</h3>
                    {material.lectureTopic && (
                      <div className="hmp-card-topic">
                        <ChevronRight size={12} />
                        <span>{material.lectureTopic}</span>
                      </div>
                    )}
                    {material.description && (
                      <p className="hmp-card-description">{material.description}</p>
                    )}
                    <div className="hmp-card-meta">
                      <span>📦 {material.fileSize || 'Unknown'}</span>
                      <span>👁️ {material.viewCount || 0}</span>
                      <span>📥 {material.downloadCount || 0}</span>
                    </div>
                  </div>
                  
                  <div className="hmp-card-footer">
                    <div className="hmp-card-course">
                      <BookOpen size={12} />
                      <span>{material.course?.name || 'General'}</span>
                    </div>
                    <div className="hmp-card-actions">
                      <button onClick={() => handlePreview(material)} className="hmp-btn-view" title="Preview">
                        <Eye size={14} /> Preview
                      </button>
                      <button onClick={() => handleDownload(material)} className="hmp-btn-drive" disabled={downloading === material._id} title="Open in Google Drive">
                        {downloading === material._id ? 'Opening...' : <><ExternalLink size={14} /> Download</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="hmp-footer">
        <p>📚 Materials are shared via Google Drive - Click "Drive" to open and download</p>
      </footer>
    </div>
  );
};

export default HelpingMaterialsPage;