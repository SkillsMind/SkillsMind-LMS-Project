import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, X, CheckCircle, AlertCircle, Search, BookOpen, ChevronRight, MapPin, Mail, Phone, UserRound, Cake, Briefcase, GraduationCap, Award, Sparkles, Play, Shield, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import './WebinarPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WebinarPage = () => {
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formStep, setFormStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    qualification: '',
    profession: ''
  });

  const userStr = localStorage.getItem('user');
  let loggedInUser = null;
  try {
    if (userStr) loggedInUser = JSON.parse(userStr);
  } catch (e) {}

  useEffect(() => {
    fetchActiveWebinars();
  }, []);

  const fetchActiveWebinars = async () => {
    try {
      const response = await fetch(`${API_URL}/api/webinar/active/all`);
      const data = await response.json();
      if (data.success) {
        setWebinars(data.webinars || []);
      }
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast.error('Failed to load webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (webinar) => {
    setSelectedWebinar(webinar);
    setFormStep(1);
    setMessage(null);
    setShowForm(true);
    document.body.style.overflow = 'hidden';
    
    if (loggedInUser) {
      setFormData({
        fullName: loggedInUser.name || '',
        email: loggedInUser.email || '',
        phone: '',
        city: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        qualification: '',
        profession: ''
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        qualification: '',
        profession: ''
      });
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setSelectedWebinar(null);
    setFormStep(1);
    document.body.style.overflow = 'auto';
    setMessage(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        toast.error('Please fill all required fields');
        return;
      }
      setFormStep(2);
    }
  };

  const prevStep = () => {
    setFormStep(1);
  };

  // ✅ FIXED: Convert date of birth to proper format for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;
    
    let formattedDate = dateString.trim();
    
    // If already in YYYY-MM-DD format (from date input)
    if (formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return formattedDate;
    }
    
    // Handle DD/MM/YYYY format
    if (formattedDate.includes('/')) {
      const parts = formattedDate.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // Handle DD.MM.YYYY format
    if (formattedDate.includes('.')) {
      const parts = formattedDate.split('.');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // Handle DD MM YYYY format (with spaces)
    if (formattedDate.includes(' ')) {
      const parts = formattedDate.split(' ');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    return formattedDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSubmitting(true);
    setMessage(null);

    try {
      // ✅ FIX: Format date of birth properly
      const formattedDateOfBirth = formatDateForBackend(formData.dateOfBirth);
      
      const payload = {
        webinarId: selectedWebinar._id,
        courseId: selectedWebinar.courseId || null,
        courseName: selectedWebinar.courseName,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city || '',
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || '',
        dateOfBirth: formattedDateOfBirth,
        qualification: formData.qualification || '',
        profession: formData.profession || ''
      };

      console.log('Sending payload:', payload);

      const response = await fetch(`${API_URL}/api/webinar/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '🎉 Registration successful! Check your email for webinar link.' });
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWebinars = webinars.filter(webinar =>
    webinar.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webinar.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="webinar-page">
        <div className="webinar-loader">
          <div className="spinner"></div>
          <p>Loading amazing webinars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="webinar-page">
      <Toaster position="top-center" />
      
      {/* Premium Hero Section */}
      <section className="premium-hero">
        <div className="hero-animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="hero-content-wrapper">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Live Learning Sessions</span>
          </div>
          <h1 className="hero-title">
            Free <span className="gradient-text">Webinars</span>
          </h1>
          <p className="hero-subtitle">
            Join our free webinars and learn from industry experts. 
            Get certified and boost your career with SkillsMind.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <Award size={16} />
              <span>10,000+ Students</span>
            </div>
            <div className="stat">
              <Play size={16} />
              <span>50+ Webinars</span>
            </div>
            <div className="stat">
              <Star size={16} />
              <span>4.9 Rating</span>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="white"></path>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="webinar-main">
        <div className="container">
          
          {/* Premium Search Bar */}
          <div className="premium-toolbar">
            <div className="search-wrapper">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search webinars by title, course or instructor..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              <button className="filter-btn active">All Webinars</button>
              <button className="filter-btn">Upcoming</button>
              <button className="filter-btn">Trending</button>
            </div>
          </div>

          {/* Premium Webinars Grid */}
          {filteredWebinars.length === 0 ? (
            <div className="premium-empty">
              <Video size={48} />
              <h3>No Active Webinars</h3>
              <p>There are no active webinars at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="premium-grid">
              {filteredWebinars.map((webinar, index) => (
                <div key={webinar._id} className="premium-card">
                  <div className="card-glow"></div>
                  <div className="card-badge-wrap">
                    <span className="card-badge premium-badge">FREE</span>
                    {index === 0 && <span className="trending-badge"><TrendingUp size={10} /> Trending</span>}
                  </div>
                  <div className="card-content">
                    <div className="course-tag">
                      <BookOpen size={12} />
                      <span>{webinar.courseName}</span>
                    </div>
                    <h3>{webinar.title}</h3>
                    <p>{webinar.description?.substring(0, 100)}...</p>
                    
                    <div className="card-meta">
                      <div className="meta-chip">
                        <Calendar size={12} />
                        <span>{webinar.startDate ? new Date(webinar.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                      </div>
                      <div className="meta-chip">
                        <Clock size={12} />
                        <span>{webinar.time}</span>
                      </div>
                      <div className="meta-chip">
                        <User size={12} />
                        <span>{webinar.instructor}</span>
                      </div>
                    </div>

                    <div className="topic-chips">
                      {webinar.topics?.slice(0, 3).map((topic, idx) => (
                        <span key={idx} className="topic-chip">{topic}</span>
                      ))}
                      {webinar.topics?.length > 3 && (
                        <span className="topic-chip more">+{webinar.topics.length - 3}</span>
                      )}
                    </div>
                    
                    <button className="register-btn-premium" onClick={() => handleRegisterClick(webinar)}>
                      Register Now <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium Registration Modal - FIXED */}
      {showForm && selectedWebinar && (
        <>
          <div className="premium-modal-overlay" onClick={closeModal}></div>
          <div className="premium-modal-container">
            <div className="premium-modal">
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
              
              <div className="modal-header-premium">
                <span className="modal-badge-premium">Limited Seats Available</span>
                <h3>{selectedWebinar.title}</h3>
                <p className="course-name">{selectedWebinar.courseName}</p>
              </div>

              {message && (
                <div className={`modal-message-premium ${message.type}`}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="premium-form">
                {formStep === 1 ? (
                  <>
                    <div className="form-header">
                      <div className="step-indicator active">1</div>
                      <div className="step-line"></div>
                      <div className="step-indicator">2</div>
                      <div className="step-text">
                        <span className="step-label active">Basic Info</span>
                        <span className="step-label">Additional Info</span>
                      </div>
                    </div>
                    
                    <div className="form-group-premium">
                      <label><UserRound size={14} /> Full Name <span className="required-star">*</span></label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className="form-group-premium">
                      <label><Mail size={14} /> Email Address <span className="required-star">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    
                    <div className="form-group-premium">
                      <label><Phone size={14} /> Phone Number <span className="required-star">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    
                    <div className="form-group-premium">
                      <label><MapPin size={14} /> City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter your city"
                      />
                    </div>
                    
                    <div className="webinar-details-card">
                      <Shield size={16} />
                      <div>
                        <strong>Webinar Details</strong>
                        <p>{selectedWebinar.startDate ? new Date(selectedWebinar.startDate).toLocaleDateString() : 'TBA'} • {selectedWebinar.time} • Online</p>
                      </div>
                    </div>
                    
                    <button type="button" className="next-btn-premium" onClick={nextStep}>
                      Continue <ChevronRight size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-header">
                      <div className="step-indicator completed">✓</div>
                      <div className="step-line"></div>
                      <div className="step-indicator active">2</div>
                      <div className="step-text">
                        <span className="step-label">Basic Info</span>
                        <span className="step-label active">Additional Info</span>
                      </div>
                    </div>
                    
                    <div className="form-row-2-premium">
                      <div className="form-group-premium">
                        <label><Cake size={14} /> Age</label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Your age"
                          inputMode="numeric"
                        />
                      </div>
                      
                      <div className="form-group-premium">
                        <label><UserRound size={14} /> Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* ✅ FIXED: Changed to type="date" for proper format */}
                    <div className="form-group-premium">
                      <label><Calendar size={14} /> Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group-premium">
                      <label><GraduationCap size={14} /> Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        placeholder="e.g., Bachelor's, Master's, Intermediate"
                      />
                    </div>
                    
                    <div className="form-group-premium">
                      <label><Briefcase size={14} /> Profession</label>
                      <input
                        type="text"
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        placeholder="e.g., Student, Teacher, Developer"
                      />
                    </div>
                    
                    <div className="form-buttons-premium">
                      <button type="button" className="back-btn-premium" onClick={prevStep}>
                        ← Back
                      </button>
                      <button type="submit" className="submit-btn-premium" disabled={submitting}>
                        {submitting ? (
                          <>
                            <div className="spinner-small"></div>
                            Processing...
                          </>
                        ) : (
                          'Complete Registration →'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebinarPage;