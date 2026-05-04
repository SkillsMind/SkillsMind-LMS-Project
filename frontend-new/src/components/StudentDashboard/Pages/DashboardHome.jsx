import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calendar, CheckCircle, Clock, Award, TrendingUp, 
  Bell, FileText, Edit3, Users, ClipboardList, Target, 
  BarChart3, ChevronRight, User, LogOut, Settings,
  Megaphone, Link, Briefcase, Play, AlertCircle, Loader2,
  ChevronDown, School, GraduationCap, ChevronLeft, Download,
  MessageCircle, HelpCircle, Camera, Coffee, Gift, Star,
  Sun, Moon, Wifi, Battery, Volume2, Map, FolderOpen
} from 'lucide-react';
import './DashboardHome.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const DashboardHome = ({ onNavigate, showBackButton }) => {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // 🔥 Helping Materials unseen count
  const [unseenMaterialsCount, setUnseenMaterialsCount] = useState(0);
  const [helpingMaterials, setHelpingMaterials] = useState([]);
  
  // REAL-TIME CALENDAR & CLOCK STATE
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [weekDays, setWeekDays] = useState([]);
  const [greeting, setGreeting] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // REAL-TIME CLOCK AND CALENDAR (Pakistan Time)
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const pakistanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
      
      const timeString = pakistanTime.toLocaleTimeString('en-PK', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      
      const dateString = pakistanTime.toLocaleDateString('en-PK', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      
      const hour = pakistanTime.getHours();
      if (hour < 12) setGreeting('Good Morning 🌅');
      else if (hour < 17) setGreeting('Good Afternoon ☀️');
      else if (hour < 20) setGreeting('Good Evening 🌤️');
      else setGreeting('Good Night 🌙');
      
      setCurrentTimeFormatted(timeString);
      setCurrentDateFormatted(dateString);
      setCurrentDateTime(pakistanTime);
      generateWeekDays(pakistanTime);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateWeekDays = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        name: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i],
        date: day.getDate(),
        fullDate: day,
        isToday: day.toDateString() === date.toDateString(),
        hasEvent: i === 2 || i === 3
      });
    }
    setWeekDays(days);
  };

  // CHECK LOGIN STATUS - REDIRECT IF NOT LOGGED IN
  useEffect(() => {
    const checkAuth = () => {
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
        console.log('⚠️ No auth data found, redirecting to login...');
        window.location.href = '/login';
        return false;
      }
      
      return true;
    };
    
    const isAuthenticated = checkAuth();
    if (isAuthenticated) {
      loadDashboardData();
      fetchHelpingMaterials();
    }
    
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    const interval = setInterval(loadDashboardData, 300000);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  // 🔥 Fetch Helping Materials and track unseen
  const fetchHelpingMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/helping-materials/student/my-materials`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const materials = result.data || [];
          setHelpingMaterials(materials);
          
          // Get viewed materials from localStorage
          const viewedMaterials = JSON.parse(localStorage.getItem('viewedHelpingMaterials') || '[]');
          const unseenCount = materials.filter(m => !viewedMaterials.includes(m._id)).length;
          setUnseenMaterialsCount(unseenCount);
        }
      }
    } catch (err) {
      console.error('Error fetching helping materials:', err);
    }
  };

  // 🔥 Mark material as viewed when clicked
  const markMaterialAsViewed = (materialId) => {
    const viewedMaterials = JSON.parse(localStorage.getItem('viewedHelpingMaterials') || '[]');
    if (!viewedMaterials.includes(materialId)) {
      viewedMaterials.push(materialId);
      localStorage.setItem('viewedHelpingMaterials', JSON.stringify(viewedMaterials));
      setUnseenMaterialsCount(prev => Math.max(0, prev - 1));
    }
  };

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
        window.location.href = '/login';
        return;
      }

      console.log('✅ Authenticated user found:', user.id);

      const response = await fetch(`${API_URL}/student-dashboard/overview`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        console.error('❌ Token expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentEmail');
        localStorage.removeItem('studentProfileId');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      console.log('✅ Real data loaded successfully:', result);
      setData(result);
      setCourses(result.courses || []);
      localStorage.setItem('dashboardCache', JSON.stringify(result));
      
    } catch (err) {
      console.error('❌ Dashboard Error:', err);
      setError(err.message);
      
      const cached = localStorage.getItem('dashboardCache');
      if (cached) {
        console.log('📦 Using cached data');
        const cachedData = JSON.parse(cached);
        setData(cachedData);
        setCourses(cachedData.courses || []);
      } else {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
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

  // 🔥 UPDATED NAVIGATION FUNCTION - With Helping Materials
  const handleNavigate = (page, materialId = null) => {
    console.log('Navigating to:', page);
    
    if (page === 'helping-materials') {
      if (onNavigate) onNavigate('helping-materials');
      return;
    }
    
    if (page === 'study-break') {
      if (onNavigate) onNavigate('study-break');
      return;
    }
    if (page === 'daily-goal') {
      if (onNavigate) onNavigate('daily-goal');
      return;
    }
    if (page === 'refer-friend') {
      if (onNavigate) onNavigate('refer-friend');
      return;
    }
    
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // 🔥 Handle Helping Material Card Click
  const handleHelpingMaterialClick = () => {
    // Mark all current materials as viewed
    helpingMaterials.forEach(m => markMaterialAsViewed(m._id));
    handleNavigate('helping-materials');
  };

  const refreshData = () => {
    loadDashboardData();
    fetchHelpingMaterials();
  };

  // 🔥 UPDATED QUICK TIPS - Helping Materials instead of Learning Path
  const quickTips = [
    { icon: Coffee, title: 'Study Break', desc: 'Take 5-min break every hour', color: '#F59E0B', action: 'study-break' },
    { icon: Star, title: 'Daily Goal', desc: 'Complete 1 lesson today', color: '#10B981', action: 'daily-goal' },
    { icon: FolderOpen, title: 'Helping Materials', desc: `${unseenMaterialsCount} new materials available`, color: '#8B5CF6', action: 'helping-materials', badge: unseenMaterialsCount },
    { icon: Gift, title: 'Refer a Friend', desc: 'Get 25% off next course', color: '#EF4444', action: 'refer-friend' }
  ];

  // SHOW LOADER WHILE CHECKING AUTH
  if (loading) {
    return (
      <div className="skillsmind-loader">
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="skillsmind-loader">
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const { student, stats, quickAccess, announcements, opportunities, importantLinks, weeklySchedule, notifications } = data;

  return (
    <div className="skillsmind-dashboard">
      
      {/* STATIC HEADER */}
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
            <button className="header-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); }}>
              <Bell size={20} />
              {notifications?.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="header-dropdown-menu">
                <div className="dropdown-header"><span>Notifications</span><button onClick={() => setShowNotifications(false)}>×</button></div>
                <div className="dropdown-body">
                  {notifications?.length === 0 ? <p className="no-items">No new notifications</p> : 
                    notifications.map(n => (
                      <div key={n.id} className="dropdown-item">
                        <div className="item-title">{n.title}</div>
                        <div className="item-desc">{n.message}</div>
                        <div className="item-time">{n.time}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="header-action" ref={profileRef}>
            <button className="header-icon-btn profile" onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}>
              {student?.avatar ? <img src={`${import.meta.env.VITE_API_URL}/${student.avatar}`} alt={student?.name} /> : <User size={20} />}
            </button>
            {showProfileDropdown && (
              <div className="header-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="user-avatar">{student?.avatar ? <img src={`${import.meta.env.VITE_API_URL}/${student.avatar}`} alt={student?.name} /> : <User size={24} />}</div>
                  <div className="user-details">
                    <div className="user-name">{student?.name || 'Student'}</div>
                    <div className="user-email">{student?.email || ''}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item-btn" onClick={() => { handleNavigate('profile'); setShowProfileDropdown(false); }}><User size={16} /> My Profile</button>
                <button className="dropdown-item-btn" onClick={() => { handleNavigate('settings'); setShowProfileDropdown(false); }}><Settings size={16} /> Settings</button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item-btn logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* REAL-TIME DATE & TIME BAR */}
      <div className="realtime-datetime-bar">
        <div className="datetime-left"><Clock size={18} /><span className="datetime-text">{currentDateFormatted}</span><span className="datetime-separator">|</span><span className="datetime-time">{currentTimeFormatted}</span></div>
        <div className="datetime-center"><span className="greeting-text">{greeting}, {student?.name?.split(' ')[0] || 'Student'}!</span></div>
        <div className="datetime-right"><span className="location-badge">🇵🇰 Pakistan Time (UTC+5)</span></div>
      </div>

      {/* Main Content */}
      <main className="main-dashboard-content">
        
        {/* COURSES STRIP */}
        {courses && courses.length > 0 ? (
          <section className="courses-strip">
            <div className="courses-strip-inner">
              <div className="courses-strip-header">
                <div className="courses-strip-title"><GraduationCap size={18} /><span>My Courses</span><span className="course-count">{courses.length}</span></div>
                <button className="courses-strip-action" onClick={() => handleNavigate('courses')}>View All <ChevronRight size={14} /></button>
              </div>
              <div className="courses-horizontal-scroll">
                {courses.map((course) => (
                  <div key={course.id} className="course-chip" onClick={() => handleNavigate(`course/${course.id}`)}>
                    <div className="course-chip-main"><span className="course-chip-name">{course.title}</span><span className="course-chip-code">{course.code}</span></div>
                    <div className="course-chip-meta"><span>{course.instructor}</span><span className="dot">•</span><span>{course.totalLessons} Lessons</span></div>
                    {course.progress && (<div className="course-progress-bar"><div className="course-progress-fill" style={{ width: `${course.progress}%` }}></div></div>)}
                  </div>
                ))}
              </div>
              <div className="courses-strip-footer"><span>{stats?.totalLessons || 0} Lessons • {courses.length} Courses</span><span className="completion-badge">{stats?.completedLessons || 0} Completed</span></div>
            </div>
          </section>
        ) : (
          <section className="courses-strip empty"><div className="courses-strip-inner empty"><div className="empty-content"><GraduationCap size={24} /><span>No courses enrolled</span><button onClick={() => handleNavigate('courses')}>Browse Courses</button></div></div></section>
        )}

        {/* STUDENT RECORD STATS */}
        <section className="student-record-section">
          <div className="section-title-bar"><h3>Student Record</h3><span className="live-indicator">● Live Updates</span></div>
          <div className="record-cards-grid">
            <div className="record-card" onClick={() => handleNavigate('attendance')}>
              <div className="record-icon blue"><Users size={24} /></div>
              <div className="record-info"><h4>{stats?.attendance || 0}%</h4><p>Attendance Rate</p><span className="record-trend up">{stats?.attendance >= 90 ? 'Excellent!' : 'Good'}</span></div>
            </div>
            <div className="record-card" onClick={() => handleNavigate('assignments')}>
              <div className="record-icon orange"><ClipboardList size={24} /></div>
              <div className="record-info"><h4>{stats?.pendingAssignments || 0}</h4><p>Pending Assignments</p><span className="record-trend warning">{stats?.pendingAssignments > 0 ? 'Due soon' : 'All done'}</span></div>
            </div>
            <div className="record-card" onClick={() => handleNavigate('quizzes')}>
              <div className="record-icon purple"><Target size={24} /></div>
              <div className="record-info"><h4>{stats?.upcomingQuizzes || 0}</h4><p>Upcoming Quizzes</p><span className="record-trend up">Keep going!</span></div>
            </div>
            <div className="record-card grade-card" onClick={() => handleNavigate('results')}>
              <div className="record-icon gold"><Award size={24} /></div>
              <div className="record-info"><h4 className="grade-text">{stats?.overallGrade || 'N/A'}</h4><p>Overall Grade</p><span className="record-trend success">{stats?.overallPercentage >= 80 ? 'Excellent!' : 'Good'}</span></div>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="dashboard-grid">
          
          {/* LEFT SIDE */}
          <div className="grid-left">
            
            {/* QUICK ACCESS TOOLS */}
            <section className="quick-tools-section">
              <div className="section-title-bar"><h3>Quick Access</h3><button className="view-all-btn" onClick={() => handleNavigate('all-tools')}>View All</button></div>
              <div className="tools-grid">
                {[
                  { icon: Calendar, label: 'Schedule', color: 'blue', page: 'schedule' },
                  { icon: FileText, label: 'Assignments', color: 'yellow', page: 'assignments', badge: quickAccess?.pendingAssignments?.length },
                  { icon: Target, label: 'Quizzes', color: 'purple', page: 'quizzes', badge: quickAccess?.upcomingQuizzes?.length },
                  { icon: Edit3, label: 'Notebook', color: 'green', page: 'notebook' },
                  { icon: CheckCircle, label: 'Attendance', color: 'cyan', page: 'attendance' },
                  { icon: BarChart3, label: 'Results', color: 'orange', page: 'results' },
                  { icon: TrendingUp, label: 'Progress', color: 'pink', page: 'progress' },
                  { icon: BookOpen, label: 'Resources', color: 'red', page: 'resources' }
                ].map((tool, idx) => (
                  <button key={idx} className="tool-card" onClick={() => handleNavigate(tool.page)} style={{ position: 'relative' }}>
                    <div className={`tool-icon ${tool.color}`}><tool.icon size={22} /></div>
                    <span>{tool.label}</span>
                    {tool.badge > 0 && (<span className="tool-badge">{tool.badge}</span>)}
                  </button>
                ))}
              </div>
            </section>

            {/* 🔥 UPDATED QUICK TIPS - Helping Materials instead of Learning Path */}
            <section className="quick-tips-section">
              <div className="section-title-bar"><h3>💡 Quick Tips</h3><button className="view-all-btn" onClick={() => handleNavigate('tips')}>More Tips</button></div>
              <div className="quick-tips-grid">
                {quickTips.map((tip, idx) => (
                  <div 
                    key={idx} 
                    className={`tip-card ${tip.badge > 0 ? 'has-unseen' : ''}`} 
                    style={{ borderLeftColor: tip.color }} 
                    onClick={() => tip.action === 'helping-materials' ? handleHelpingMaterialClick() : handleNavigate(tip.action)}
                  >
                    <div className="tip-icon" style={{ background: `${tip.color}15`, color: tip.color }}>
                      <tip.icon size={24} />
                    </div>
                    <div className="tip-content">
                      <h4>
                        {tip.title}
                        {tip.badge > 0 && <span className="unseen-badge">{tip.badge} new</span>}
                      </h4>
                      <p>{tip.desc}</p>
                    </div>
                    <ChevronRight size={16} className="tip-arrow" />
                  </div>
                ))}
              </div>
            </section>

            {/* PENDING ASSIGNMENTS */}
            {quickAccess?.pendingAssignments?.length > 0 && (
              <section className="quick-tools-section" style={{ marginTop: '24px' }}>
                <div className="section-title-bar"><h3>Due Soon</h3><button className="view-all-btn" onClick={() => handleNavigate('assignments')}>View All</button></div>
                <div className="notice-items">
                  {quickAccess.pendingAssignments.map(a => (
                    <div key={a.id} className="notice-row" onClick={() => handleNavigate(`assignment/${a.id}`)}>
                      <div className="notice-icon red"><FileText size={20} /></div>
                      <div className="notice-text"><h4>{a.title}</h4><p>{a.course} • Due: {new Date(a.dueDate).toLocaleDateString()} • {a.totalMarks} marks</p></div>
                      <ChevronRight size={18} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* UPCOMING QUIZZES */}
            {quickAccess?.upcomingQuizzes?.length > 0 && (
              <section className="quick-tools-section" style={{ marginTop: '24px' }}>
                <div className="section-title-bar"><h3>Upcoming Quizzes</h3><button className="view-all-btn" onClick={() => handleNavigate('quizzes')}>View All</button></div>
                <div className="notice-items">
                  {quickAccess.upcomingQuizzes.map(q => (
                    <div key={q.id} className="notice-row" onClick={() => handleNavigate(`quiz/${q.id}`)}>
                      <div className="notice-icon purple"><Target size={20} /></div>
                      <div className="notice-text"><h4>{q.title}</h4><p>{q.course} • Due: {new Date(q.dueDate).toLocaleDateString()} • {q.totalMarks} marks</p></div>
                      <ChevronRight size={18} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="grid-right">
            
            {/* CALENDAR WIDGET */}
            <section className="calendar-widget-section">
              <div className="section-title-bar"><h3>📅 Calendar</h3><span className="live-indicator">Live</span></div>
              <div className="calendar-box">
                <div className="current-month-header"><span>{currentDateTime.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</span></div>
                <div className="week-days-row">
                  {weekDays.map((day, idx) => (
                    <div key={idx} className={`day-cell ${day.isToday ? 'active' : ''} ${day.hasEvent ? 'has-event' : ''}`}>
                      <span className="day-label">{day.name}</span>
                      <span className="day-num">{day.date}</span>
                      {day.hasEvent && <div className="event-dot"></div>}
                    </div>
                  ))}
                </div>
                <div className="events-list">
                  <div className="event-row today-highlight">
                    <div className="event-time"><span className="time">{currentTimeFormatted}</span><span className="label">NOW</span></div>
                    <div className="event-info"><h4>Current Time</h4><p>Pakistan Standard Time (UTC+5)</p></div>
                  </div>
                  {weeklySchedule?.slice(0, 2).map(s => (
                    <div key={s.id} className="event-row">
                      <div className="event-time"><span className="time">{s.recurring?.startTime || '2:00 PM'}</span><span className="label">{s.isToday ? 'TODAY' : 'UPCOMING'}</span></div>
                      <div className="event-info"><h4>{s.title}</h4><p>{s.courseName}</p></div>
                      {s.meetingLink && (<button className="join-class-btn" onClick={() => window.open(s.meetingLink, '_blank')}><Play size={12} /> Join</button>)}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* NOTICE BOARD */}
            <section className="notice-board" style={{ cursor: 'pointer' }} onClick={() => handleNavigate('notices')}>
              <div className="section-title-bar"><h3>Notice Board</h3><span className="new-badge">{announcements?.filter(a => a.isNew).length || 0} New</span></div>
              <div className="notice-items">
                {announcements?.slice(0, 3).map(a => (
                  <div key={a.id} className="notice-row">
                    <div className={`notice-icon ${a.priority === 'high' ? 'red' : 'blue'}`}><Megaphone size={20} /></div>
                    <div className="notice-text"><h4>{a.title}</h4><p>{a.content?.substring(0, 40)}...</p>{a.isNew && <span className="new-tag">NEW</span>}</div>
                    <ChevronRight size={18} />
                  </div>
                ))}
              </div>
            </section>

            {/* IMPORTANT LINKS */}
            <section className="notice-board" style={{ marginBottom: '20px', cursor: 'pointer' }} onClick={() => handleNavigate('important-links')}>
              <div className="section-title-bar"><h3>Important Links</h3></div>
              <div className="notice-items">
                {importantLinks?.slice(0, 3).map(l => (
                  <div key={l.id} className="notice-row">
                    <div className="notice-icon blue"><Link size={20} /></div>
                    <div className="notice-text"><h4>{l.title}</h4><p>{l.category}</p></div>
                    <ChevronRight size={18} />
                  </div>
                ))}
              </div>
            </section>

            {/* JOBS & INTERNSHIPS */}
            <section className="notice-board" style={{ marginBottom: '20px' }}>
              <div className="section-title-bar"><h3>Jobs & Internships</h3><span className="new-badge" style={{ background: 'var(--green)' }}>{opportunities?.length || 0} Open</span></div>
              <div className="notice-items">
                {opportunities && opportunities.length > 0 ? (
                  opportunities.slice(0, 3).map(job => (
                    <button key={job.id} className="notice-row" onClick={() => handleNavigate('opportunities')}>
                      <div className="notice-icon green"><Briefcase size={20} /></div>
                      <div className="notice-text"><h4>{job.title}</h4><p>{job.company} • {job.type} • {job.location}</p></div>
                      <ChevronRight size={18} />
                    </button>
                  ))
                ) : (
                  <div className="notice-row" onClick={() => handleNavigate('opportunities')}>
                    <div className="notice-icon green"><Briefcase size={20} /></div>
                    <div className="notice-text"><h4>View All Opportunities</h4><p>Click to see available jobs</p></div>
                    <ChevronRight size={18} />
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardHome;