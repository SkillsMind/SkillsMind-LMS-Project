import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Layout/Sidebar';
import Topbar from './Layout/Topbar';
import './StudentDashboard.css';

// Import Pages (EXISTING)
import DashboardHome from './Pages/DashboardHome';
import MyCourses from './Pages/MyCourses';
import TasksAssignments from './Pages/TasksAssignments';
import CalendarSchedule from './Pages/CalendarSchedule';
import Profile from './Pages/Profile';

// Import NEW Pages
import Schedule from './Pages/Schedule';
import Homework from './Pages/Homework';
import Assignments from './Pages/Assignments';
import Notebook from './Pages/Notebook';
import Attendance from './Pages/Attendance';
import Quizzes from './Pages/Quizzes';
import Results from './Pages/Results';
import Progress from './Pages/Progress';
import Notices from './Pages/Notices';
import Timeline from './Pages/Timeline';

// Import Notice Board Pages
import AnnouncementsPage from './Pages/AnnouncementsPage';
import ImportantLinksPage from './Pages/ImportantLinksPage';
import OpportunitiesPage from './Pages/OpportunitiesPage';
import HelpingMaterialsPage from './Pages/HelpingMaterialsPage';

// Import Features
import SkillTree from './Features/SkillTree';
import FocusMode from './Features/FocusMode';
import AIStudyBuddy from './Features/AIStudyBuddy';
import StudyCollab from './Features/StudyCollab';
import CareerSimulator from './Features/CareerSimulator';
import Portfolio from './Features/Portfolio';
import KnowledgeMap from './Features/KnowledgeMap';
import DailyChallenges from './Features/DailyChallenges';
import ResourceExchange from './Features/ResourceExchange';
import MentorBooking from './Features/MentorBooking';

// Assignment Builder Import
import AssignmentBuilder from './Pages/AssignmentBuilder';

// Settings Page Import
import Settings from './Pages/Settings';

// 🔥🔥🔥 QUICK TIPS PAGES IMPORTS (SMALL 's' - FOLDER NAME IS 'student') 🔥🔥🔥
import StudyBreak from './Pages/student/StudyBreak';
import DailyGoal from './Pages/student/DailyGoal';
import LearningPath from './Pages/student/LearningPath';
import ReferFriend from './Pages/student/ReferFriend';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const studentEmail = localStorage.getItem('studentEmail');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkAccess = async () => {
      if (!studentEmail || !userId || !token) { 
        navigate('/login'); 
        return; 
      }
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const enrollRes = await axios.get(`${API_URL}/api/enroll/check-enrollment/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('StudentDashboard - Enrollment Check:', enrollRes.data);
        
        if (enrollRes.data.success && enrollRes.data.enrolledCourses && enrollRes.data.enrolledCourses.length > 0) {
          setStudentName(enrollRes.data.enrolledCourses[0]?.studentName || "Student");
          setLoading(false);
          return;
        }
        
        console.log('⚠️ No LiveEnrollment, checking Payment API...');
        const paymentRes = await axios.get(`${API_URL}/api/payments/my-status/${studentEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('StudentDashboard - Payment Check:', paymentRes.data);
        
        if (paymentRes.data && paymentRes.data.status === 'approved') {
          setStudentName(paymentRes.data.studentName || "Student");
          setLoading(false);
          return;
        }
        
        navigate('/my-learning');
        
      } catch (err) {
        console.error('Access check error:', err);
        navigate('/my-learning');
      }
    };

    checkAccess();
  }, [studentEmail, userId, token, navigate]);

  // FULL WHITE BACKGROUND + HIDE NAVBARS
  useEffect(() => {
    const navbar = document.querySelector('.skillsmind-nav');
    const stickySidebar = document.querySelector('.sticky-sidebar');
    
    if (navbar) navbar.style.display = 'none';
    if (stickySidebar) stickySidebar.style.display = 'none';
    
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.background = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.backgroundColor = '#ffffff';
      root.style.background = '#ffffff';
      root.style.minHeight = '100vh';
    }
    
    const app = document.querySelector('.App');
    if (app) {
      app.style.backgroundColor = '#ffffff';
      app.style.background = '#ffffff';
      app.style.minHeight = '100vh';
    }

    return () => {
      if (navbar) navbar.style.display = '';
      if (stickySidebar) stickySidebar.style.display = '';
      document.body.style.backgroundColor = '';
      document.body.style.background = '';
      document.documentElement.style.backgroundColor = '';
      if (root) {
        root.style.backgroundColor = '';
        root.style.background = '';
        root.style.minHeight = '';
      }
      if (app) {
        app.style.backgroundColor = '';
        app.style.background = '';
        app.style.minHeight = '';
      }
    };
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '3px solid #e5e7eb', 
            borderTop: '3px solid #DC2626', 
            borderRadius: '50%', 
            width: '50px', 
            height: '50px', 
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#000B29' }}>Verifying Access...</p>
        </div>
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  const handleTopbarNavigate = (page) => {
    console.log('Topbar navigation:', page);
    
    switch(page) {
      case 'profile':
        setActiveTab('profile');
        break;
      case 'settings':
        setActiveTab('settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        setActiveTab(page);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSidebarNavigate = (tabId) => {
    console.log('Sidebar navigation:', tabId);
    setActiveTab(tabId);
  };

  const renderContent = () => {
    const props = { 
      studentName,
      onNavigate: handleSidebarNavigate,
      showBackButton: activeTab !== 'dashboard'
    };
    
    switch(activeTab) {
      case 'dashboard': return <DashboardHome {...props} />;
      case 'courses': return <MyCourses {...props} />;
      case 'tasks': return <TasksAssignments {...props} />;
      case 'calendar': return <CalendarSchedule {...props} />;
      case 'profile': return <Profile {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'schedule': return <Schedule {...props} />;
      case 'homework': return <Homework {...props} />;
      case 'assignments': return <Assignments {...props} />;
      case 'notebook': return <Notebook {...props} />;
      case 'attendance': return <Attendance {...props} />;
      case 'quizzes': return <Quizzes {...props} />;
      case 'results': return <Results {...props} />;
      case 'progress': return <Progress {...props} />;
      case 'notices': return <Notices {...props} />;
      case 'timeline': return <Timeline {...props} />;
      case 'assignment-builder': return <AssignmentBuilder {...props} />;
      case 'announcements': return <AnnouncementsPage {...props} />;
      case 'important-links': return <ImportantLinksPage {...props} />;
      case 'helping-materials': return <HelpingMaterialsPage {...props} />;
      case 'opportunities': return <OpportunitiesPage {...props} />;
      case 'skilltree': return <SkillTree {...props} />;
      case 'focusmode': return <FocusMode {...props} />;
      case 'aibuddy': return <AIStudyBuddy {...props} />;
      case 'collab': return <StudyCollab {...props} />;
      case 'career': return <CareerSimulator {...props} />;
      case 'portfolio': return <Portfolio {...props} />;
      case 'knowledge': return <KnowledgeMap {...props} />;
      case 'challenges': return <DailyChallenges {...props} />;
      case 'resources': return <ResourceExchange {...props} />;
      case 'mentors': return <MentorBooking {...props} />;
      case 'study-break': return <StudyBreak {...props} />;
      case 'daily-goal': return <DailyGoal {...props} />;
      case 'learning-path': return <LearningPath {...props} />;
      case 'refer-friend': return <ReferFriend {...props} />;
      
      default: return <DashboardHome {...props} />;
    }
  };

  return (
    <div className="student-dashboard" style={{ 
      display: 'flex',
      background: '#ffffff',
      minHeight: '100vh'
    }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSidebarNavigate}
        studentName={studentName}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      
      <div className="main-wrapper" style={{ 
        flex: 1, 
        marginLeft: '80px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        background: '#ffffff'
      }}>
        <Topbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          studentName={studentName}
          onNavigate={handleTopbarNavigate}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        
        <main className="dashboard-content" style={{ 
          padding: '24px',
          background: '#ffffff',
          minHeight: 'calc(100vh - 48px)'
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard; 