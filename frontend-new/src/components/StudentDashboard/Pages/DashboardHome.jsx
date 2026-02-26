import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calendar, CheckCircle, Clock, Award, TrendingUp, 
  Bell, FileText, Edit3, Users, ClipboardList, Target, 
  BarChart3, ChevronRight, User, LogOut, Settings,
  Megaphone, Link, Briefcase, Play, AlertCircle, Loader2
} from 'lucide-react';
import './DashboardHome.css';

const API_URL = 'http://localhost:5000/api';

const DashboardHome = ({ onNavigate, showBackButton }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    const interval = setInterval(loadDashboardData, 300000);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      let user = null;
      try {
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
          user = JSON.parse(userStr);
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }

      if (!token || !user?.id) {
        console.log('⚠️ No auth data found, loading demo mode');
        loadDemoData();
        setIsDemoMode(true);
        return;
      }

      setIsDemoMode(false);
      console.log('✅ Authenticated user found:', user.id);

      const response = await fetch(`${API_URL}/student-dashboard/overview/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('❌ Token expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        loadDemoData();
        setIsDemoMode(true);
        setError('Session expired. Please login again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      console.log('✅ Real data loaded successfully');
      setData(result);
      
      localStorage.setItem('dashboardCache', JSON.stringify(result));
      
    } catch (err) {
      console.error('❌ Dashboard Error:', err);
      setError(err.message);
      
      const cached = localStorage.getItem('dashboardCache');
      if (cached) {
        console.log('📦 Using cached data');
        setData(JSON.parse(cached));
      } else {
        loadDemoData();
        setIsDemoMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    const demoData = {
      student: {
        id: 'demo123',
        name: 'Demo Student',
        email: 'demo@skillsmind.pk',
        avatar: null,
        studentId: 'SM-2024-DEMO',
        location: 'Karachi, Pakistan'
      },
      currentCourse: {
        id: 1,
        name: 'Shopify Mastery (Demo)',
        instructor: 'Sarah Ahmed',
        progress: 65,
        totalLessons: 24,
        completedLessons: 16,
        nextClass: 'Tomorrow, 2:00 PM',
        enrollmentType: 'live',
        thumbnail: null,
        meetingLink: 'https://zoom.us/j/123456789 '
      },
      stats: {
        attendance: 92,
        assignmentsPending: 2,
        quizzesCompleted: 8,
        overallGrade: 'A-',
        overallPercentage: 85,
        totalCourses: 1,
        completedCourses: 0
      },
      quickAccess: {
        pendingAssignments: [
          { id: 1, title: 'Store Setup Assignment', dueDate: new Date(Date.now() + 86400000), totalMarks: 100 },
          { id: 2, title: 'Product Listing Project', dueDate: new Date(Date.now() + 172800000), totalMarks: 50 }
        ],
        upcomingQuizzes: []
      },
      announcements: [
        { id: 1, title: 'Welcome to SkillsMind', content: 'Start your learning journey today...', priority: 'high', category: 'general', isNew: true, createdAt: new Date() },
        { id: 2, title: 'New Batch Starting', content: 'Enroll now for the upcoming batch...', priority: 'medium', category: 'event', isNew: true, createdAt: new Date() }
      ],
      opportunities: [
        { id: 1, title: 'E-commerce Specialist', company: 'Tech Solutions', type: 'full-time', location: 'Remote' },
        { id: 2, title: 'Digital Marketing Intern', company: 'Creative Agency', type: 'internship', location: 'Karachi' }
      ],
      importantLinks: [
        { id: 1, title: 'Shopify Documentation', url: 'https://help.shopify.com ', category: 'documentation' },
        { id: 2, title: 'Course Resources', url: '#', category: 'reference' }
      ],
      weeklySchedule: [
        { id: 1, title: 'Live Class: Store Setup', courseName: 'Shopify Mastery', recurring: { startTime: '2:00 PM', days: ['monday', 'wednesday'] }, meetingLink: 'https://zoom.us/j/123456789 ', isToday: true }
      ],
      notifications: [
        { id: 1, title: 'Welcome!', message: 'Complete your profile setup', type: 'system' }
      ]
    };

    setData(demoData);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('studentProfileId');
    localStorage.removeItem('dashboardCache');
    window.location.href = '/login';
  };

  const handleNavigate = (page) => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="skillsmind-loader">
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const { student, currentCourse, stats, quickAccess, announcements, opportunities, importantLinks, weeklySchedule, notifications } = data;

  return (
    <div className="skillsmind-dashboard">
      
      {/* STATIC HEADER - 100px height */}
      <header className="student-top-header">
        <div className="header-section left">
          <img 
            src="/Skills-Mind-Logo.png" 
            alt="SkillsMind" 
            className="header-logo-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iNTAiIGZpbGw9IiMwMDBCMjkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC13ZWlnaHQ9ImJvbGQiPlNraWxsc01pbmQ8L3RleHQ+PC9zdmc+';
            }}
          />
        </div>
        
        <div className="header-section center">
          <h1>Student Dashboard</h1>
        </div>
        
        <div className="header-section right">
          {/* Notification */}
          <div className="header-action" ref={notifRef}>
            <button 
              className="header-icon-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
              }}
            >
              <Bell size={20} />
              {notifications?.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </button>
            
            {showNotifications && (
              <div className="header-dropdown-menu">
                <div className="dropdown-header">
                  <span>Notifications</span>
                  <button onClick={() => setShowNotifications(false)}>×</button>
                </div>
                <div className="dropdown-body">
                  {notifications?.length === 0 ? (
                    <p className="no-items">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="dropdown-item">
                        <div className="item-title">{n.title}</div>
                        <div className="item-desc">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="header-action" ref={profileRef}>
            <button 
              className="header-icon-btn profile"
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
            >
              {student?.avatar ? (
                <img src={`http://localhost:5000/${student.avatar}`} alt={student?.name} />
              ) : (
                <User size={20} />
              )}
            </button>
            
            {showProfileDropdown && (
              <div className="header-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="user-avatar">
                    {student?.avatar ? (
                      <img src={`http://localhost:5000/${student.avatar}`} alt={student?.name} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{student?.name || 'Student'}</div>
                    <div className="user-email">{student?.email || ''}</div>
                    {isDemoMode && <span className="demo-badge">Demo Mode</span>}
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item-btn" onClick={() => { handleNavigate('profile'); setShowProfileDropdown(false); }}>
                  <User size={16} /> My Profile
                </button>
                <button className="dropdown-item-btn" onClick={() => { handleNavigate('settings'); setShowProfileDropdown(false); }}>
                  <Settings size={16} /> Settings
                </button>
                <div className="dropdown-divider"></div>
                {isDemoMode ? (
                  <button className="dropdown-item-btn login" onClick={() => window.location.href = '/login'}>
                    <LogOut size={16} /> Login
                  </button>
                ) : (
                  <button className="dropdown-item-btn logout" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="demo-banner">
          <span>⚠️ Demo Mode: Login to see your real data</span>
          <div>
            <button onClick={refreshData} className="demo-btn retry">Retry</button>
            <button onClick={() => window.location.href = '/login'} className="demo-btn login">Login Now</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-dashboard-content">
        
        {/* Current Course Banner */}
        {currentCourse ? (
          <section className="current-course-banner">
            <div className="course-content">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div className="course-tag">CURRENT COURSE</div>
                {currentCourse.enrollmentType === 'live' && (
                  <div className="course-tag" style={{ background: 'var(--accent)' }}>LIVE CLASS</div>
                )}
              </div>
              <h1>{currentCourse.name}</h1>
              <div className="course-details">
                <span><User size={14} /> {currentCourse.instructor}</span>
                <span><BookOpen size={14} /> {currentCourse.completedLessons}/{currentCourse.totalLessons} Lessons</span>
                <span><Clock size={14} /> {currentCourse.nextClass}</span>
              </div>
              <div className="progress-container">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${currentCourse.progress}%` }}></div>
                </div>
                <span className="progress-text">{currentCourse.progress}% Complete</span>
              </div>
              <button className="continue-learning-btn" onClick={() => handleNavigate('course-content')}>
                Continue Learning <ChevronRight size={16} />
              </button>
            </div>
            <div className="course-icon-bg">
              <BookOpen size={80} />
            </div>
          </section>
        ) : (
          <section className="current-course-banner">
            <div className="course-content">
              <h1>Welcome to SkillsMind!</h1>
              <p>Enroll in a course to get started</p>
              <button className="continue-learning-btn" onClick={() => handleNavigate('courses')}>
                Browse Courses <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* Rest of your dashboard content... */}
        {/* Stats Grid */}
        <section className="student-record-section">
          <div className="section-title-bar">
            <h3>Student Record</h3>
            <span className="live-indicator">● {isDemoMode ? 'Demo Mode' : 'Live Updates'}</span>
          </div>
          
          <div className="record-cards-grid">
            <div className="record-card" onClick={() => handleNavigate('attendance')}>
              <div className="record-icon blue"><Users size={24} /></div>
              <div className="record-info">
                <h4>{stats?.attendance || 0}%</h4>
                <p>Attendance Rate</p>
                <span className="record-trend up">{stats?.attendance >= 90 ? 'Excellent!' : 'Good'}</span>
              </div>
            </div>

            <div className="record-card" onClick={() => handleNavigate('assignments')}>
              <div className="record-icon orange"><ClipboardList size={24} /></div>
              <div className="record-info">
                <h4>{stats?.assignmentsPending || 0}</h4>
                <p>Pending Assignments</p>
                <span className="record-trend warning">{stats?.assignmentsPending > 0 ? 'Due soon' : 'All done'}</span>
              </div>
            </div>

            <div className="record-card" onClick={() => handleNavigate('quizzes')}>
              <div className="record-icon purple"><Target size={24} /></div>
              <div className="record-info">
                <h4>{stats?.quizzesCompleted || 0}</h4>
                <p>Quizzes Completed</p>
                <span className="record-trend up">Keep going!</span>
              </div>
            </div>

            <div className="record-card grade-card" onClick={() => handleNavigate('results')}>
              <div className="record-icon gold"><Award size={24} /></div>
              <div className="record-info">
                <h4 className="grade-text">{stats?.overallGrade || 'N/A'}</h4>
                <p>Overall Grade</p>
                <span className="record-trend success">{stats?.overallPercentage >= 80 ? 'Excellent!' : 'Good'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="dashboard-grid">
          
          {/* Left Side */}
          <div className="grid-left">
            <section className="quick-tools-section">
              <div className="section-title-bar">
                <h3>Quick Access</h3>
                <button className="view-all-btn">View All</button>
              </div>
              
              <div className="tools-grid">
                {[
                  { icon: Calendar, label: 'Schedule', color: 'blue', page: 'schedule' },
                  { icon: FileText, label: 'Assignments', color: 'yellow', page: 'assignments', badge: quickAccess?.pendingAssignments?.length },
                  { icon: Target, label: 'Quizzes', color: 'purple', page: 'quizzes' },
                  { icon: Edit3, label: 'Notebook', color: 'green', page: 'notebook' },
                  { icon: CheckCircle, label: 'Attendance', color: 'cyan', page: 'attendance' },
                  { icon: BarChart3, label: 'Results', color: 'orange', page: 'results' },
                  { icon: TrendingUp, label: 'Progress', color: 'pink', page: 'progress' },
                  { icon: BookOpen, label: 'Resources', color: 'red', page: 'resources' }
                ].map((tool, idx) => (
                  <button key={idx} className="tool-card" onClick={() => handleNavigate(tool.page)} style={{ position: 'relative' }}>
                    <div className={`tool-icon ${tool.color}`}><tool.icon size={22} /></div>
                    <span>{tool.label}</span>
                    {tool.badge > 0 && (
                      <span style={{
                        position: 'absolute', top: '5px', right: '5px',
                        background: 'var(--accent)', color: 'white',
                        borderRadius: '50%', width: '20px', height: '20px',
                        fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{tool.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Pending Assignments */}
            {quickAccess?.pendingAssignments?.length > 0 && (
              <section className="quick-tools-section" style={{ marginTop: '24px' }}>
                <div className="section-title-bar">
                  <h3>Due Soon</h3>
                </div>
                <div className="notice-items">
                  {quickAccess.pendingAssignments.map(a => (
                    <div key={a.id} className="notice-row" onClick={() => handleNavigate(`assignment/${a.id}`)}>
                      <div className="notice-icon red"><FileText size={20} /></div>
                      <div className="notice-text">
                        <h4>{a.title}</h4>
                        <p>Due: {new Date(a.dueDate).toLocaleDateString()} • {a.totalMarks} marks</p>
                      </div>
                      <ChevronRight size={18} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Side */}
          <div className="grid-right">
            
          {/* Announcements - CLICKABLE NOW */}
  <section className="notice-board" style={{ cursor: 'pointer' }} onClick={() => handleNavigate('notices')}>
    <div className="section-title-bar">
      <h3>Notice Board</h3>
      <span className="new-badge">{announcements?.filter(a => a.isNew).length || 0} New</span>
    </div>
    
    <div className="notice-items">
      {announcements?.slice(0, 3).map(a => (
        <div key={a.id} className="notice-row">
          <div className={`notice-icon ${a.priority === 'high' ? 'red' : 'blue'}`}>
            <Megaphone size={20} />
          </div>
          <div className="notice-text">
            <h4>{a.title}</h4>
            <p>{a.content?.substring(0, 40)}...</p>
            {a.isNew && <span style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: 'bold' }}> NEW</span>}
          </div>
          <ChevronRight size={18} />
        </div>
      ))}
    </div>
  </section>

            {/* Important Links - CLICKABLE NOW */}
  <section className="notice-board" style={{ marginBottom: '20px', cursor: 'pointer' }} onClick={() => handleNavigate('important-links')}>
    <div className="section-title-bar">
      <h3>Important Links</h3>
    </div>
    <div className="notice-items">
      {importantLinks?.slice(0, 3).map(l => (
        <div key={l.id} className="notice-row">
          <div className="notice-icon blue"><Link size={20} /></div>
          <div className="notice-text">
            <h4>{l.title}</h4>
            <p>{l.category}</p>
          </div>
          <ChevronRight size={18} />
        </div>
      ))}
    </div>
  </section>


            {/* Jobs & Internships Card - NEW */}
            <section className="notice-board" style={{ marginBottom: '20px' }}>
              <div className="section-title-bar">
                <h3>Jobs & Internships</h3>
                <span className="new-badge" style={{ background: 'var(--green)' }}>{opportunities?.length || 0} Open</span>
              </div>
              <div className="notice-items">
                {opportunities && opportunities.length > 0 ? (
                  opportunities.slice(0, 3).map(job => (
                    <button 
                      key={job.id} 
                      className="notice-row" 
                      onClick={() => handleNavigate('opportunities')}
                    >
                      <div className="notice-icon green"><Briefcase size={20} /></div>
                      <div className="notice-text">
                        <h4>{job.title}</h4>
                        <p>{job.company} • {job.type}</p>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))
                ) : (
                  <div className="notice-row" onClick={() => handleNavigate('opportunities')}>
                    <div className="notice-icon green"><Briefcase size={20} /></div>
                    <div className="notice-text">
                      <h4>View All Opportunities</h4>
                      <p>Click to see available jobs</p>
                    </div>
                    <ChevronRight size={18} />
                  </div>
                )}
              </div>
            </section>

            {/* Schedule */}
            <section className="calendar-widget-section">
              <div className="section-title-bar">
                <h3>This Week</h3>
                <button className="view-all-btn">Full Calendar</button>
              </div>
              
              <div className="calendar-box">
                <div className="week-days-row">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                    <div key={idx} className={`day-cell ${idx === 2 ? 'active' : ''} ${idx === 2 || idx === 3 ? 'has-event' : ''}`}>
                      <span className="day-label">{day}</span>
                      <span className="day-num">{idx + 1}</span>
                      {(idx === 2 || idx === 3) && <div className="event-dot"></div>}
                    </div>
                  ))}
                </div>
                
                <div className="events-list">
                  {weeklySchedule?.slice(0, 2).map(s => (
                    <div key={s.id} className="event-row">
                      <div className="event-time">
                        <span className="time">{s.recurring?.startTime || '2:00 PM'}</span>
                        <span className="label">{s.isToday ? 'TODAY' : 'UPCOMING'}</span>
                      </div>
                      <div className="event-info">
                        <h4>{s.title}</h4>
                        <p>{s.courseName}</p>
                      </div>
                      {s.meetingLink && (
                        <button className="join-class-btn" onClick={() => window.open(s.meetingLink, '_blank')}>
                          <Play size={12} /> Join
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardHome;