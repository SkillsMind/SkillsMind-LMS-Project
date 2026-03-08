import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// i18n Import
import './i18n';

// 1. Components Imports
import Navbar from './components/Navbar/Navbar';
import ContactSidebar from './components/ContactSidebar/ContactSidebar';
import LoginSignup from './components/LoginSignup/LoginSignup';

// AI Chatbot Import
import SkillsMindBot from './components/AIChat/SkillsMindBot';

// --- Profile Context Provider ---
import { ProfileProvider } from './context/ProfileContext.jsx';

// --- Student Profile & Dashboard ---
import StudentProfileForm from './components/StudentProfile/StudentProfileForm';
import Dashboard from './pages/Dashboard';

// UPDATE: Sahi path jahan aapne folder banaya hai
import MyLearning from './components/My Learning/MyLearning'; 

// --- FIXED IMPORT: Student Dashboard (Spelling and Case Fixed) ---
import StudentDashboardPortal from './components/StudentDashboard/StudentDashboard';

// --- Enrollment Components ---
import GetEnrollment from './components/GetEnrollment/GetEnrollment'; 
import LiveEnrollment from './components/Live/LiveEnrollment';
import RecordedEnrollment from './components/Recorded/RecordedEnrollment';

// --- Payment Component (SkillsMind Elite Gateway) ---
import PaymentMethod from "./components/PaymentMethod/PaymentMethod";

// --- Admin Dashboard & New Management Components ---
import AdminDashboard from './components/AdminControl/AdminDashboard';
import PaymentApprovals from './components/AdminControl/PaymentManagement/PaymentApprovals';
import RegistrationData from './components/AdminControl/StudentRegisterRecords/RegistrationData';

// 2. Pages Imports
import Home from './pages/Home';

// ============================================
// 🆕 NEW: Student Dashboard Pages Import (10 Files)
// ============================================
import Assignments from './components/StudentDashboard/Pages/Assignments';
import Attendance from './components/StudentDashboard/Pages/Attendance';
import Homework from './components/StudentDashboard/Pages/Homework';
import Notebook from './components/StudentDashboard/Pages/Notebook';
import Notices from './components/StudentDashboard/Pages/Notices';
import Profile from './components/StudentDashboard/Pages/Profile';
import Progress from './components/StudentDashboard/Pages/Progress';
import Quizzes from './components/StudentDashboard/Pages/Quizzes';
import Results from './components/StudentDashboard/Pages/Results';
import Schedule from './components/StudentDashboard/Pages/Schedule';

// 3. CSS Imports
import './App.css';

// --- HIGH SECURITY PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const studentEmail = localStorage.getItem('studentEmail');

  if (!token || !studentEmail) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper component for routes that need ProfileProvider
const ProfileProviderWrapper = ({ children }) => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  return (
    <ProfileProvider userId={userId} token={token}>
      {children}
    </ProfileProvider>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <ContactSidebar />

        {/* SkillsMind AI Bot - Har page par display hoga */}
        <SkillsMindBot />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />

          {/* Profile & Enrollment Routes (Protected) */}
          <Route 
            path="/student-profile-form" 
            element={<ProtectedRoute><StudentProfileForm /></ProtectedRoute>} 
          />
          
          <Route 
            path="/build-profile" 
            element={<ProtectedRoute><StudentProfileForm /></ProtectedRoute>} 
          />

          {/* Get Enrollment with ProfileProvider for real-time sync */}
          <Route 
            path="/get-enrolment" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <GetEnrollment />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />

          {/* Enrollment Flows with Dynamic Parameters */}
          <Route 
            path="/enroll-live/:courseName?" 
            element={<ProtectedRoute><LiveEnrollment /></ProtectedRoute>} 
          />

          <Route 
            path="/enroll-recorded/:courseName?" 
            element={<ProtectedRoute><RecordedEnrollment /></ProtectedRoute>} 
          />

          {/* PAYMENT METHOD ROUTE (SkillsMind Checkout) */}
          <Route 
            path="/payment-method/:courseId?" 
            element={<ProtectedRoute><PaymentMethod /></ProtectedRoute>} 
          />

          {/* User, Student & Admin Dashboards */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />

          {/* --- STEP 1: My Learning (Status Check Page) --- */}
          <Route 
            path="/my-learning" 
            element={<ProtectedRoute><MyLearning /></ProtectedRoute>} 
          />

          {/* --- STEP 2: Student Dashboard (Nested Routes with ProfileProvider) --- */}
          <Route 
            path="/student-dashboard/*" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <StudentDashboardPortal />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />

          {/* ============================================
              🆕 NEW: 10 Student Dashboard Pages Routes (with ProfileProvider)
              ============================================ */}
          <Route 
            path="/student/assignments" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Assignments />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/attendance" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Attendance />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/homework" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Homework />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/notebook" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Notebook />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/notices" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Notices />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/profile" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Profile />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/progress" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Progress />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/quizzes" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Quizzes />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/results" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Results />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/schedule" 
            element={
              <ProtectedRoute>
                <ProfileProviderWrapper>
                  <Schedule />
                </ProfileProviderWrapper>
              </ProtectedRoute>
            } 
          />

          {/* Admin Main Dashboard */}
          <Route 
            path="/admin-dashboard" 
            element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
          />

          {/* Admin New Management Routes */}
          <Route 
            path="/admin/payments" 
            element={<ProtectedRoute><PaymentApprovals /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/students" 
            element={<ProtectedRoute><RegistrationData /></ProtectedRoute>} 
          />

          {/* Fallback for 404 - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;