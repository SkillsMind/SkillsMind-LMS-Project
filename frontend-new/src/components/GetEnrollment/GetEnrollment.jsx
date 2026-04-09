import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClock, FaSignal, FaUserTie, FaTimes, FaUserGraduate,
  FaSearch, FaSignOutAlt, FaChevronRight, FaMapMarkerAlt,
  FaBook, FaBullseye, FaUniversity, FaCamera, FaArrowLeft,
  FaHome, FaStar, FaUsers, FaPlayCircle, FaCheckCircle, FaChevronDown,
  FaGlobe, FaUserCheck, FaLayerGroup, FaDownload, FaChalkboardTeacher, FaLightbulb,
  FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp, FaInstagram, FaYoutube, FaCertificate, 
  FaInfinity, FaMobileAlt, FaAward, FaRocket, FaShieldAlt, FaVideo, FaMicrophone, 
  FaEnvelope, FaPhone, FaTransgender, FaGraduationCap, FaExclamationTriangle,
  FaRedo, FaTimesCircle
} from 'react-icons/fa';
import axios from 'axios';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import './GetEnrollment.css';

import WelcomeNotice from './WelcomeNotice';
import { useProfile } from '../../context/ProfileContext.jsx';

const GetEnrollment = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedWeek, setExpandedWeek] = useState(null);
  
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ACTIVE enrollments (payment approved)
  const [activeEnrollments, setActiveEnrollments] = useState([]);
  // PENDING enrollments (form filled, payment not approved)
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  // REJECTED enrollments (payment rejected by admin)
  const [rejectedEnrollments, setRejectedEnrollments] = useState([]);

  const { profile, loading: profileLoading } = useProfile();
  
  const userId = localStorage.getItem('userId');
  const storedName = localStorage.getItem('userName') || "Student";
  const token = localStorage.getItem('token');
  
  const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const student = profile;

  // AUTHENTICATION CHECK
  if (!token || !userId) {
    localStorage.setItem('redirectAfterLogin', '/get-enrolment');
    return <Navigate to="/login" replace />;
  }

  // Check ACTIVE enrollments
  const checkActiveEnrollments = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/enroll/check-enrollment/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setActiveEnrollments(response.data.enrolledCourses || []);
      }
    } catch (error) {
      console.error("Active enrollment check error:", error);
    }
  };

  // Check PENDING enrollments
  const checkPendingEnrollments = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/enroll/check-pending/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPendingEnrollments(response.data.pendingCourses || []);
      }
    } catch (error) {
      console.error("Pending enrollment check error:", error);
    }
  };

  // Check REJECTED enrollments
  const checkRejectedEnrollments = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/enroll/check-rejected/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRejectedEnrollments(response.data.rejectedCourses || []);
      }
    } catch (error) {
      console.error("Rejected enrollment check error:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
    checkActiveEnrollments();
    checkPendingEnrollments();
    checkRejectedEnrollments();
  }, [userId]);

  const getLearningPoints = (courseTitle) => {
    const title = courseTitle?.toLowerCase() || "";
    if(title.includes('web')) {
      return [
        "Modern HTML5 & Semantic Web",
        "Advanced CSS3 Flexbox/Grid",
        "JavaScript ES6+ Fundamentals",
        "React.js State Management",
        "Responsive Mobile-First Design",
        "Restful API Integration",
        "Node.js & Express Backend",
        "MongoDB Database Design",
        "Version Control with Git/GitHub",
        "Deployment & Live Hosting"
      ];
    }
    if(title.includes('graphic') || title.includes('design')) {
      return [
        "Design Thinking & Psychology",
        "Color Theory & Typography",
        "Adobe Photoshop Professional",
        "Adobe Illustrator Vector Art",
        "Logo & Brand Identity Design",
        "Social Media Marketing Graphics",
        "UI/UX Design Principles",
        "Print Media & Packaging",
        "Freelancing on Fiverr/Upwork",
        "Portfolio Building"
      ];
    }
    return [
      "In-depth Topic Mastery",
      "Real-world Practical Projects",
      "Industry Standard Tools",
      "Professional Workflow Hacks",
      "Problem Solving Strategies",
      "Expert Mentor Support",
      "Peer-to-Peer Networking",
      "Time Management for Pros",
      "Career Path Guidance",
      "Official SkillsMind Certification"
    ];
  };

  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const downloadSyllabusPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
      const logoBase64 = await getBase64ImageFromURL('/Skillsmind logo.jpeg');
      doc.addImage(logoBase64, 'JPEG', pageWidth - 50, 10, 40, 40);
    } catch (e) {
      console.error("Logo loading failed for PDF", e);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(selectedCourse.title, 15, 30);
    
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(15, 35, 80, 35);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text(`Instructor: ${selectedCourse.instructor?.name || 'SkillsMind Mentor'}`, 15, 45);
    doc.text(`Duration: ${selectedCourse.duration || '3 Months'}`, 15, 52);
    doc.text(`Level: ${selectedCourse.level || 'Professional'}`, 15, 59);

    let yPos = 75;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Course Curriculum", 15, yPos);
    yPos += 10;

    selectedCourse.syllabus?.forEach((item) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text(`Week ${item.week}: ${item.mainTopic}`, 20, yPos + 2);
      
      yPos += 12;
      doc.setTextColor(71, 85, 105);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      item.lessons?.forEach(sub => {
        doc.text(`• ${sub}`, 25, yPos);
        yPos += 7;
      });
      yPos += 5;
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("© 2026 SkillsMind Learning Management System - All Rights Reserved", pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`${selectedCourse.title}_Syllabus_SkillsMind.pdf`);
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/courses/all`);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("SkillsMind Error:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${backendURL}/${cleanPath}?v=${new Date().getTime()}`;
  };

  const getVideoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendURL}${finalPath}`;
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const res = await axios.post(`${backendURL}/api/student-profile/upload-image/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        // Profile context will auto-update
      }
    } catch (err) {
      console.error("Image Upload Error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const displayFirstName = student?.firstName || storedName.split(' ')[0] || "Student";
  const fullDisplayName = student?.firstName ? `${student.firstName} ${student.lastName || ''}` : storedName;

  const filtered = (courses || []).filter(c => 
    c?.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
    c?.isHide !== true && 
    c?.isHide !== "true"
  );

  const handleBack = () => {
    if (showModeSelection) {
      setShowModeSelection(false);
    } else if (viewMode !== 'grid') {
      setViewMode('grid');
      setSelectedCourse(null);
    } else {
      navigate(-1);
    }
  };

  // ============================================
  // STATUS CHECK FUNCTIONS
  // ============================================
  
  // Check if PENDING
  const getPendingEnrollment = (courseId, courseTitle) => {
    return pendingEnrollments.find(
      p => p.courseId === courseId || p.courseTitle === courseTitle
    );
  };

  // Check if ACTIVE
  const isActiveEnrolled = (courseId, courseTitle) => {
    return activeEnrollments.some(
      a => a.courseId === courseId || a.courseTitle === courseTitle
    );
  };

  // Check if REJECTED
  const getRejectedEnrollment = (courseId, courseTitle) => {
    return rejectedEnrollments.find(
      r => r.courseId === courseId || r.courseTitle === courseTitle
    );
  };

  // Handle Enrollment Click
  const handleLiveEnrollment = async (course) => {
    const isActive = isActiveEnrolled(course._id, course.title);
    const pendingEnrollment = getPendingEnrollment(course._id, course.title);
    const rejectedEnrollment = getRejectedEnrollment(course._id, course.title);
    
    // CASE 1: Already Active
    if (isActive) {
      const result = await Swal.fire({
        title: 'Already Enrolled!',
        html: `You are already fully enrolled in <strong>${course.title}</strong>.<br/><br/>Do you want to go to your learning dashboard?`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Go to My Learning',
        cancelButtonText: 'Stay Here'
      });
      
      if (result.isConfirmed) {
        navigate('/my-learning');
      }
      return;
    }

    // CASE 2: Rejected - Allow resubmission
    if (rejectedEnrollment) {
      const result = await Swal.fire({
        title: 'Payment Rejected!',
        html: `
          <div style="text-align: left;">
            <p style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">Reason: ${rejectedEnrollment.rejectionReason || 'Payment not verified'}</p>
            <p>Would you like to resubmit your payment?</p>
          </div>
        `,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Resubmit Payment',
        cancelButtonText: 'Cancel'
      });
      
      if (result.isConfirmed) {
        navigate(`/payment-method/${course._id}`, {
          state: {
            course: course.title,
            amount: course.price,
            image: course.thumbnail,
            duration: course.duration,
            level: course.level,
            enrollmentId: rejectedEnrollment.enrollmentId,
            enrollmentData: rejectedEnrollment.formData,
            resubmit: true,
            previousPaymentId: rejectedEnrollment.paymentId
          }
        });
      }
      return;
    }

    // CASE 3: Pending
    if (pendingEnrollment) {
      const result = await Swal.fire({
        title: 'Complete Your Payment!',
        html: `You have already submitted registration for <strong>${course.title}</strong>.<br/><br/>Your payment is pending verification. What would you like to do?`,
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        denyButtonColor: '#f59e0b',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Go to Payment',
        denyButtonText: 'Update Details',
        cancelButtonText: 'Cancel'
      });
      
      if (result.isConfirmed) {
        navigate(`/payment-method/${course._id}`, {
          state: {
            course: course.title,
            amount: course.price,
            image: course.thumbnail,
            duration: course.duration,
            level: course.level,
            enrollmentId: pendingEnrollment.enrollmentId,
            enrollmentData: pendingEnrollment.formData
          }
        });
        return;
      } else if (result.isDenied) {
        navigate('/enroll-live/' + course.title.replace(/\s+/g, '-').toLowerCase(), {
          state: {
            course: course,
            mode: 'live',
            existingEnrollment: pendingEnrollment,
            enrollmentData: pendingEnrollment.formData || {
              fullName: student?.firstName ? `${student.firstName} ${student.lastName || ''}` : storedName,
              email: student?.email || '',
              phone: student?.phone || ''
            }
          }
        });
        return;
      }
      return;
    }

    // CASE 4: New Enrollment
    navigate('/enroll-live/' + course.title.replace(/\s+/g, '-').toLowerCase(), {
      state: {
        course: course,
        mode: 'live',
        existingEnrollment: null,
        enrollmentData: {
          fullName: student?.firstName ? `${student.firstName} ${student.lastName || ''}` : storedName,
          email: student?.email || '',
          phone: student?.phone || ''
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="sm-enroll-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="sm-enroll-root">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        accept="image/*"
      />

      <nav className="sm-navbar">
        <div className="nav-container-fluid">
          <div className="brand-logo" onClick={() => navigate('/')}>
            SKILLSMIND <span>Courses</span>
          </div>

          <div className="nav-search-hub desktop-only">
            <div className="search-pill-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search your interest..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="nav-user-actions">
            <div className="profile-wrapper">
              <div className="profile-trigger-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="student-img">
                  {student?.profileImage ? (
                    <img src={getImageUrl(student.profileImage)} alt="Profile" />
                  ) : (
                    <FaUserTie />
                  )}
                </div>
                <div className="student-name-box">
                  <span className="s-name">{fullDisplayName}</span>
                  <span className="s-tag">SkillsMind Member</span>
                </div>
              </div>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="user-dropdown-card"
                  >
                    <div className="drop-item" onClick={() => { setShowProfileSidebar(true); setShowUserMenu(false); }}>
                      <FaUserGraduate /> View My Profile
                    </div>
                    <div className="drop-item logout-red" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="sm-sub-nav-bar">
        <div className="sub-nav-container">
            <div className="nav-action-btns">
                <button className="nav-circle-btn back" onClick={handleBack}><FaArrowLeft /></button>
                <button className="nav-circle-btn home" onClick={() => navigate('/')}><FaHome /></button>
                <button 
                  className={`nav-circle-btn search-toggle ${isSearchOpen ? 'active' : ''}`} 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  {isSearchOpen ? <FaTimes /> : <FaSearch />}
                </button>
            </div>
            <div className="path-indicator desktop-only">
                Explore <span>/ {viewMode === 'grid' ? 'All Courses' : selectedCourse?.title}</span>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mobile-search-overlay-sm"
          >
            <div className="mobile-search-box-sm">
              <FaSearch className="search-icon-sm" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="close-search-sm" onClick={() => setIsSearchOpen(false)}>
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <header className="enrolment-welcome-hero-container">
              <motion.div 
                initial={{ x: -300, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                className="hero-welcome-content-pill"
              >
                <h1>Welcome To SkillsMind, <span>{displayFirstName}</span>!</h1>
              </motion.div>
            </header>

            <div className="sm-content-wrapper">
              <main className="sm-grid-container">
                <div className="grid-intro">
                  <h2>Pick Your <span>Learning Path</span></h2>
                  <p>Hand-picked premium courses for <strong>{displayFirstName}</strong></p>
                </div>

                <div className="enroll-grid-v6">
                  {filtered.map((course) => {
                    // PRIORITY: Active > Rejected > Pending > New
                    const isActive = isActiveEnrolled(course._id, course.title);
                    const rejectedEnrollment = getRejectedEnrollment(course._id, course.title);
                    const pendingEnrollment = getPendingEnrollment(course._id, course.title);
                    
                    return (
                      <div key={course._id} className="decent-card">
                        <div className="card-media-v6">
                          <img src={getImageUrl(course.thumbnail)} alt={course.title} />
                          <div className="elite-badge">{course.badge || 'PREMIUM'}</div>
                          
                          {/* BADGES - Priority Order */}
                          {isActive ? (
                            <div className="enrolled-badge">
                              <FaCheckCircle /> Enrolled
                            </div>
                          ) : rejectedEnrollment ? (
                            <div className="rejected-badge">
                              <FaTimesCircle /> Rejected
                            </div>
                          ) : pendingEnrollment ? (
                            <div className="pending-badge">
                              <FaExclamationTriangle /> Payment Pending
                            </div>
                          ) : null}
                          
                        </div>
                        <div className="card-content-v6">
                          <div className="card-meta-v6">
                            <span><FaClock /> {course.duration}</span>
                            <span className="dot"></span>
                            <span><FaSignal /> {course.level}</span>
                          </div>
                          <h3 className="card-title-v6">{course.title}</h3>
                          <div className="price-label-v6">Rs. {course.price}</div>
                          <div className="card-btn-row-v6">
                            <button className="btn-v6-details" onClick={() => {
                              setSelectedCourse(course);
                              setViewMode('details');
                              window.scrollTo(0,0);
                            }}>Details</button>
                            
                            {/* BUTTONS - Priority Order */}
                            {isActive ? (
                              // GREEN: Active/Approved
                              <button 
                                className="btn-v6-enroll active-enrolled" 
                                onClick={() => navigate('/my-learning')}
                              >
                                <FaCheckCircle /> Enrolled
                              </button>
                            ) : rejectedEnrollment ? (
                              // RED: Rejected with Reason
                              <button 
                                className="btn-v6-enroll rejected-btn" 
                                onClick={() => handleLiveEnrollment(course)}
                              >
                                <FaRedo /> Resubmit
                              </button>
                            ) : pendingEnrollment ? (
                              // YELLOW: Pending
                              <button 
                                className="btn-v6-enroll pending-payment" 
                                onClick={() => handleLiveEnrollment(course)}
                              >
                                Complete Payment <FaChevronRight />
                              </button>
                            ) : (
                              // DEFAULT: Enroll
                              <button 
                                className="btn-v6-enroll" 
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setViewMode('details');
                                  setShowModeSelection(true);
                                  window.scrollTo(0,0);
                                }}
                              >
                                Enroll <FaChevronRight />
                              </button>
                            )}
                          </div>
                          
                          {/* Show Rejection Reason below button if rejected */}
                          {rejectedEnrollment && (
                            <div style={{ 
                              marginTop: '10px', 
                              padding: '8px', 
                              background: '#fef2f2', 
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <FaTimesCircle style={{ flexShrink: 0 }} />
                              <span style={{ fontWeight: '600' }}>
                                Reason: {rejectedEnrollment.rejectionReason || 'Payment not verified'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </main>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="sm-course-detail-page"
          >
            
            <AnimatePresence>
              {showModeSelection && (
                <div className="sm-pro-overlay" onClick={() => setShowModeSelection(false)}>
                  <motion.div 
                    className="sm-pro-modal"
                    initial={{ opacity: 0, scale: 0.5, rotateX: 45 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="sm-pro-close" onClick={() => setShowModeSelection(false)}><FaTimes /></button>
                    
                    <div className="sm-pro-top-bar"></div>
                    
                    <div className="sm-pro-content">
                      <div className="sm-pro-brand-icon"><FaGraduationCap /></div>
                      <h2 className="sm-pro-title">Unlock Your Path</h2>
                      <p className="sm-pro-subtitle">Select how you want to master this skill with <span>SkillsMind</span></p>

                      <div className="sm-pro-options-grid">
                        
                        <div className="sm-pro-card live" 
                             onClick={() => handleLiveEnrollment(selectedCourse)}>
                          <div className="sm-pro-badge">Popular</div>
                          <div className="sm-pro-icon-box"><FaChalkboardTeacher /></div>
                          <div className="sm-pro-info">
                            <h4>Live Class</h4>
                            <p>Real-time interaction</p>
                          </div>
                          <div className="sm-pro-action"><FaChevronRight /></div>
                        </div>

                        <div className="sm-pro-card recorded" 
                             onClick={() => setShowComingSoon(true)}>
                          <div className="sm-pro-icon-box"><FaPlayCircle /></div>
                          <div className="sm-pro-info">
                            <h4>Recorded</h4>
                            <p>Learn at your pace</p>
                          </div>
                          <div className="sm-pro-action"><FaChevronRight /></div>
                        </div>

                      </div>
                    </div>
                    <div className="sm-pro-footer"><p>Joined by 10,000+ students globally</p></div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showComingSoon && (
                <div className="sm-pro-overlay" onClick={() => setShowComingSoon(false)}>
                  <motion.div 
                    className="sm-pro-modal"
                    initial={{ opacity: 0, scale: 0.5, rotateX: 45 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="sm-pro-close" onClick={() => setShowComingSoon(false)}><FaTimes /></button>
                    <div className="sm-pro-top-bar"></div>
                    <div className="sm-pro-content">
                      <div className="sm-pro-brand-icon" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#d97706', transform: 'rotate(0deg)' }}>
                        <FaClock />
                      </div>
                      <h2 className="sm-pro-title" style={{ color: '#d97706' }}>Coming Soon</h2>
                      <p className="sm-pro-subtitle">
                        Recorded classes are currently under development.<br/>
                        <span style={{ color: '#dc2626' }}>Join Live Classes</span> for now to start learning immediately!
                      </p>
                      <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '0px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                        🚀 We're working hard to bring you high-quality recorded content. Stay tuned!
                      </div>
                      <button 
                        onClick={() => setShowComingSoon(false)}
                        style={{ 
                          marginTop: '20px', 
                          padding: '12px 30px', 
                          background: '#000B29', 
                          color: 'white', 
                          border: 'none', 
                          fontWeight: '700', 
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Got it
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="course-detail-banner-compressed" style={{ backgroundImage: `url(${getImageUrl(selectedCourse.thumbnail)})` }}>
                <div className="banner-overlay"></div>
                <div className="sm-content-wrapper-fixed banner-flex">
                    <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}}>
                        <span className="bestseller-pill">SKILLSMIND EXCLUSIVE</span>
                        <h1>{selectedCourse.title}</h1>
                        <div className="banner-meta-row">
                            <span><FaUserCheck color="#ff4d4d"/> {selectedCourse.enrolledStudents || "1.2k"}+ Students</span>
                            <span><FaStar color="#fbbf24"/> 4.9 Rating</span>
                            <span><FaGlobe color="#ff4d4d"/> Urdu / Hindi</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="sm-content-wrapper-fixed detail-grid-v2 overlap-container">
                
                <div className="left-stack-v2">
                    
                    <div className="card-v2 instructor-profile-v2 detail-card-sharp">
                        <div className="ins-head-v2">
                            <img 
                              src={getImageUrl(selectedCourse.instructor?.profilePic)} 
                              alt="Mentor" 
                              onError={(e)=>e.target.src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                            />
                            <div className="ins-meta-v2">
                                <span className="expert-tag">Official SkillsMind Instructor</span>
                                <h3>{selectedCourse.instructor?.name || "SkillsMind Mentor"}</h3>
                                <p>{selectedCourse.instructor?.specialty || "Industry Expert"}</p>
                            </div>
                        </div>
                        <div className="ins-bio-v2">
                            <p>{selectedCourse.instructor?.bio || "Dedicated professional focused on delivering high-quality industry education through the SkillsMind platform."}</p>
                        </div>
                    </div>

                    <div className="card-v2 video-card-v2 detail-card-sharp">
                        <h4 className="card-title-v2"><FaPlayCircle color="#dc2626"/> Course Preview</h4>
                        <div className="player-wrapper-v2">
                            {(selectedCourse.introVideoFile || selectedCourse.videoFile) ? (
                                <video 
                                  src={getVideoUrl(selectedCourse.introVideoFile || selectedCourse.videoFile)} 
                                  controls 
                                  poster={getImageUrl(selectedCourse.thumbnail)} 
                                />
                            ) : (
                                <div className="no-preview-v2">
                                    <FaPlayCircle size={40}/>
                                    <p>Video Preview Not Available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card-v2 outcomes-card-v2 detail-card-sharp">
                      <h4 className="card-title-v2"><FaLightbulb color="#fbbf24"/> What you will learn</h4>
                      <div className="outcomes-list-v2">
                        {getLearningPoints(selectedCourse.title).map((point, i) => (
                          <div key={i} className="outcome-item-v2">
                            <FaCheckCircle/> <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card-v2 why-join-v2 detail-card-sharp">
                        <h4 className="card-title-v2"><FaBullseye color="#dc2626"/> Why SkillsMind?</h4>
                        <div className="why-grid-v2">
                            <div className="why-item-v2"><FaAward/> Industry Certificate</div>
                            <div className="why-item-v2"><FaRocket/> Career Transformation</div>
                            <div className="why-item-v2"><FaShieldAlt/> Secure Learning</div>
                            <div className="why-item-v2"><FaUsers/> Expert Community</div>
                        </div>
                    </div>
                </div>

                <div className="right-stack-v2">
                    <div className="sticky-enroll-v2 detail-card-sharp">
                        <div className="side-preview-v2">
                            <img src={getImageUrl(selectedCourse.thumbnail)} alt="Course" />
                        </div>
                        <div className="price-tag-v2">
                            <span className="now-v2">Rs. {selectedCourse.price}</span>
                            <span className="was-v2">Rs. {Math.round(selectedCourse.price * 1.5)}</span>
                        </div>
                        
                        {/* Detail View Buttons - Updated Logic */}
                        {(() => {
                          const isActive = isActiveEnrolled(selectedCourse._id, selectedCourse.title);
                          const rejected = getRejectedEnrollment(selectedCourse._id, selectedCourse.title);
                          const pending = getPendingEnrollment(selectedCourse._id, selectedCourse.title);
                          
                          if (isActive) {
                            return (
                              <button 
                                className="enroll-btn-v2 enrolled-btn" 
                                onClick={() => navigate('/my-learning')}
                              >
                                <FaCheckCircle /> Go to My Learning
                              </button>
                            );
                          } else if (rejected) {
                            return (
                              <button 
                                className="enroll-btn-v2 rejected-btn" 
                                onClick={() => handleLiveEnrollment(selectedCourse)}
                              >
                                <FaRedo /> Resubmit Payment
                              </button>
                            );
                          } else if (pending) {
                            return (
                              <button 
                                className="enroll-btn-v2 pending-btn" 
                                onClick={() => handleLiveEnrollment(selectedCourse)}
                              >
                                Complete Payment <FaChevronRight />
                              </button>
                            );
                          } else {
                            return (
                              <button 
                                className="enroll-btn-v2" 
                                onClick={() => setShowModeSelection(true)}
                              >
                                Enroll Now <FaChevronRight />
                              </button>
                            );
                          }
                        })()}
                        
                        <div className="perks-v2">
                            <div><FaInfinity/> Lifetime</div>
                            <div><FaCertificate/> Verified</div>
                            <div><FaMobileAlt/> Mobile Friendly</div>
                        </div>
                    </div>

                    <div className="card-v2 overview-v2 detail-card-sharp">
                         <h4 className="card-title-v2"><FaBook color="#dc2626"/> Summary</h4>
                         <div className="quick-grid-v2">
                            <div className="q-item-v2"><FaClock/> <span>{selectedCourse.duration || "3 Months"}</span></div>
                            <div className="q-item-v2"><FaSignal/> <span>{selectedCourse.level || "Intermediate"}</span></div>
                         </div>
                         <p className="overview-text-v2">{selectedCourse.description}</p>
                    </div>

                    <div className="card-v2 syllabus-v2 detail-card-sharp">
                         <div className="syl-header-v2">
                            <h4 className="card-title-v2">Curriculum</h4>
                            <button onClick={downloadSyllabusPDF} className="syl-dl-btn-v2">
                                <FaDownload />
                            </button>
                         </div>
                         <div className="accordion-stack-v2">
                            {selectedCourse.syllabus?.map((item, idx) => (
                                <div key={idx} className={`accordion-item-v2 ${expandedWeek === idx ? 'open' : ''}`}>
                                    <div 
                                      onClick={() => setExpandedWeek(expandedWeek === idx ? null : idx)}
                                      className="accordion-head-v2"
                                    >
                                        <span>Week ${item.week}: {item.mainTopic}</span>
                                        <FaChevronDown className="arrow-icon"/>
                                    </div>
                                    <AnimatePresence>
                                        {expandedWeek === idx && (
                                            <motion.div 
                                              initial={{height:0}} 
                                              animate={{height:'auto'}} 
                                              exit={{height:0}}
                                              className="accordion-body-v2"
                                            >
                                                {item.lessons?.map((lesson, lIdx) => (
                                                    <div key={lIdx} className="lesson-v2">• {lesson}</div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>

            <div className="mobile-sticky-action-bar">
              <div className="m-price-box">
                <span className="m-price">Rs. {selectedCourse.price}</span>
                <span className="m-old-price">Rs. {Math.round(selectedCourse.price * 1.5)}</span>
              </div>
              
              {/* Mobile Buttons - Updated Logic */}
              {(() => {
                const isActive = isActiveEnrolled(selectedCourse._id, selectedCourse.title);
                const rejected = getRejectedEnrollment(selectedCourse._id, selectedCourse.title);
                const pending = getPendingEnrollment(selectedCourse._id, selectedCourse.title);
                
                if (isActive) {
                  return (
                    <button 
                      className="m-enroll-btn enrolled" 
                      onClick={() => navigate('/my-learning')}
                    >
                      <FaCheckCircle /> Enrolled
                    </button>
                  );
                } else if (rejected) {
                  return (
                    <button 
                      className="m-enroll-btn rejected" 
                      onClick={() => handleLiveEnrollment(selectedCourse)}
                    >
                      <FaRedo /> Resubmit
                    </button>
                  );
                } else if (pending) {
                  return (
                    <button 
                      className="m-enroll-btn pending" 
                      onClick={() => handleLiveEnrollment(selectedCourse)}
                    >
                      Complete Payment
                    </button>
                  );
                } else {
                  return (
                    <button 
                      className="m-enroll-btn" 
                      onClick={() => setShowModeSelection(true)}
                    >
                      Enroll Now
                    </button>
                  );
                }
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WelcomeNotice studentName={displayFirstName} />

      <AnimatePresence>
        {showProfileSidebar && (
          <>
            <div className="sm-p-sidebar-overlay" onClick={() => setShowProfileSidebar(false)} />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              className="sm-p-sidebar-panel"
            >
              <div className="sm-p-header">
                <button className="sm-p-close" onClick={() => setShowProfileSidebar(false)}><FaTimes /></button>
                <div className="sm-p-avatar-wrapper">
                  <div className="sm-p-avatar" onClick={handleImageClick}>
                    {student?.profileImage ? (
                      <img src={getImageUrl(student.profileImage)} alt="Profile" />
                    ) : (
                      <FaUserGraduate />
                    )}
                  </div>
                  <div className="sm-p-camera-icon" onClick={handleImageClick}>
                    <FaCamera />
                  </div>
                </div>
                <div className="sm-p-user-info">
                  <h2>{fullDisplayName}</h2>
                  <span className="sm-p-badge">SkillsMind Member</span>
                </div>
              </div>

              <div className="sm-p-body">
                <div className="sm-p-info-card">
                  
                  <div className="sm-p-row">
                    <FaPhone />
                    <div>
                      <label>PHONE NUMBER</label>
                      <span>{student?.phone || "Not Set"}</span>
                    </div>
                  </div>
                  <div className="sm-p-row">
                    <FaTransgender />
                    <div>
                      <label>GENDER</label>
                      <span>{student?.gender || "Not Set"}</span>
                    </div>
                  </div>
                  <div className="sm-p-row">
                    <FaMapMarkerAlt />
                    <div>
                      <label>CITY</label>
                      <span>{student?.city || "Not Set"}</span>
                    </div>
                  </div>
                  <div className="sm-p-row">
                    <FaUniversity />
                    <div>
                      <label>INSTITUTE / COLLEGE</label>
                      <span>{student?.institute || "Not Set"}</span>
                    </div>
                  </div>
                  <div className="sm-p-row">
                    <FaGraduationCap />
                    <div>
                      <label>EDUCATION LEVEL</label>
                      <span>{student?.education || "Not Set"}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className="sm-p-edit-btn" 
                  onClick={() => navigate('/build-profile', { state: { isUpdating: true, existingData: student } })}
                >
                  Update Profile
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        :root {
          --sm-red-brand: #dc2626;
          --sm-dark: #0f172a;
          --card-shadow: 0 4px 15px rgba(0,0,0,0.03);
          --card-hover-shadow: 0 15px 40px rgba(15, 23, 42, 0.1);
        }

        .sm-enroll-root { background: #ffffff; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .sm-content-wrapper-fixed { max-width: 1150px; margin: 0 auto; padding: 0 20px; width: 100%; }
        
        .card-meta-v6 span {
          color: #475569 !important;
          font-weight: 600;
        }
        
        .student-name-box .s-tag {
          color: #64748b !important;
          font-size: 11px;
        }

        .sm-p-user-info .sm-p-badge {
          color: #dc2626 !important;
          font-weight: 700;
        }

        .course-detail-banner-compressed { 
          height: 240px; 
          position: relative; 
          background-size: cover; 
          background-position: center; 
          display: flex; 
          align-items: center; 
        }
        .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.7)); }
        .banner-flex { position: relative; z-index: 5; color: #fff; }
        .overlap-container { margin-top: -60px; position: relative; z-index: 10; }

        .bestseller-pill { background: var(--sm-red-brand); color: #fff; padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: 800; }
        .banner-flex h1 { font-size: 32px; font-weight: 900; margin: 10px 0; }
        .banner-meta-row { display: flex; gap: 20px; font-size: 14px; }

        .card-v2 { 
          background: #fff; 
          border-radius: 4px; 
          padding: 25px; 
          border: 1px solid #e2e8f0; 
          margin-bottom: 20px; 
          box-shadow: var(--card-shadow); 
          transition: 0.3s ease;
          position: relative;
        }

        .detail-card-sharp:hover {
          transform: translateY(-5px);
          box-shadow: var(--card-hover-shadow);
          border-left: 5px solid var(--sm-red-brand);
        }

        .card-title-v2 { font-size: 18px; font-weight: 800; color: var(--sm-dark); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }

        .ins-head-v2 { display: flex; gap: 20px; align-items: center; margin-bottom: 15px; }
        .ins-head-v2 img { width: 70px; height: 70px; border-radius: 4px; object-fit: cover; }
        .expert-tag { color: var(--sm-red-brand); font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .ins-meta-v2 h3 { margin: 2px 0; font-size: 20px; color: var(--sm-dark); }
        .ins-meta-v2 p { color: #64748b; font-size: 13px; }
        .ins-bio-v2 p { font-size: 14px; color: #475569; line-height: 1.6; }

        .player-wrapper-v2 video { width: 100%; border-radius: 4px; }
        .no-preview-v2 { background: #f1f5f9; height: 200px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }

        .outcomes-list-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .outcome-item-v2 { display: flex; align-items: center; gap: 10px; font-size: 13px; background: #f8fafc; padding: 10px; border-radius: 4px; }
        .outcome-item-v2 svg { color: #10b981; flex-shrink: 0; }

        .why-grid-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .why-item-v2 { background: #f8fafc; padding: 15px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; }

        .sticky-enroll-v2 { background: #fff; padding: 20px; position: sticky; top: 100px; }
        .side-preview-v2 img { width: 100%; border-radius: 4px; margin-bottom: 15px; }
        .price-tag-v2 { margin-bottom: 20px; }
        .now-v2 { font-size: 28px; font-weight: 900; color: var(--sm-dark); }
        .was-v2 { text-decoration: line-through; color: #94a3b8; margin-left: 10px; font-size: 16px; }
        
        .enroll-btn-v2 { 
          width: 100%; 
          padding: 15px; 
          background: var(--sm-dark); 
          color: #fff; 
          border: none; 
          font-weight: 800; 
          cursor: pointer; 
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .enroll-btn-v2:hover { 
          background: var(--sm-red-brand); 
        }
        
        /* Enrolled State Button - GREEN */
        .enroll-btn-v2.enrolled-btn {
          background: #10b981 !important;
          cursor: default;
        }
        .enroll-btn-v2.enrolled-btn:hover {
          background: #059669 !important;
        }
        
        /* Pending State Button - YELLOW */
        .enroll-btn-v2.pending-btn {
          background: #f59e0b !important;
          animation: pulse 2s infinite;
        }
        .enroll-btn-v2.pending-btn:hover {
          background: #d97706 !important;
        }
        
        /* Rejected State Button - RED */
        .enroll-btn-v2.rejected-btn {
          background: #dc2626 !important;
          animation: shake 0.5s;
        }
        .enroll-btn-v2.rejected-btn:hover {
          background: #b91c1c !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .perks-v2 { display: flex; justify-content: space-between; margin-top: 15px; font-size: 9px; color: #64748b; }

        .quick-grid-v2 { display: flex; gap: 10px; margin-bottom: 15px; }
        .q-item-v2 { background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; }

        .syl-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .syl-dl-btn-v2 { border: none; background: #f1f5f9; padding: 8px; border-radius: 4px; cursor: pointer; }
        .accordion-item-v2 { border: 1px solid #f1f5f9; margin-bottom: 5px; border-radius: 4px; }
        .accordion-head-v2 { padding: 15px; cursor: pointer; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
        .accordion-body-v2 { padding: 15px; background: #fcfcfc; border-top: 1px solid #f1f5f9; }

        .detail-grid-v2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }

        @media (max-width: 950px) {
            .detail-grid-v2 { grid-template-columns: 1fr; }
            .overlap-container { margin-top: 0; }
            .course-detail-banner-compressed { height: 200px; }
        }

        .mobile-search-overlay-sm {
          background: rgba(255, 255, 255, 0.98); 
          backdrop-filter: blur(10px);
          padding: 8px 15px;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
          border-bottom: 1px solid #f1f5f9;
        }

        .mobile-search-box-sm {
          display: flex;
          align-items: center;
          background: #f8fafc;
          height: 40px;
          padding: 0 15px;
          border-radius: 6px;
          gap: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .mobile-search-box-sm:focus-within {
          background: #ffffff;
          border-color: var(--sm-red-brand);
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.05);
        }

        .mobile-search-box-sm input {
          border: none;
          background: transparent;
          width: 100%;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--sm-dark);
        }

        .mobile-search-box-sm .search-icon-sm {
          color: #64748b;
          font-size: 14px;
        }

        .close-search-sm {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 5px;
          font-size: 14px;
        }

        .close-search-sm:hover {
          color: var(--sm-red-brand);
        }

        @media (min-width: 951px) {
          .mobile-search-overlay-sm { display: none; }
        }

        /* Badges */
        .pending-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #f59e0b;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }
        
        .enrolled-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #10b981;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        /* Rejected Badge - RED */
        .rejected-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #dc2626;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
          animation: pulse-red 2s infinite;
        }
        
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5); }
        }

        /* Button States */
        .btn-v6-enroll.active-enrolled {
          background: #10b981 !important;
          cursor: default;
        }
        
        .btn-v6-enroll.pending-payment {
          background: #f59e0b !important;
          animation: pulse 2s infinite;
        }
        
        .btn-v6-enroll.rejected-btn {
          background: #dc2626 !important;
        }
        
        .m-enroll-btn.enrolled {
          background: #10b981 !important;
        }
        
        .m-enroll-btn.pending {
          background: #f59e0b !important;
          animation: pulse 2s infinite;
        }
        
        .m-enroll-btn.rejected {
          background: #dc2626 !important;
        }
      `}</style>
    </div>
  );
};

export default GetEnrollment;