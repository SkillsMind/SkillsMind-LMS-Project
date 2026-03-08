import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClock, FaSignal, FaUserTie, FaTimes, FaUserGraduate,
  FaSearch, FaSignOutAlt, FaChevronRight, FaMapMarkerAlt,
  FaBook, FaBullseye, FaUniversity, FaCamera, FaArrowLeft,
  FaHome, FaStar, FaUsers, FaPlayCircle, FaCheckCircle, FaChevronDown,
  FaGlobe, FaUserCheck, FaLayerGroup, FaDownload, FaChalkboardTeacher, FaLightbulb,
  FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp, FaInstagram, FaYoutube, FaCertificate, FaInfinity, FaMobileAlt,
  FaAward, FaRocket, FaShieldAlt, FaVideo, FaMicrophone, FaEnvelope, FaPhone, FaTransgender, FaGraduationCap
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
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
  
  // NEW: Class Mode Selection State
  const [showModeSelection, setShowModeSelection] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { profile, loading: profileLoading } = useProfile();
  
  const userId = localStorage.getItem('userId');
  const storedName = localStorage.getItem('userName') || "Student";
  const backendURL = "http://localhost:5000";

  const student = profile;

  // --- Dynamic Learning Points Logic (Based on Course Title) ---
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
    // Default points
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

  // --- PDF Generation Helper Functions ---
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

    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.setFont(undefined, 'bold');
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.text("SKILLSMIND", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();

    // Header Info
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

    // Syllabus Items
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

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("© 2026 SkillsMind Learning Management System - All Rights Reserved", pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`${selectedCourse.title}_Syllabus_SkillsMind.pdf`);
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/courses/all`);
      setCourses(res.data);
    } catch (err) {
      console.error("SkillsMind Error:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [userId]);

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
        // Profile context will auto-update, no need to manually fetch
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

  const filtered = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    c.isHide !== true && 
    c.isHide !== "true"
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

  const handleEnroll = (courseId) => {
    navigate(`/payment-method/${courseId}`);
  };

  return (
    <div className="sm-enroll-root">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        accept="image/*"
      />

      {/* TOP NAVIGATION BAR */}
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
            <button className="my-learning-badge" onClick={() => navigate('/dashboard')}>
              <FaUserGraduate /> <span>My Learning</span>
            </button>
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

      {/* SECONDARY ACTION BAR (SUB-NAV) */}
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

      {/* MOBILE SEARCH BAR - REAL TIME FOR SKILLSMIND */}
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
            {/* HERO WELCOME SECTION */}
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
                  {filtered.map((course) => (
                    <div key={course._id} className="decent-card">
                      <div className="card-media-v6">
                        <img src={getImageUrl(course.thumbnail)} alt={course.title} />
                        <div className="elite-badge">{course.badge || 'PREMIUM'}</div>
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
                          <button className="btn-v6-enroll" onClick={() => {
                            setSelectedCourse(course);
                            setViewMode('details');
                            setShowModeSelection(true);
                            window.scrollTo(0,0);
                          }}>Enroll <FaChevronRight /></button>
                        </div>
                      </div>
                    </div>
                  ))}
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
            
            {/* Mode Selection Modal Overlay */}
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
                        
                        {/* LIVE CARD */}
                        <div className="sm-pro-card live" 
                             onClick={() => navigate('/payment-method/' + selectedCourse._id, { 
                                 state: { 
                                     course: selectedCourse,
                                     mode: 'live',
                                     enrollmentData: {
                                         fullName: student?.name || storedName,
                                         email: student?.email || '',
                                         cnic: student?.cnic || ''
                                     }
                                 } 
                             })}>
                          <div className="sm-pro-badge">Popular</div>
                          <div className="sm-pro-icon-box"><FaChalkboardTeacher /></div>
                          <div className="sm-pro-info">
                            <h4>Live Class</h4>
                            <p>Real-time interaction</p>
                          </div>
                          <div className="sm-pro-action"><FaChevronRight /></div>
                        </div>

                        {/* RECORDED CARD */}
                        <div className="sm-pro-card recorded" 
                             onClick={() => navigate('/payment-method/' + selectedCourse._id, { 
                                 state: { 
                                     course: selectedCourse,
                                     mode: 'recorded',
                                     enrollmentData: {
                                         fullName: student?.name || storedName,
                                         email: student?.email || '',
                                         cnic: student?.cnic || ''
                                     }
                                 } 
                             })}>
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

            {/* UPGRADED: COMPRESSED BANNER */}
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

            {/* UPGRADED: Main Details Grid with OVERLAP */}
            <div className="sm-content-wrapper-fixed detail-grid-v2 overlap-container">
                
                {/* Left Side Content Stack */}
                <div className="left-stack-v2">
                    
                    {/* UPGRADED: Professional Instructor Card - REAL FETCHED DATA */}
                    <div className="card-v2 instructor-profile-v2 detail-card-sharp">
                        <div className="ins-head-v2">
                            <img 
                              src={getImageUrl(selectedCourse.instructor?.profilePic)} 
                              alt="Mentor" 
                              onError={(e)=>e.target.src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png "}
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

                    {/* Preview Video Player Card */}
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

                    {/* Learning Outcomes Card */}
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

                    {/* Why This Course Section */}
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

                {/* Right Side Sticky Sidebar */}
                <div className="right-stack-v2">
                    <div className="sticky-enroll-v2 detail-card-sharp">
                        <div className="side-preview-v2">
                            <img src={getImageUrl(selectedCourse.thumbnail)} alt="Course" />
                        </div>
                        <div className="price-tag-v2">
                            <span className="now-v2">Rs. {selectedCourse.price}</span>
                            <span className="was-v2">Rs. {Math.round(selectedCourse.price * 1.5)}</span>
                        </div>
                        <button className="enroll-btn-v2" onClick={() => setShowModeSelection(true)}>
                            Enroll Now <FaChevronRight />
                        </button>
                        <div className="perks-v2">
                            <div><FaInfinity/> Lifetime</div>
                            <div><FaCertificate/> Verified</div>
                            <div><FaMobileAlt/> Mobile Friendly</div>
                        </div>
                    </div>

                    {/* Compact Overview Card */}
                    <div className="card-v2 overview-v2 detail-card-sharp">
                         <h4 className="card-title-v2"><FaBook color="#dc2626"/> Summary</h4>
                         <div className="quick-grid-v2">
                            <div className="q-item-v2"><FaClock/> <span>{selectedCourse.duration || "3 Months"}</span></div>
                            <div className="q-item-v2"><FaSignal/> <span>{selectedCourse.level || "Intermediate"}</span></div>
                         </div>
                         <p className="overview-text-v2">{selectedCourse.description}</p>
                    </div>

                    {/* Compact Curriculum Accordion */}
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
                                        <span>Week {item.week}: {item.mainTopic}</span>
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

            {/* Mobile View Sticky Action Bar */}
            <div className="mobile-sticky-action-bar">
              <div className="m-price-box">
                <span className="m-price">Rs. {selectedCourse.price}</span>
                <span className="m-old-price">Rs. {Math.round(selectedCourse.price * 1.5)}</span>
              </div>
              <button className="m-enroll-btn" onClick={() => setShowModeSelection(true)}>Enroll Now</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WelcomeNotice studentName={displayFirstName} />

      {/* Profile Sidebar Panel */}
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

        .sm-enroll-root { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .sm-content-wrapper-fixed { max-width: 1150px; margin: 0 auto; padding: 0 20px; width: 100%; }
        
        /* FIX: White Text Visibility in Card Meta & Profile */
        .card-meta-v6 span {
          color: #475569 !important; /* Dark Grey color for duration and level */
          font-weight: 600;
        }
        
        .student-name-box .s-tag {
          color: #64748b !important; /* Visible color for member tag in navbar */
          font-size: 11px;
        }

        .sm-p-user-info .sm-p-badge {
          color: #dc2626 !important; /* SkillsMind Red color for sidebar badge */
          font-weight: 700;
        }

        /* UPGRADED: COMPRESSED BANNER & OVERLAP */
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

        /* UPGRADED: SHARP UNIQUE CARD DESIGN */
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

        /* Instructor Profiles */
        .ins-head-v2 { display: flex; gap: 20px; align-items: center; margin-bottom: 15px; }
        .ins-head-v2 img { width: 70px; height: 70px; border-radius: 4px; object-fit: cover; }
        .expert-tag { color: var(--sm-red-brand); font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .ins-meta-v2 h3 { margin: 2px 0; font-size: 20px; color: var(--sm-dark); }
        .ins-meta-v2 p { color: #64748b; font-size: 13px; }
        .ins-bio-v2 p { font-size: 14px; color: #475569; line-height: 1.6; }

        /* Video Player */
        .player-wrapper-v2 video { width: 100%; border-radius: 4px; }
        .no-preview-v2 { background: #f1f5f9; height: 200px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }

        /* Outcomes */
        .outcomes-list-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .outcome-item-v2 { display: flex; align-items: center; gap: 10px; font-size: 13px; background: #f8fafc; padding: 10px; border-radius: 4px; }
        .outcome-item-v2 svg { color: #10b981; flex-shrink: 0; }

        /* Why Join */
        .why-grid-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .why-item-v2 { background: #f8fafc; padding: 15px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; }

        /* Sidebar Enroll Box */
        .sticky-enroll-v2 { background: #fff; padding: 20px; position: sticky; top: 100px; }
        .side-preview-v2 img { width: 100%; border-radius: 4px; margin-bottom: 15px; }
        .price-tag-v2 { margin-bottom: 20px; }
        .now-v2 { font-size: 28px; font-weight: 900; color: var(--sm-dark); }
        .was-v2 { text-decoration: line-through; color: #94a3b8; margin-left: 10px; font-size: 16px; }
        .enroll-btn-v2 { width: 100%; padding: 15px; background: var(--sm-dark); color: #fff; border: none; font-weight: 800; cursor: pointer; border-radius: 4px; }
        .enroll-btn-v2:hover { background: var(--sm-red-brand); }
        .perks-v2 { display: flex; justify-content: space-between; margin-top: 15px; font-size: 9px; color: #64748b; }

        /* Compact Overview */
        .quick-grid-v2 { display: flex; gap: 10px; margin-bottom: 15px; }
        .q-item-v2 { background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; }

        /* Compact Syllabus */
        .syl-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .syl-dl-btn-v2 { border: none; background: #f1f5f9; padding: 8px; border-radius: 4px; cursor: pointer; }
        .accordion-item-v2 { border: 1px solid #f1f5f9; margin-bottom: 5px; border-radius: 4px; }
        .accordion-head-v2 { padding: 15px; cursor: pointer; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
        .accordion-body-v2 { padding: 15px; background: #fcfcfc; border-top: 1px solid #f1f5f9; }

        /* Layout Grid */
        .detail-grid-v2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }

        @media (max-width: 950px) {
            .detail-grid-v2 { grid-template-columns: 1fr; }
            .overlap-container { margin-top: 0; }
            .course-detail-banner-compressed { height: 200px; }
        }
            /* COMPRESSED SHARP SEARCH BAR FOR SKILLSMIND */
        .mobile-search-overlay-sm {
          background: rgba(255, 255, 255, 0.98); 
          backdrop-filter: blur(10px);
          padding: 8px 15px; /* Height kam karne ke liye padding mazeed kam kar di */
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
          height: 40px; /* Fixed height for compressed look */
          padding: 0 15px;
          border-radius: 6px; /* Sleek sharp edges */
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
          font-size: 14px; /* Text thora chota kiya compress look ke liye */
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
      `}</style>
    </div>
  );
};

export default GetEnrollment;