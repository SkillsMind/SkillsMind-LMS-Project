import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FaUsers, FaClipboardList, FaSignOutAlt, FaFileExcel, 
  FaFilePdf, FaSearch, FaUserShield, FaTrash, FaExclamationTriangle,
  FaPlusCircle, FaCreditCard, FaUserGraduate,
  FaTasks, FaCalendarCheck, FaQuestionCircle,
  FaChartBar, FaCalendarAlt, FaChevronDown, FaLink, FaBullhorn, FaBriefcase
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf'; 
import 'jspdf-autotable';

// Existing Components
import AddCourse from './CourseManagement/AddCourse'; 
import RegistrationData from './StudentRegisterRecords/RegistrationData';
import PaymentApprovals from './PaymentManagement/PaymentApprovals';
import AssignmentManager from './AssignmentManagement/AssignmentManager';
import AttendanceManager from './AttendanceManagement/AttendanceManager';
import QuizManager from './QuizManagement/QuizManager';
import QuizReport from './QuizManagement/QuizReport';
import ScheduleManager from './ScheduleManagement/ScheduleManager';

// 🔥 NEW: Dynamic System Imports
import ImportantLinks from './ImportantLinks/ImportantLinks';
import NoticeBoard from './NoticeBoard/NoticeBoard';
import JobsInternships from './JobsInternships/JobsInternships';

import logo from '../../assets/Skills_Mind_Logo.png'; 
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);         
  const [profiles, setProfiles] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tabs management
  const [activeTab, setActiveTab] = useState("students"); 
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  
  // 🔥 NEW: Dropdown states
  const [showDynamicDropdown, setShowDynamicDropdown] = useState(false);
  const [activeDynamicTab, setActiveDynamicTab] = useState('importantLinks');
  
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    document.body.classList.add('admin-view-active');
    
    if (activeTab === 'students' || activeTab === 'forms') {
        fetchData();
    }
    
    return () => document.body.classList.remove('admin-view-active');
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'students' 
        ? '${import.meta.env.VITE_API_URL}/api/auth/all-users' 
        : '${import.meta.env.VITE_API_URL}/api/profile/all-submissions';

      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (activeTab === 'students') {
        const finalUsers = data.users || data || [];
        setUsers(Array.isArray(finalUsers) ? finalUsers : []);
      } else {
        setProfiles(Array.isArray(data) ? data : []);
      }
      console.log(`✅ SkillsMind: ${activeTab} data refreshed`);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("SkillsMind: Database connection fail!");
    } finally {
      setLoading(false);
    }
  };

  const viewQuizReport = (quizId) => {
    console.log('🔵 viewQuizReport called with quizId:', quizId);
    if (!quizId) {
      toast.error('Invalid quiz selected');
      return;
    }
    setSelectedQuizId(quizId);
    setActiveTab('quizReport');
  };

  const backToQuizzes = () => {
    console.log('🔵 backToQuizzes called');
    setSelectedQuizId(null);
    setActiveTab('quizzes');
  };

  // 🔥 NEW: Handle Dynamic System Tab Click
  const handleDynamicTabClick = (tabName) => {
    setActiveDynamicTab(tabName);
    setActiveTab('dynamic');
    setShowDynamicDropdown(false);
  };

  // 🔥 NEW: Check if dynamic tab is active
  const isDynamicActive = activeTab === 'dynamic';

  // --- DELETE LOGIC ---
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      const routePrefix = activeTab === 'students' ? 'auth/delete-user' : 'profile/delete-submission';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${routePrefix}/${deleteId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success("SkillsMind: Record Deleted!");
        setShowModal(false);
        fetchData(); 
      } else {
        toast.error("Delete failed!");
      }
    } catch (error) {
      toast.error("Server connection error!");
    }
  };

  // --- EXPORT LOGIC ---
  const downloadExcel = () => {
    const dataToExport = activeTab === 'students' ? filteredUsers : filteredProfiles;
    if (dataToExport.length === 0) return toast.error("No data to export!");

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(p => {
      if(activeTab === 'students') return { 
          Name: p.name, 
          Email: p.email, 
          JoinDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '06 Jan 2026' 
      };
      return {
        Name: `${p.firstName} ${p.lastName}`,
        Interest: p.interest,
        Gender: p.gender,
        Mobile: p.mobile,
        Institute: p.institute,
        Year: p.passingYear,
        City: p.city
      };
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SkillsMind_Report");
    XLSX.writeFile(workbook, `SkillsMind_${activeTab}.xlsx`);
  };

  const downloadPDF = () => {
    const dataToExport = activeTab === 'students' ? filteredUsers : filteredProfiles;
    if (dataToExport.length === 0) return toast.error("No data found!");

    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(227, 30, 36); 
      doc.text("SkillsMind Training Institute", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Report: ${activeTab.toUpperCase()} | Date: ${new Date().toLocaleDateString()}`, 14, 28);

      const headers = activeTab === 'students' 
        ? [['Name', 'Email', 'Role', 'Join Date']]
        : [['Name', 'Course', 'Mobile', 'Institute', 'City']];

      const body = dataToExport.map(p => activeTab === 'students' 
        ? [p.name, p.email, p.role, p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '06 Jan 2026']
        : [`${p.firstName} ${p.lastName}`, p.interest, p.mobile, p.institute, p.city]
      );

      doc.autoTable({
        head: headers,
        body: body,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [227, 30, 36] }, 
        styles: { fontSize: 8 }
      });

      doc.save(`SkillsMind_${activeTab}_Report.pdf`);
      toast.success("PDF Downloaded!");
    } catch (err) {
      toast.error("PDF generation error!");
      console.error(err);
    }
  };

  // --- SEARCH FILTERS ---
  const filteredUsers = users.filter(user => 
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = profiles.filter(p => 
    (p.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.interest || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔥 NEW: Render Dynamic Content
  const renderDynamicContent = () => {
    switch(activeDynamicTab) {
      case 'importantLinks':
        return <ImportantLinks />;
      case 'noticeBoard':
        return <NoticeBoard />;
      case 'jobsInternships':
        return <JobsInternships />;
      default:
        return <ImportantLinks />;
    }
  };

  return (
    <div className="sm-dashboard-root">
      
      {/* PROFESSIONAL DELETE MODAL */}
      {showModal && (
        <div className="sm-modal-overlay">
          <div className="sm-modal-content">
            <div className="sm-modal-icon">
              <FaExclamationTriangle size={50} color="#e31e24" />
            </div>
            <h3>Are you sure?</h3>
            <p>This record will be permanently deleted from SkillsMind.</p>
            <div className="sm-modal-actions">
              <button className="sm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sm-btn-confirm" onClick={confirmDelete}>Yes, Delete it</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sm-sidebar">
        <div className="sm-sidebar-top">
          <img src={logo} alt="SkillsMind" className="sm-logo" />
          <div className="sm-nav-list">
            <button className={`sm-tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
              <FaUsers /> Dashboard Users
            </button>

            <button className={`sm-tab-btn ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => setActiveTab('registration')}>
              <FaUserGraduate /> Student Register
            </button>

            <button className={`sm-tab-btn ${activeTab === 'forms' ? 'active' : ''}`} onClick={() => setActiveTab('forms')}>
              <FaClipboardList /> Profile Submissions
            </button>

            <button className={`sm-tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
              <FaCreditCard /> Payment Approvals
            </button>

            <button className={`sm-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
              <FaTasks /> Assignments
            </button>

            {/* Quiz tab - active for both quizzes and quizReport */}
            <button className={`sm-tab-btn ${(activeTab === 'quizzes' || activeTab === 'quizReport') ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
              <FaQuestionCircle /> Quizzes
            </button>

            <button className={`sm-tab-btn ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>
              <FaCalendarAlt /> Schedules
            </button>

            <button className={`sm-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
              <FaCalendarCheck /> Attendance
            </button>

            {/* 🔥 NEW: Dynamic System Dropdown */}
            <div className="sm-dropdown-container">
              <button 
                className={`sm-tab-btn sm-dropdown-toggle ${isDynamicActive ? 'active' : ''}`}
                onClick={() => setShowDynamicDropdown(!showDynamicDropdown)}
                aria-expanded={showDynamicDropdown}
              >
                <FaChartBar /> Dynamic System
                <FaChevronDown className={`sm-dropdown-arrow ${showDynamicDropdown ? 'open' : ''}`} />
              </button>
              
              {showDynamicDropdown && (
                <div className="sm-dropdown-menu">
                  <button 
                    className={`sm-dropdown-item ${activeDynamicTab === 'importantLinks' ? 'active' : ''}`}
                    onClick={() => handleDynamicTabClick('importantLinks')}
                  >
                    <FaLink /> Important Links
                  </button>
                  <button 
                    className={`sm-dropdown-item ${activeDynamicTab === 'noticeBoard' ? 'active' : ''}`}
                    onClick={() => handleDynamicTabClick('noticeBoard')}
                  >
                    <FaBullhorn /> Notice Board
                  </button>
                  <button 
                    className={`sm-dropdown-item ${activeDynamicTab === 'jobsInternships' ? 'active' : ''}`}
                    onClick={() => handleDynamicTabClick('jobsInternships')}
                  >
                    <FaBriefcase /> Jobs & Internships
                  </button>
                </div>
              )}
            </div>

            <button className={`sm-tab-btn ${activeTab === 'addCourse' ? 'active' : ''}`} onClick={() => setActiveTab('addCourse')}>
              <FaPlusCircle /> Add New Course
            </button>
          </div>
        </div>
        <button className="sm-logout" onClick={() => navigate('/login')}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="sm-main">
        <header className="sm-top-bar">
          <div className="sm-search-box">
            <FaSearch />
            <input 
              type="text" 
              placeholder={`Search in ${activeTab}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm-admin-tag">
            <FaUserShield /> <span>SkillsMind Admin</span>
          </div>
        </header>

        <section className="sm-page-content">
          {/* CONDITIONALLY RENDER COMPONENTS */}
          {activeTab === 'addCourse' ? (
            <AddCourse />
          ) : activeTab === 'registration' ? (
            <RegistrationData />
          ) : activeTab === 'payments' ? (
            <PaymentApprovals />
          ) : activeTab === 'assignments' ? (
            <AssignmentManager />
          ) : activeTab === 'quizzes' ? (
            <QuizManager onViewReport={viewQuizReport} />
          ) : activeTab === 'quizReport' ? (
            <QuizReport 
              quizId={selectedQuizId} 
              onBack={backToQuizzes}
            />
          ) : activeTab === 'schedules' ? (
            <ScheduleManager />
          ) : activeTab === 'attendance' ? (
            <AttendanceManager />
          ) : activeTab === 'dynamic' ? (
            // 🔥 NEW: Render Dynamic System Component
            renderDynamicContent()
          ) : (
            <>
              <div className="sm-content-header">
                <h2>{activeTab === 'students' ? "Registered Dashboard Users" : "Profile Submissions"}</h2>
                <div className="sm-export-btns">
                   <button className="btn-excel" onClick={downloadExcel}><FaFileExcel /> Excel</button>
                   <button className="btn-pdf" onClick={downloadPDF}><FaFilePdf /> PDF</button>
                </div>
              </div>

              <div className="sm-data-card">
                <table className="sm-table">
                  <thead>
                    {activeTab === 'students' ? (
                      <tr>
                        <th>User Details</th>
                        <th>User Role</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Full Name</th>
                        <th>Interest</th>
                        <th>Gender & DOB</th>
                        <th>Institute</th>
                        <th>Contact</th>
                        <th>Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="status-msg">Fetching SkillsMind Data...</td></tr>
                    ) : activeTab === "students" ? (
                      filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td><div className="info-cell"><strong>{user.name}</strong><span>{user.email}</span></div></td>
                          <td><span className="badge">{user.role}</span></td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : '06 Jan 2026'}</td>
                          <td><button className="btn-reject" onClick={() => openDeleteModal(user._id)}><FaTrash /></button></td>
                        </tr>
                      ))
                    ) : (
                      filteredProfiles.map((p) => (
                        <tr key={p._id}>
                          <td><div className="info-cell"><strong>{p.firstName} {p.lastName}</strong></div></td>
                          <td><span className="badge-course">{p.interest}</span></td>
                          <td><div className="info-cell"><strong>{p.gender}</strong><span>{p.dob}</span></div></td>
                          <td><div className="info-cell"><strong>{p.institute}</strong><span>{p.passingYear}</span></div></td>
                          <td><div className="info-cell"><strong>{p.mobile}</strong><span>{p.city}</span></div></td>
                          <td><button className="btn-reject" onClick={() => openDeleteModal(p._id)}><FaTrash /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;