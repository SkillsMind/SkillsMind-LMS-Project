import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  BookOpen, Edit2, Camera, Save, Clock, TrendingUp,
  CheckCircle2, Link as LinkIcon, Github, 
  Linkedin, Twitter, Globe, Download, Share2,
  PlayCircle, FileText, LogOut, Loader2, 
  MoreVertical, Trash2, X, Plus, GraduationCap,
  Briefcase, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from '../../../context/ProfileContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    activeCourses: 0,
    completedCourses: 0,
    certificates: 0,
    studyHours: 0,
    avgProgress: 0,
    streak: 0
  });
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingBio, setEditingBio] = useState(false);
  const [editingEducation, setEditingEducation] = useState(false);
  const [bioText, setBioText] = useState('');
  const [educationData, setEducationData] = useState({
    education: '',
    institute: '',
    occupation: ''
  });
  
  // Image upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDP, setUploadingDP] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [showDPMenu, setShowDPMenu] = useState(false);
  
  const coverInputRef = useRef(null);
  const dpInputRef = useRef(null);
  
  const backendURL = "${import.meta.env.VITE_API_URL}";
  const userId = localStorage.getItem('userId');

  // Fetch all data
  useEffect(() => {
    if (userId && profile) {
      fetchDashboardData();
      setBioText(profile?.bio || '');
      setEducationData({
        education: profile?.education || '',
        institute: profile?.institute || '',
        occupation: profile?.occupation || ''
      });
    }
  }, [userId, profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch stats and enrollments
      const statsRes = await axios.get(`${backendURL}/api/student-profile/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setEnrollments(statsRes.data.enrollments || []);
      }
      
      // Fetch activities
      const activityRes = await axios.get(`${backendURL}/api/student-profile/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (activityRes.data.success) {
        setActivities(activityRes.data.activities || []);
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Bio handlers
  const handleSaveBio = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${backendURL}/api/student-profile/update-bio`, 
        { bio: bioText },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setEditingBio(false);
      updateProfile({ ...profile, bio: bioText });
    } catch (error) {
      console.error("Error saving bio:", error);
    }
  };

  // Education handlers
  const handleSaveEducation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${backendURL}/api/student-profile/update-education`, 
        educationData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setEditingEducation(false);
      updateProfile({ ...profile, ...educationData });
    } catch (error) {
      console.error("Error saving education:", error);
    }
  };

  // Cover photo handlers
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('coverPhoto', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backendURL}/api/student-profile/upload-cover`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (res.data.success) {
        updateProfile({ ...profile, coverPhoto: res.data.coverPhoto });
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
    } finally {
      setUploadingCover(false);
      setShowCoverMenu(false);
    }
  };

  const handleRemoveCover = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${backendURL}/api/student-profile/remove-cover`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateProfile({ ...profile, coverPhoto: null });
    } catch (error) {
      console.error("Error removing cover:", error);
    }
    setShowCoverMenu(false);
  };

  // DP handlers
  const handleDPUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDP(true);
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backendURL}/api/student-profile/upload-dp`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (res.data.success) {
        updateProfile({ ...profile, profilePic: res.data.profilePic });
      }
    } catch (error) {
      console.error("Error uploading DP:", error);
    } finally {
      setUploadingDP(false);
      setShowDPMenu(false);
    }
  };

  const handleRemoveDP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${backendURL}/api/student-profile/remove-dp`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateProfile({ ...profile, profilePic: null });
    } catch (error) {
      console.error("Error removing DP:", error);
    }
    setShowDPMenu(false);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${backendURL}${path}`;
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (profileLoading || loading) {
    return (
      <div className="profile-loading">
        <Loader2 className="spin" size={40} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Cover Photo Banner */}
      <div 
        className="cover-banner"
        style={profile?.coverPhoto ? {
          backgroundImage: `url(${getImageUrl(profile.coverPhoto)})`
        } : {}}
      >
        <div className="cover-overlay"></div>
        
        {/* Cover Photo Edit Button */}
        <div 
          className="cover-edit-wrapper"
          onMouseEnter={() => setShowCoverMenu(true)}
          onMouseLeave={() => setShowCoverMenu(false)}
        >
          <button className="cover-edit-btn">
            <Camera size={18} />
            Change Cover
          </button>
          
          <AnimatePresence>
            {showCoverMenu && (
              <motion.div 
                className="cover-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <label className="menu-item" htmlFor="cover-upload">
                  <Camera size={16} /> Upload Photo
                  <input 
                    type="file" 
                    id="cover-upload" 
                    hidden 
                    accept="image/*"
                    onChange={handleCoverUpload}
                  />
                </label>
                {profile?.coverPhoto && (
                  <button className="menu-item remove" onClick={handleRemoveCover}>
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {uploadingCover && (
          <div className="upload-overlay">
            <Loader2 size={32} className="spin" />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-content">
          {/* Profile Picture with Edit */}
          <div className="profile-pic-wrapper">
            <div 
              className="profile-pic"
              onMouseEnter={() => setShowDPMenu(true)}
              onMouseLeave={() => setShowDPMenu(false)}
            >
              {profile?.profilePic ? (
                <img src={getImageUrl(profile.profilePic)} alt={profile.name} />
              ) : (
                <span className="profile-initials">{getInitials(profile?.name)}</span>
              )}
              
              {/* DP Edit Overlay */}
              <AnimatePresence>
                {showDPMenu && (
                  <motion.div 
                    className="dp-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <label htmlFor="dp-upload" className="dp-edit-btn">
                      <Camera size={20} />
                    </label>
                    <input 
                      type="file" 
                      id="dp-upload" 
                      hidden 
                      accept="image/*"
                      onChange={handleDPUpload}
                    />
                    {profile?.profilePic && (
                      <button className="dp-remove-btn" onClick={handleRemoveDP}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {uploadingDP && (
                <div className="dp-uploading">
                  <Loader2 size={24} className="spin" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <h1 className="profile-name">{profile?.name || 'Student'}</h1>
            <p className="profile-title">{profile?.occupation || 'SkillsMind Learner'}</p>
            
            <div className="profile-meta">
              <span className="meta-item">
                <MapPin size={14} />
                {profile?.city || 'Location not set'}
              </span>
              <span className="meta-dot">•</span>
              <span className="meta-item">
                <Calendar size={14} />
                Joined {formatDate(profile?.createdAt)}
              </span>
              <span className="meta-dot">•</span>
              <span className="meta-item">
                <Mail size={14} />
                {profile?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs-container">
        <div className="tabs-wrapper">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'courses', label: 'My Courses', icon: BookOpen },
            { id: 'certificates', label: 'Certificates', icon: Award },
            { id: 'activity', label: 'Activity', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon navy">
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.activeCourses}</span>
              <span className="stat-label">Active Courses</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon navy">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.certificates}</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon navy">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.studyHours}h</span>
              <span className="stat-label">Study Hours</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon navy">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.avgProgress}%</span>
              <span className="stat-label">Avg. Progress</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              className="content-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Left Column */}
              <div className="main-column">
                {/* Bio Section */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>About Me</h3>
                    {!editingBio && (
                      <button className="edit-btn" onClick={() => setEditingBio(true)}>
                        <Edit2 size={16} /> Edit
                      </button>
                    )}
                  </div>
                  
                  {editingBio ? (
                    <div className="bio-edit">
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                      <div className="edit-actions">
                        <button className="btn-secondary" onClick={() => setEditingBio(false)}>
                          Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSaveBio}>
                          <Save size={16} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="bio-text">
                      {profile?.bio || 'No bio added yet. Tell us about yourself!'}
                    </p>
                  )}
                </div>

                {/* Education Section */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Education & Work</h3>
                    {!editingEducation && (
                      <button className="edit-btn" onClick={() => setEditingEducation(true)}>
                        <Edit2 size={16} /> Edit
                      </button>
                    )}
                  </div>
                  
                  {editingEducation ? (
                    <div className="education-edit">
                      <div className="form-group">
                        <label>Education</label>
                        <input
                          type="text"
                          value={educationData.education}
                          onChange={(e) => setEducationData({...educationData, education: e.target.value})}
                          placeholder="e.g. BS Computer Science"
                        />
                      </div>
                      <div className="form-group">
                        <label>Institute</label>
                        <input
                          type="text"
                          value={educationData.institute}
                          onChange={(e) => setEducationData({...educationData, institute: e.target.value})}
                          placeholder="e.g. Virtual University"
                        />
                      </div>
                      <div className="form-group">
                        <label>Occupation</label>
                        <input
                          type="text"
                          value={educationData.occupation}
                          onChange={(e) => setEducationData({...educationData, occupation: e.target.value})}
                          placeholder="e.g. Software Engineer"
                        />
                      </div>
                      <div className="edit-actions">
                        <button className="btn-secondary" onClick={() => setEditingEducation(false)}>
                          Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSaveEducation}>
                          <Save size={16} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="education-display">
                      <div className="edu-item">
                        <div className="edu-icon">
                          <GraduationCap size={20} />
                        </div>
                        <div className="edu-details">
                          <label>Education</label>
                          <p>{profile?.education || 'Not specified'}</p>
                          {profile?.institute && <span>{profile.institute}</span>}
                        </div>
                      </div>
                      
                      <div className="edu-item">
                        <div className="edu-icon">
                          <Briefcase size={20} />
                        </div>
                        <div className="edu-details">
                          <label>Occupation</label>
                          <p>{profile?.occupation || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Courses */}
                {enrollments.length > 0 && (
                  <div className="content-card">
                    <div className="card-header">
                      <h3>Current Learning</h3>
                      <button className="link-btn" onClick={() => setActiveTab('courses')}>
                        View All
                      </button>
                    </div>
                    <div className="courses-preview">
                      {enrollments.slice(0, 2).map((course) => (
                        <div key={course._id} className="course-preview-item">
                          <div className="course-thumb">
                            {course.thumbnail ? (
                              <img src={getImageUrl(course.thumbnail)} alt="" />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>
                          <div className="course-info">
                            <h4>{course.title}</h4>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <span>{course.progress}% complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="side-column">
                {/* Quick Stats */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Learning Stats</h3>
                  </div>
                  <div className="quick-stats">
                    <div className="quick-stat">
                      <span className="quick-value">{stats.streak}</span>
                      <span className="quick-label">Day Streak</span>
                    </div>
                    <div className="quick-stat">
                      <span className="quick-value">{stats.completedCourses}</span>
                      <span className="quick-label">Completed</span>
                    </div>
                    <div className="quick-stat">
                      <span className="quick-value">{stats.totalEnrollments}</span>
                      <span className="quick-label">Total Enrolled</span>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Achievements</h3>
                  </div>
                  <div className="achievements-list">
                    {stats.activeCourses > 0 && (
                      <div className="achievement-item">
                        <div className="achievement-icon">🎯</div>
                        <div className="achievement-info">
                          <h4>Course Enrolled</h4>
                          <p>Started learning journey</p>
                        </div>
                      </div>
                    )}
                    {stats.certificates > 0 && (
                      <div className="achievement-item">
                        <div className="achievement-icon">🏆</div>
                        <div className="achievement-info">
                          <h4>Certified</h4>
                          <p>Earned {stats.certificates} certificate(s)</p>
                        </div>
                      </div>
                    )}
                    {stats.studyHours >= 10 && (
                      <div className="achievement-item">
                        <div className="achievement-icon">⏰</div>
                        <div className="achievement-info">
                          <h4>Dedicated Learner</h4>
                          <p>{stats.studyHours} hours of learning</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COURSES TAB */}
          {activeTab === 'courses' && (
            <motion.div 
              key="courses"
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="content-card full-width">
                <div className="card-header">
                  <h3>My Courses ({enrollments.length})</h3>
                </div>
                {enrollments.length === 0 ? (
                  <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No courses yet</h3>
                    <p>Start your learning journey by enrolling in a course</p>
                    <button className="btn-primary" onClick={() => navigate('/get-enrollment')}>
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  <div className="courses-grid">
                    {enrollments.map((course) => (
                      <div key={course._id} className="course-card">
                        <div className="course-image">
                          {course.thumbnail ? (
                            <img src={getImageUrl(course.thumbnail)} alt="" />
                          ) : (
                            <div className="course-placeholder">
                              <PlayCircle size={32} />
                            </div>
                          )}
                          {course.status === 'completed' && (
                            <div className="completed-badge">
                              <CheckCircle2 size={14} /> Completed
                            </div>
                          )}
                        </div>
                        <div className="course-details">
                          <h3>{course.title}</h3>
                          <p className="instructor">{course.instructor}</p>
                          
                          <div className="course-progress">
                            <div className="progress-track">
                              <div 
                                className="progress-bar-fill" 
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <div className="progress-meta">
                              <span>{course.progress}% complete</span>
                              <span className={`status-badge ${course.status}`}>
                                {course.status}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            className="btn-outline"
                            onClick={() => navigate(`/course/${course.courseId}`)}
                          >
                            {course.progress === 0 ? 'Start Course' : 
                             course.status === 'completed' ? 'Review' : 'Continue'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CERTIFICATES TAB */}
          {activeTab === 'certificates' && (
            <motion.div 
              key="certificates"
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="content-card full-width">
                <div className="card-header">
                  <h3>My Certificates ({stats.certificates})</h3>
                </div>
                {stats.certificates === 0 ? (
                  <div className="empty-state">
                    <Award size={48} />
                    <h3>No certificates yet</h3>
                    <p>Complete courses to earn certificates</p>
                  </div>
                ) : (
                  <div className="certificates-grid">
                    {enrollments
                      .filter(e => e.certificate.issued)
                      .map((course) => (
                        <div key={course._id} className="certificate-card">
                          <div className="cert-header">
                            <Award size={32} className="cert-icon" />
                            <span className="cert-date">
                              {formatDate(course.certificate.issuedAt)}
                            </span>
                          </div>
                          <h3>{course.title}</h3>
                          <p className="cert-id">ID: {course.certificate.certificateNumber}</p>
                          <div className="cert-footer">
                            <button 
                              className="btn-small"
                              onClick={() => window.open(getImageUrl(course.certificate.url), '_blank')}
                            >
                              <Download size={14} /> Download
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="content-card full-width">
                <div className="card-header">
                  <h3>Recent Activity</h3>
                </div>
                {activities.length === 0 ? (
                  <div className="empty-state">
                    <Clock size={48} />
                    <h3>No recent activity</h3>
                    <p>Your learning activities will appear here</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {activities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className={`activity-dot ${activity.type}`}></div>
                        <div className="activity-content">
                          <p className="activity-title">{activity.title}</p>
                          <p className="activity-desc">{activity.description}</p>
                          <span className="activity-time">{activity.timeAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;