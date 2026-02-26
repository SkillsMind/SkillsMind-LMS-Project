import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, ClipboardList, Calendar, User, LogOut, 
  Award, Brain, Users, Map, Briefcase, Zap, Share2, Clock, 
  MessageCircle, FileText, ChevronRight, Menu, X, ChevronDown,
  CheckCircle, Edit3, Target, BarChart3, TrendingUp, Bell
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [proFeaturesOpen, setProFeaturesOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  
  // Ref for click outside
  const sidebarRef = useRef(null);

  // Click outside to close mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dashboard separate rahega
  const dashboardItem = { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard };

  // My Learning section - ab yeh open rahega (dropdown nahi)
  const myLearningItems = [
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'tasks', label: 'Tasks & Grades', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Quick Tools section - yeh bhi open rahega
  const quickToolsItems = [
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'homework', label: 'Homework', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'quizzes', label: 'Quizzes', icon: Target },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'notebook', label: 'Notebook', icon: Edit3 },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'timeline', label: 'Timeline', icon: BarChart3 },
    { id: 'notices', label: 'Notices', icon: Bell, badge: '3' },
  ];

  // Pro Features - ab yeh dropdown mein hoga
  const proFeaturesItems = [
    { id: 'skilltree', label: 'Skill Tree', icon: Map, badge: 'PRO' },
    { id: 'focusmode', label: 'Focus Mode', icon: Clock, badge: 'NEW' },
    { id: 'aibuddy', label: 'AI Study Buddy', icon: Brain, badge: 'AI' },
    { id: 'collab', label: 'Study Collab', icon: Users },
    { id: 'career', label: 'Career Simulator', icon: Briefcase },
    { id: 'portfolio', label: 'My Portfolio', icon: Award },
    { id: 'knowledge', label: 'Knowledge Map', icon: Share2 },
    { id: 'challenges', label: 'Daily Challenges', icon: Zap },
    { id: 'resources', label: 'Resource Exchange', icon: FileText },
    { id: 'mentors', label: 'Book Mentor', icon: MessageCircle },
  ];

  const handleMenuClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const toggleProFeatures = (e) => {
    e.stopPropagation();
    setProFeaturesOpen(!proFeaturesOpen);
  };

  const isProFeaturesActive = proFeaturesItems.some(item => item.id === activeTab);
  
  // Check if any learning item is active
  const isLearningActive = myLearningItems.some(item => item.id === activeTab);
  
  // Check if any tools item is active
  const isToolsActive = quickToolsItems.some(item => item.id === activeTab);

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={24} />
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside 
        ref={sidebarRef}
        className={`skills-sidebar ${isExpanded ? 'expanded' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          setHoveredSection(null);
        }}
      >
        <div className="sidebar-header">
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
          
          <div className="logo-container">
            <img src="/Skillsmind logo with blue.png" alt="Logo" className="logo-image" />
          </div>
          {(isExpanded || mobileOpen) && <span className="logo-text">Student LMS</span>}
        </div>

        <div className="sidebar-content">
          {/* Dashboard - Always Visible */}
          <div className="menu-section">
            <span className="section-label">Main</span>
            <nav className="sidebar-nav">
              <button 
                onClick={() => handleMenuClick(dashboardItem.id)} 
                className={`nav-item ${activeTab === dashboardItem.id ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <dashboardItem.icon size={20} />
                </div>
                <span className="nav-label">{dashboardItem.label}</span>
              </button>
            </nav>
          </div>

          {/* My Learning Section - Always Open (Not Dropdown) */}
          <div 
            className="menu-section hover-section"
            onMouseEnter={() => setHoveredSection('learning')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <span className="section-label">My Learning</span>
            <nav className="sidebar-nav">
              {myLearningItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => handleMenuClick(item.id)} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="nav-icon-wrapper">
                      <Icon size={20} />
                    </div>
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Hover Menu for My Learning (Desktop Expanded) */}
            {(isExpanded || mobileOpen) && hoveredSection === 'learning' && (
              <div className="hover-dropdown">
                {quickToolsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => handleMenuClick(item.id)} 
                      className={`hover-dropdown-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {item.badge && <span className="dropdown-badge">{item.badge}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tools Section - Always Open (Not Dropdown) */}
          <div 
            className="menu-section hover-section"
            onMouseEnter={() => setHoveredSection('tools')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <span className="section-label">Quick Tools</span>
            <nav className="sidebar-nav">
              {quickToolsItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => handleMenuClick(item.id)} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="nav-icon-wrapper">
                      <Icon size={20} />
                    </div>
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Hover Menu for Quick Tools (Desktop Expanded) */}
            {(isExpanded || mobileOpen) && hoveredSection === 'tools' && (
              <div className="hover-dropdown">
                {quickToolsItems.slice(4).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => handleMenuClick(item.id)} 
                      className={`hover-dropdown-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {item.badge && <span className="dropdown-badge">{item.badge}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pro Features Dropdown */}
          <div className="menu-section">
            <span className="section-label">Premium</span>
            <button 
              className={`dropdown-toggle ${isProFeaturesActive ? 'active' : ''}`}
              onClick={toggleProFeatures}
            >
              <div className="toggle-left">
                <div className="nav-icon-wrapper">
                  <Zap size={20} />
                </div>
                <span className="nav-label">Pro Features</span>
              </div>
              <ChevronDown size={16} className={`toggle-icon ${proFeaturesOpen ? 'open' : ''}`} />
            </button>
            
            <div className={`dropdown-menu ${proFeaturesOpen ? 'open' : ''}`}>
              {proFeaturesItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => handleMenuClick(item.id)} 
                    className={`dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge && <span className={`item-badge-small ${item.badge.toLowerCase()}`}>{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <div className="nav-icon-wrapper red-bg">
              <LogOut size={20} />
            </div>
            <span className="nav-label">Logout</span>
          </button>
          {(isExpanded || mobileOpen) && <div className="version-info">SkillsMind LMS v2.0</div>}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;