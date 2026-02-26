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

// Import Notice Board Pages (YE PAGES AB INTERNAL ROUTES HAIN - SIDEBAR KE SAATH)
import AnnouncementsPage from './Pages/AnnouncementsPage';
import ImportantLinksPage from './Pages/ImportantLinksPage';
import OpportunitiesPage from './Pages/OpportunitiesPage';

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

// ============================================
// 🆕 NEW: Assignment Builder Import
// ============================================
import AssignmentBuilder from './Pages/AssignmentBuilder';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  const studentEmail = localStorage.getItem('studentEmail');

  useEffect(() => {
    const checkAccess = async () => {
      if (!studentEmail) { 
        navigate('/login'); 
        return; 
      }
      
      try {
        const res = await axios.get(`http://localhost:5000/api/payments/my-status/${studentEmail}`);
        
        if (!res.data || res.data.status.toLowerCase() !== 'approved') {
          navigate('/my-learning');
          return;
        }
        
        setStudentName(res.data.studentName || "Student");
        setLoading(false);
        
      } catch (err) {
        navigate('/my-learning');
      }
    };

    checkAccess();
  }, [studentEmail, navigate]);

  // ======== FULL WHITE BACKGROUND + HIDE NAVBARS ========
  useEffect(() => {
    const navbar = document.querySelector('.skillsmind-nav');
    const stickySidebar = document.querySelector('.sticky-sidebar');
    
    if (navbar) navbar.style.display = 'none';
    if (stickySidebar) stickySidebar.style.display = 'none';
    
    // PURE WHITE BACKGROUND
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

  // ======== NAVIGATION HANDLER ========
  // Sab pages internal hain - StudentDashboard ke andar hi open honge
  const handleNavigate = (page) => {
    console.log('Navigating to:', page);
    
    // Sab pages ko internal treat karo - activeTab change hoga
    setActiveTab(page);
  };

  // Determine if we should show back button (when not on dashboard)
  const showBackButton = activeTab !== 'dashboard';

  const renderContent = () => {
    const props = { 
      studentName,
      onNavigate: handleNavigate,
      showBackButton
    };
    
    switch(activeTab) {
      case 'dashboard': return <DashboardHome {...props} />;
      case 'courses': return <MyCourses {...props} />;
      case 'tasks': return <TasksAssignments {...props} />;
      case 'calendar': return <CalendarSchedule {...props} />;
      case 'profile': return <Profile {...props} />;
      
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
      
      // ============================================
      // 🆕 NEW: Assignment Builder Case
      // ============================================
      case 'assignment-builder': return <AssignmentBuilder {...props} />;
      
      // NOTICE BOARD PAGES - SIDEBAR KE SAATH OPEN HONGE
      case 'announcements': return <AnnouncementsPage {...props} />;
      case 'important-links': return <ImportantLinksPage {...props} />;
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
        setActiveTab={setActiveTab}
        studentName={studentName}
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
          hidden={true}
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