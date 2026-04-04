import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, 
  FaBook, FaCheckCircle, FaClock, FaSearch,
  FaFilter, FaDownload, FaRocket, FaTasks, FaSave,
  FaSpinner, FaExclamationTriangle, FaFileAlt, 
  FaUsers, FaStar, FaTimes, FaCheck, FaFilePdf,
  FaFileWord, FaFileArchive, FaArrowLeft, FaInbox,
  FaChevronDown, FaChevronUp, FaGraduationCap,
  FaFileExcel, FaList, FaBell, FaChartBar, FaCalendarDay,
  FaExclamationCircle, FaThLarge, FaThList, FaSync,
  FaHistory, FaTrophy, FaPercentage, FaEnvelope,
  FaPhone, FaUserGraduate, FaChevronRight, FaFileDownload,
  FaChartPie, FaClipboardList, FaHourglassHalf
} from 'react-icons/fa';
import './AssignmentManager.css';
import SubmissionsView from './SubmissionsView';

const AssignmentManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [view, setView] = useState('list');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // View States
  const [viewMode, setViewMode] = useState('grouped');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // 🔥 NEW: Recent Submissions Dropdown State
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [recentSearchTerm, setRecentSearchTerm] = useState('');
  
  // 🔥 NEW: Stats Detail Modal State
  const [activeStatModal, setActiveStatModal] = useState(null);
  const [statModalData, setStatModalData] = useState([]);
  
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    overdueAssignments: 0,
    todaySubmissions: 0
  });
  const [dateFilter, setDateFilter] = useState('all');
  
  const [expandedCourses, setExpandedCourses] = useState({});
  
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  
  const [attachments, setAttachments] = useState([]);

  const getToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('adminToken') ||
           localStorage.getItem('accessToken');
  };

  const API_BASE = '${import.meta.env.VITE_API_URL}/api';

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    totalMarks: 100,
    status: 'active'
  });

  useEffect(() => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error('Please login first!', { style: toastStyle });
      return;
    }
    
    fetchAssignments();
    fetchCourses();
    fetchNotifications();
    fetchRecentSubmissions();
    
    const interval = setInterval(() => {
      fetchNotifications();
      fetchRecentSubmissions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const res = await axios.get(`${API_BASE}/assignments/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.log('Notifications fetch error:', err.response?.status);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const res = await axios.get(`${API_BASE}/assignments/recent-submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setRecentSubmissions(res.data.submissions || []);
      }
    } catch (err) {
      console.log('Recent submissions fetch error:', err.response?.status);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const currentToken = getToken();
      
      const res = await axios.get(`${API_BASE}/courses/all`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      let coursesData = [];
      if (Array.isArray(res.data)) {
        coursesData = res.data;
      } else if (res.data.success && Array.isArray(res.data.courses)) {
        coursesData = res.data.courses;
      } else if (res.data.courses) {
        coursesData = res.data.courses;
      }

      setCourses(coursesData.map(c => ({
        _id: c._id,
        title: c.title,
        category: c.category
      })));
      
    } catch (err) {
      toast.error('Failed to load courses', { style: toastStyle });
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const currentToken = getToken();
      
      const res = await axios.get(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (res.data.success) {
        const assignmentsWithCourseNumbers = addCourseAssignmentNumbers(res.data.assignments || []);
        setAssignments(assignmentsWithCourseNumbers);
        
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          calculateStats(assignmentsWithCourseNumbers);
        }
      }
    } catch (err) {
      toast.error('Failed to load assignments', { style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (assignmentsList) => {
    const today = new Date().toDateString();
    const now = new Date();
    
    const stats = {
      totalAssignments: assignmentsList.length,
      totalSubmissions: assignmentsList.reduce((acc, a) => acc + (a.submissionsCount || 0), 0),
      pendingReviews: assignmentsList.reduce((acc, a) => acc + (a.pendingSubmissions || 0), 0),
      overdueAssignments: assignmentsList.filter(a => a.status === 'overdue').length,
      todaySubmissions: assignmentsList.reduce((acc, a) => acc + (a.todaySubmissions || 0), 0)
    };
    
    setStats(stats);
  };

  const addCourseAssignmentNumbers = (assignmentsList) => {
    const courseCounters = {};
    
    const sorted = [...assignmentsList].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    return sorted.map(assignment => {
      const courseId = assignment.courseId?._id || assignment.courseId || 'unknown';
      
      if (!courseCounters[courseId]) {
        courseCounters[courseId] = 1;
      } else {
        courseCounters[courseId]++;
      }

      return {
        ...assignment,
        courseAssignmentNo: courseCounters[courseId]
      };
    });
  };

  // 🔥 FIXED: Handle Stat Card Click - Overdue Fix
  const handleStatCardClick = (statType) => {
    let data = [];
    const now = new Date();
    const today = new Date().toDateString();

    switch(statType) {
      case 'total':
        data = assignments.map(a => ({
          type: 'assignment',
          title: a.title,
          courseName: a.courseName,
          dueDate: a.dueDate,
          status: a.status,
          submissionsCount: a.submissionsCount || 0,
          totalMarks: a.totalMarks,
          _id: a._id
        }));
        break;
        
      case 'submissions':
        data = [];
        assignments.forEach(a => {
          const subs = a.submissions || [];
          if (subs.length > 0) {
            subs.forEach(sub => {
              data.push({
                type: 'submission',
                studentName: sub.studentId?.name || 'Unknown',
                studentEmail: sub.studentId?.email || 'N/A',
                assignmentTitle: a.title,
                courseName: a.courseName,
                submittedAt: sub.submittedAt,
                status: sub.status,
                obtainedMarks: sub.obtainedMarks,
                totalMarks: a.totalMarks,
                assignmentId: a._id,
                submissionId: sub._id
              });
            });
          }
        });
        break;
        
      case 'pending':
        data = [];
        assignments.forEach(a => {
          const subs = a.submissions || [];
          if (subs.length > 0) {
            subs
              .filter(sub => sub.status !== 'graded')
              .forEach(sub => {
                data.push({
                  type: 'pending',
                  studentName: sub.studentId?.name || 'Unknown',
                  studentEmail: sub.studentId?.email || 'N/A',
                  assignmentTitle: a.title,
                  courseName: a.courseName,
                  submittedAt: sub.submittedAt,
                  status: sub.status,
                  assignmentId: a._id,
                  submissionId: sub._id
                });
              });
          }
        });
        break;
        
      case 'overdue':
        // 🔥 FIXED: Check for status === 'overdue' (as set by backend)
        data = assignments
          .filter(a => a.status === 'overdue')
          .map(a => ({
            type: 'overdue',
            title: a.title,
            courseName: a.courseName,
            dueDate: a.dueDate,
            daysOverdue: Math.floor((now - new Date(a.dueDate)) / (1000 * 60 * 60 * 24)),
            submissionsCount: a.submissionsCount || 0,
            _id: a._id
          }));
        break;
        
      case 'today':
        data = [];
        assignments.forEach(a => {
          const subs = a.submissions || [];
          if (subs.length > 0) {
            subs
              .filter(sub => new Date(sub.submittedAt).toDateString() === today)
              .forEach(sub => {
                data.push({
                  type: 'today',
                  studentName: sub.studentId?.name || 'Unknown',
                  studentEmail: sub.studentId?.email || 'N/A',
                  assignmentTitle: a.title,
                  courseName: a.courseName,
                  submittedAt: sub.submittedAt,
                  status: sub.status,
                  assignmentId: a._id
                });
              });
          }
        });
        break;
        
      default:
        data = [];
    }

    setStatModalData(data);
    setActiveStatModal(statType);
  };

  // 🔥 NEW: Download Stat Data as CSV or PDF
  const downloadStatData = async (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${activeStatModal}_report_${timestamp}`;
    
    if (format === 'csv') {
      const headers = {
        total: ['Assignment Title', 'Course', 'Due Date', 'Status', 'Submissions'],
        submissions: ['Student Name', 'Email', 'Assignment', 'Course', 'Submitted At', 'Status', 'Marks'],
        pending: ['Student Name', 'Email', 'Assignment', 'Course', 'Submitted At', 'Status'],
        overdue: ['Assignment Title', 'Course', 'Due Date', 'Days Overdue', 'Submissions'],
        today: ['Student Name', 'Email', 'Assignment', 'Course', 'Submitted At', 'Status']
      };

      const currentHeaders = headers[activeStatModal] || [];
      const rows = statModalData.map(item => {
        switch(activeStatModal) {
          case 'total':
            return [item.title, item.courseName, new Date(item.dueDate).toLocaleDateString(), item.status, item.submissionsCount];
          case 'submissions':
            return [item.studentName, item.studentEmail, item.assignmentTitle, item.courseName, new Date(item.submittedAt).toLocaleString(), item.status, `${item.obtainedMarks}/${item.totalMarks}`];
          case 'pending':
            return [item.studentName, item.studentEmail, item.assignmentTitle, item.courseName, new Date(item.submittedAt).toLocaleString(), item.status];
          case 'overdue':
            return [item.title, item.courseName, new Date(item.dueDate).toLocaleDateString(), item.daysOverdue, item.submissionsCount];
          case 'today':
            return [item.studentName, item.studentEmail, item.assignmentTitle, item.courseName, new Date(item.submittedAt).toLocaleString(), item.status];
          default:
            return [];
        }
      });

      const csvContent = [currentHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV Downloaded!', { style: toastStyle });
    } else if (format === 'pdf') {
      // 🔥 NEW: Direct PDF Generation without print dialog
      await generatePDFReport(filename);
    }
  };

  // 🔥 NEW: Generate Professional PDF Report with Direct Download
  const generatePDFReport = async (filename) => {
    const title = getStatModalTitle();
    const currentDate = new Date().toLocaleString();
    
    // Dynamically import jsPDF
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    // Create temporary container for PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.background = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Generate table HTML based on activeStatModal
    let tableHTML = '';
    
    switch(activeStatModal) {
      case 'total':
        tableHTML = `
          <table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background: #000B29; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assignment Title</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Due Date</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Submissions</th>
              </tr>
            </thead>
            <tbody>
              ${statModalData.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.title}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.courseName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.dueDate).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-transform: uppercase;">${item.status}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.submissionsCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
        
      case 'submissions':
        tableHTML = `
          <table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
            <thead>
              <tr style="background: #000B29; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Student Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assignment</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Submitted</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Marks</th>
              </tr>
            </thead>
            <tbody>
              ${statModalData.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.studentName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">${item.studentEmail}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.assignmentTitle}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.courseName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.submittedAt).toLocaleString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-transform: uppercase;">${item.status}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.obtainedMarks}/${item.totalMarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
        
      case 'pending':
        tableHTML = `
          <table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background: #f59e0b; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Student Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assignment</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              ${statModalData.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#fffbeb' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.studentName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.studentEmail}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.assignmentTitle}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.courseName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
        
      case 'overdue':
        tableHTML = `
          <table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background: #E30613; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assignment Title</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Due Date</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Days Overdue</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Submissions</th>
              </tr>
            </thead>
            <tbody>
              ${statModalData.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#fef2f2' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.title}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.courseName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.dueDate).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #E30613; font-weight: bold;">${item.daysOverdue} days</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.submissionsCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
        
      case 'today':
        tableHTML = `
          <table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background: #10b981; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Student Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assignment</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${statModalData.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f0fdf4' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${item.studentName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.studentEmail}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.assignmentTitle}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.courseName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.submittedAt).toLocaleTimeString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
    }

    // Complete HTML content
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000B29; padding-bottom: 20px;">
        <h1 style="color: #000B29; margin: 0; font-size: 24px;">📊 ${title}</h1>
        <p style="color: #666; margin: 5px 0; font-size: 12px;">Generated on ${currentDate} | SkillsMind LMS</p>
      </div>
      
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #000B29;">${statModalData.length}</div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase;">Total Records</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #000B29;">${new Date().toLocaleDateString()}</div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase;">Report Date</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #000B29;">${activeStatModal.toUpperCase()}</div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase;">Report Type</div>
        </div>
      </div>
      
      ${tableHTML}
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 11px;">
        © ${new Date().getFullYear()} SkillsMind Learning Management System | Confidential Report
      </div>
    `;
    
    document.body.appendChild(container);
    
    try {
      // Show loading toast
      const loadId = toast.loading('Generating PDF...', { style: toastStyle });
      
      // Capture with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add more pages if content is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF directly
      pdf.save(`${filename}.pdf`);
      
      toast.success('PDF Downloaded Successfully!', { id: loadId, style: toastStyle });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { style: toastStyle });
    } finally {
      // Cleanup
      document.body.removeChild(container);
    }
  };

  // 🔥 MISSING FUNCTIONS ADDED HERE:
  
  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const openSubmissions = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    setShowSubmissions(true);
  };

  const closeSubmissions = () => {
    setShowSubmissions(false);
    setSelectedAssignmentId(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      openSubmissions(notification.assignmentId);
      
      const token = getToken();
      await axios.post(`${API_BASE}/assignments/admin/notifications/${notification._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setShowNotifications(false);
    } catch (err) {
      console.log('Notification click error:', err);
    }
  };

  const downloadSubmissionsList = (course) => {
    const rows = [];
    
    rows.push(['Course', 'Assignment #', 'Title', 'Due Date', 'Total Marks', 'Status', 'Submissions Count']);
    
    course.assignments.forEach(assignment => {
      rows.push([
        course.courseName,
        `Assignment ${assignment.courseAssignmentNo}`,
        assignment.title,
        new Date(assignment.dueDate).toLocaleDateString(),
        assignment.totalMarks,
        assignment.status,
        assignment.submissionsCount || 0
      ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${course.courseName}_assignments_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Download started!', { style: toastStyle });
  };

  const getGroupedAssignments = () => {
    let filtered = assignments.filter(a => {
      const matchesSearch = 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
      
      let matchesDate = true;
      const dueDate = new Date(a.dueDate);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = dueDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchesDate = dueDate >= today && dueDate <= weekFromNow;
      } else if (dateFilter === 'overdue') {
        matchesDate = a.status === 'overdue';
      }
      
      return matchesSearch && matchesFilter && matchesDate;
    });

    const grouped = {};
    filtered.forEach(assignment => {
      const courseId = assignment.courseId?._id || assignment.courseId || 'unknown';
      const courseName = assignment.courseName || 'Unknown Course';
      
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseId: courseId,
          courseName: courseName,
          assignments: []
        };
      }
      grouped[courseId].assignments.push(assignment);
    });

    Object.values(grouped).forEach(group => {
      group.assignments.sort((a, b) => a.courseAssignmentNo - b.courseAssignmentNo);
    });

    return Object.values(grouped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedCourse = courses.find(c => c._id === formData.courseId);
    
    if (!formData.title || !formData.courseId || !formData.dueDate) {
      toast.error("Please fill all required fields", { style: toastStyle });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('courseId', formData.courseId);
    formDataToSend.append('dueDate', formData.dueDate);
    formDataToSend.append('totalMarks', formData.totalMarks);
    formDataToSend.append('courseName', selectedCourse?.title || '');

    attachments.forEach(file => {
      formDataToSend.append('attachments', file);
    });

    const loadId = toast.loading('Creating...', { style: toastStyle });

    try {
      const token = getToken();
      
      let response;
      if (selectedAssignment) {
        response = await axios.put(
          `${API_BASE}/assignments/${selectedAssignment._id}`, 
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          `${API_BASE}/assignments`, 
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data.success) {
        toast.success(
          selectedAssignment ? 'Updated!' : `Created #${response.data.assignment.assignmentNo}!`, 
          { id: loadId, style: toastStyle }
        );
        fetchAssignments();
        setView('list');
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed', { id: loadId, style: toastStyle });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large`);
        return false;
      }
      return true;
    });
    
    setAttachments(validFiles);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    
    const loadId = toast.loading('Deleting...', { style: toastStyle });
    
    try {
      await axios.delete(`${API_BASE}/assignments/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      toast.success('Deleted!', { id: loadId, style: toastStyle });
      fetchAssignments();
    } catch (err) {
      toast.error('Delete failed', { id: loadId, style: toastStyle });
    }
  };

  const startEdit = (assignment) => {
    setSelectedAssignment(assignment);
    const courseId = assignment.courseId?._id || assignment.courseId;
    
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      courseId: courseId || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      totalMarks: assignment.totalMarks || 100,
      status: assignment.status || 'active'
    });
    setAttachments([]);
    setView('edit');
  };

  const startCreate = () => {
    resetForm();
    setSelectedAssignment(null);
    setView('create');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      dueDate: '',
      totalMarks: 100,
      status: 'active'
    });
    setAttachments([]);
    setSelectedAssignment(null);
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.pdf$/i)) return <FaFilePdf className="file-icon pdf" />;
    if (filename.match(/\.(doc|docx)$/i)) return <FaFileWord className="file-icon word" />;
    if (filename.match(/\.(zip|rar)$/i)) return <FaFileArchive className="file-icon archive" />;
    return <FaFileAlt className="file-icon" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#000B29', color: '#fff' },
      completed: { bg: '#16a34a', color: '#fff' },
      overdue: { bg: '#E30613', color: '#fff' },
      cancelled: { bg: '#9ca3af', color: '#fff' },
      submitted: { bg: '#3b82f6', color: '#fff' },
      graded: { bg: '#10b981', color: '#fff' },
      pending: { bg: '#f59e0b', color: '#fff' }
    };
    const style = styles[status] || styles.active;
    
    return (
      <span className="status-badge" style={{ 
        background: style.bg, 
        color: style.color,
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {status}
      </span>
    );
  };

  const groupedData = getGroupedAssignments();
  
  const flatAssignments = assignments.filter(a => {
    const matchesSearch = 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredRecentSubmissions = recentSubmissions.filter(sub => 
    sub.studentName?.toLowerCase().includes(recentSearchTerm.toLowerCase()) ||
    sub.assignmentTitle?.toLowerCase().includes(recentSearchTerm.toLowerCase()) ||
    sub.courseName?.toLowerCase().includes(recentSearchTerm.toLowerCase())
  );

  // 🔥 NEW: Stat Modal Title Helper
  const getStatModalTitle = () => {
    const titles = {
      total: 'Total Assignments Detail',
      submissions: 'All Submissions Detail',
      pending: 'Pending Reviews Detail',
      overdue: 'Overdue Assignments Detail',
      today: "Today's Submissions Detail"
    };
    return titles[activeStatModal] || 'Detail View';
  };

  if (showSubmissions && selectedAssignmentId) {
    return (
      <div className="submissions-view-wrapper">
        <SubmissionsView 
          assignmentId={selectedAssignmentId} 
          onClose={closeSubmissions}
        />
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <div className="form-container">
        <div className="form-header">
          <h2>
            {selectedAssignment ? <FaEdit /> : <FaPlus />}
            {selectedAssignment ? ' Edit Assignment' : ' Create New Assignment'}
          </h2>
          <button className="btn-back" onClick={() => setView('list')}>
            <FaArrowLeft /> Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div className="form-group">
              <label>Course *</label>
              {coursesLoading ? (
                <div className="loading-field"><FaSpinner className="spin" /> Loading...</div>
              ) : courses.length === 0 ? (
                <div className="error-field"><FaExclamationTriangle /> No courses available</div>
              ) : (
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.title} {c.category ? `(${c.category})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Total Marks *</label>
              <input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({...formData, totalMarks: parseInt(e.target.value) || 0})}
                min="1"
                max="1000"
                required
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter assignment description..."
              rows="5"
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Attachments (Optional)</label>
            <div className="file-upload-box">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                id="file-upload"
                className="hidden-input"
              />
              <label htmlFor="file-upload" className="upload-label">
                <FaFileAlt /> Click to upload files (Max 5, 10MB each)
              </label>
              {attachments.length > 0 && (
                <div className="selected-files">
                  {attachments.map((file, idx) => (
                    <span key={idx} className="file-tag">
                      {getFileIcon(file.name)}
                      {file.name}
                      <button 
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => setView('list')}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || courses.length === 0}
            >
              <FaSave /> {selectedAssignment ? 'Update' : 'Create'} Assignment
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="assignments-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1><FaTasks /> Assignment Management</h1>
          <p>Create and manage student assignments by course</p>
        </div>
        <div className="header-actions">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button 
              className="btn-notification"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4><FaBell /> Notifications</h4>
                  <button onClick={() => setShowNotifications(false)}><FaTimes /></button>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No new notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        className="notification-item clickable"
                        onClick={() => handleNotificationClick(notif)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="notification-icon">
                          <FaUserGraduate />
                        </div>
                        <div className="notification-content">
                          <p><strong>{notif.studentName}</strong> submitted <strong>{notif.assignmentTitle}</strong></p>
                          <span className="notification-time">
                            {new Date(notif.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <button 
                          className="btn-view-notif"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notif);
                          }}
                          title="View Submission"
                        >
                          <FaEye /> View
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button className="btn-create" onClick={startCreate}>
            <FaPlus /> Create New
          </button>
        </div>
      </div>

     {/* 🔥 NEW: Clickable Stats Dashboard */}
<div className="stats-dashboard">
  <div 
    className="stat-card clickable"
    onClick={() => handleStatCardClick('total')}
  >
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#E30613'
    }}>
      <FaClipboardList color="white" size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{stats.totalAssignments}</span>
      <span className="stat-label">Total Assignments</span>
    </div>
    <div className="stat-arrow"><FaChevronRight /></div>
  </div>
  
  <div 
    className="stat-card clickable"
    onClick={() => handleStatCardClick('submissions')}
  >
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#E30613'
    }}>
      <FaUsers color="white" size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{stats.totalSubmissions}</span>
      <span className="stat-label">Total Submissions</span>
    </div>
    <div className="stat-arrow"><FaChevronRight /></div>
  </div>
  
  <div 
    className="stat-card clickable"
    onClick={() => handleStatCardClick('pending')}
  >
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#E30613'
    }}>
      <FaHourglassHalf color="white" size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{stats.pendingReviews}</span>
      <span className="stat-label">Pending Reviews</span>
    </div>
    {stats.pendingReviews > 0 && (
      <div className="stat-alert">Needs attention!</div>
    )}
    <div className="stat-arrow"><FaChevronRight /></div>
  </div>
  
  <div 
    className="stat-card clickable"
    onClick={() => handleStatCardClick('overdue')}
  >
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#E30613'
    }}>
      <FaExclamationCircle color="white" size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{stats.overdueAssignments}</span>
      <span className="stat-label">Overdue</span>
    </div>
    <div className="stat-arrow"><FaChevronRight /></div>
  </div>
  
  <div 
    className="stat-card clickable highlight"
    onClick={() => handleStatCardClick('today')}
  >
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '8px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#E30613'
    }}>
      <FaCalendarDay color="white" size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{stats.todaySubmissions}</span>
      <span className="stat-label">Today's Submissions</span>
    </div>
    <div className="stat-arrow"><FaChevronRight /></div>
  </div>
</div>

      {/* 🔥 NEW: Recent Submissions Dropdown */}
      <div className="recent-submissions-dropdown-wrapper">
        <div 
          className="recent-dropdown-header"
          onClick={() => setShowRecentDropdown(!showRecentDropdown)}
        >
          <div className="dropdown-title">
            <FaHistory />
            <span>Recent Submissions</span>
            <span className="dropdown-badge">{filteredRecentSubmissions.length}</span>
          </div>
          <div className="dropdown-actions">
            <div className="recent-search-box" onClick={(e) => e.stopPropagation()}>
              <FaSearch />
              <input
                type="text"
                placeholder="Search submissions..."
                value={recentSearchTerm}
                onChange={(e) => setRecentSearchTerm(e.target.value)}
              />
              {recentSearchTerm && (
                <button 
                  className="clear-search"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecentSearchTerm('');
                  }}
                >
                  <FaTimes />
                </button>
              )}
            </div>
            <button className={`dropdown-toggle ${showRecentDropdown ? 'open' : ''}`}>
              <FaChevronDown />
            </button>
          </div>
        </div>

        {showRecentDropdown && (
          <div className="recent-dropdown-content">
            {filteredRecentSubmissions.length === 0 ? (
              <div className="dropdown-empty">
                <FaInbox size={48} />
                <p>No recent submissions found</p>
              </div>
            ) : (
              <div className="dropdown-list">
                {filteredRecentSubmissions.map((sub, index) => (
                  <div 
                    key={sub._id} 
                    className="dropdown-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-avatar">
                      {sub.studentProfilePic ? (
                        <img src={sub.studentProfilePic} alt={sub.studentName} />
                      ) : (
                        sub.studentName?.charAt(0) || 'S'
                      )}
                    </div>
                    <div className="item-details">
                      <div className="item-primary">
                        <span className="student-name">{sub.studentName}</span>
                        <span className="course-tag">{sub.courseName}</span>
                      </div>
                      <div className="item-secondary">
                        <span className="assignment-name">{sub.assignmentTitle}</span>
                        <span className="submit-time">
                          <FaClock /> {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="item-status">
                      {getStatusBadge(sub.status)}
                    </div>
                    <button 
                      className="btn-view-item"
                      onClick={() => openSubmissions(sub.assignmentId)}
                    >
                      <FaEye /> View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select">
          <FaFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="filter-select">
          <FaCalendarAlt />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="view-toggle">
          <button 
            className={viewMode === 'grouped' ? 'active' : ''}
            onClick={() => setViewMode('grouped')}
            title="Grouped by Course"
          >
            <FaThLarge />
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <FaThList />
          </button>
        </div>

        <button className="btn-refresh" onClick={() => {
          fetchAssignments();
          fetchNotifications();
          fetchRecentSubmissions();
        }}>
          <FaSync /> Refresh
        </button>
      </div>

      {/* Course Groups or List View */}
      <div className={viewMode === 'grouped' ? 'course-groups' : 'assignments-list-view'}>
        {loading ? (
          <div className="loading-cell">
            <FaSpinner className="spin" /> Loading assignments...
          </div>
        ) : viewMode === 'grouped' ? (
          groupedData.length > 0 ? (
            groupedData.map((course) => (
              <div key={course.courseId} className="course-card">
                <div 
                  className="course-header"
                  onClick={() => toggleCourse(course.courseId)}
                >
                  <div className="course-info">
                    <div className="course-icon-box">
                      <FaBook />
                    </div>
                    <div>
                      <h3>{course.courseName}</h3>
                      <span className="assignment-count">
                        {course.assignments.length} assignments
                      </span>
                    </div>
                  </div>
                  <div className="course-stats">
                    <div className="stat">
                      <span className="stat-value">
                        {course.assignments.reduce((acc, a) => acc + (a.submissionsCount || 0), 0)}
                      </span>
                      <span className="stat-label">Submissions</span>
                    </div>
                    <button 
                      className="btn-download-list"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSubmissionsList(course);
                      }}
                      title="Download List"
                    >
                      <FaFileExcel />
                    </button>
                    <button className={`expand-btn ${expandedCourses[course.courseId] ? 'open' : ''}`}>
                      <FaChevronDown />
                    </button>
                  </div>
                </div>

                <div className={`course-assignments ${expandedCourses[course.courseId] ? 'expanded' : ''}`}>
                  {course.assignments.map(assignment => (
                    <div key={assignment._id} className="assignment-row">
                      <div className="assignment-info">
                        <span className="asm-number">#{assignment.courseAssignmentNo}</span>
                        <div className="assignment-details">
                          <h4>{assignment.title}</h4>
                          <div className="assignment-meta">
                            <span><FaCalendarAlt /> {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            <span>{assignment.totalMarks} marks</span>
                            {getStatusBadge(assignment.status)}
                            {assignment.status === 'overdue' && (
                              <span className="overdue-badge"><FaExclamationCircle /> Overdue</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="assignment-actions">
                        <button 
                          className="btn-submissions"
                          onClick={() => openSubmissions(assignment._id)}
                        >
                          <FaUsers /> {assignment.submissionsCount || 0} submissions
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => startEdit(assignment)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(assignment._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-large">
              <FaTasks size={64} />
              <h3>No assignments found</h3>
              <p>Create your first assignment to get started</p>
            </div>
          )
        ) : (
          flatAssignments.length > 0 ? (
            <div className="flat-assignments-list">
              {flatAssignments.map(assignment => (
                <div key={assignment._id} className="assignment-row list-view">
                  <div className="assignment-info">
                    <span className="asm-number">#{assignment.courseAssignmentNo}</span>
                    <div className="assignment-details">
                      <h4>{assignment.title}</h4>
                      <div className="assignment-meta">
                        <span className="course-tag"><FaBook /> {assignment.courseName}</span>
                        <span><FaCalendarAlt /> {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>{assignment.totalMarks} marks</span>
                        {getStatusBadge(assignment.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="assignment-actions">
                    <button 
                      className="btn-submissions"
                      onClick={() => openSubmissions(assignment._id)}
                    >
                      <FaUsers /> {assignment.submissionsCount || 0}
                    </button>
                    <button 
                      className="btn-edit" 
                      onClick={() => startEdit(assignment)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(assignment._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-large">
              <FaTasks size={64} />
              <h3>No assignments found</h3>
              <p>Create your first assignment to get started</p>
            </div>
          )
        )}
      </div>

      {/* 🔥 NEW: Stat Detail Modal */}
      {activeStatModal && (
        <div className="stat-modal-overlay" onClick={() => setActiveStatModal(null)}>
          <div className="stat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stat-modal-header">
              <h2>
                {activeStatModal === 'total' && <FaClipboardList />}
                {activeStatModal === 'submissions' && <FaUsers />}
                {activeStatModal === 'pending' && <FaHourglassHalf />}
                {activeStatModal === 'overdue' && <FaExclamationCircle />}
                {activeStatModal === 'today' && <FaCalendarDay />}
                {getStatModalTitle()}
              </h2>
              <div className="modal-actions">
                <button 
                  className="btn-download-modal"
                  onClick={() => downloadStatData('csv')}
                  title="Download CSV"
                >
                  <FaFileExcel /> Export CSV
                </button>
                <button 
                  className="btn-download-modal pdf"
                  onClick={() => downloadStatData('pdf')}
                  title="Download PDF"
                >
                  <FaFilePdf /> Export PDF
                </button>
                <button 
                  className="btn-close-modal"
                  onClick={() => setActiveStatModal(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="stat-modal-content">
              {statModalData.length === 0 ? (
                <div className="modal-empty">
                  <FaInbox size={64} />
                  <p>No data available</p>
                </div>
              ) : (
                <div className="modal-list">
                  {statModalData.map((item, index) => (
                    <div key={index} className="modal-item">
                      {activeStatModal === 'total' && (
                        <>
                          <div className="item-header">
                            <span className="item-title">{item.title}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="item-meta">
                            <span><FaBook /> {item.courseName}</span>
                            <span><FaCalendarAlt /> Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                            <span><FaUsers /> {item.submissionsCount} submissions</span>
                          </div>
                          <button 
                            className="btn-view-modal"
                            onClick={() => openSubmissions(item._id)}
                          >
                            <FaEye /> View
                          </button>
                        </>
                      )}
                      
                      {activeStatModal === 'submissions' && (
                        <>
                          <div className="item-header">
                            <span className="item-title">{item.studentName}</span>
                            <span className="item-email">{item.studentEmail}</span>
                          </div>
                          <div className="item-meta">
                            <span><FaBook /> {item.courseName}</span>
                            <span><FaTasks /> {item.assignmentTitle}</span>
                            <span><FaClock /> {new Date(item.submittedAt).toLocaleString()}</span>
                          </div>
                          <div className="item-footer">
                            {getStatusBadge(item.status)}
                            <span className="marks">
                              <FaTrophy /> {item.obtainedMarks}/{item.totalMarks} marks
                            </span>
                            <button 
                              className="btn-view-modal"
                              onClick={() => openSubmissions(item.assignmentId)}
                            >
                              <FaEye /> View
                            </button>
                          </div>
                        </>
                      )}
                      
                      {activeStatModal === 'pending' && (
                        <>
                          <div className="item-header">
                            <span className="item-title">{item.studentName}</span>
                            <span className="pending-badge">Pending Review</span>
                          </div>
                          <div className="item-meta">
                            <span><FaBook /> {item.courseName}</span>
                            <span><FaTasks /> {item.assignmentTitle}</span>
                            <span><FaClock /> Submitted: {new Date(item.submittedAt).toLocaleString()}</span>
                          </div>
                          <button 
                            className="btn-view-modal urgent"
                            onClick={() => openSubmissions(item.assignmentId)}
                          >
                            <FaEye /> Review Now
                          </button>
                        </>
                      )}
                      
                      {activeStatModal === 'overdue' && (
                        <>
                          <div className="item-header">
                            <span className="item-title">{item.title}</span>
                            <span className="overdue-badge">{item.daysOverdue} days overdue</span>
                          </div>
                          <div className="item-meta">
                            <span><FaBook /> {item.courseName}</span>
                            <span><FaCalendarAlt /> Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                            <span><FaUsers /> {item.submissionsCount} submissions</span>
                          </div>
                          <button 
                            className="btn-view-modal"
                            onClick={() => openSubmissions(item._id)}
                          >
                            <FaEye /> View
                          </button>
                        </>
                      )}
                      
                      {activeStatModal === 'today' && (
                        <>
                          <div className="item-header">
                            <span className="item-title">{item.studentName}</span>
                            <span className="today-badge">Today</span>
                          </div>
                          <div className="item-meta">
                            <span><FaBook /> {item.courseName}</span>
                            <span><FaTasks /> {item.assignmentTitle}</span>
                            <span><FaClock /> {new Date(item.submittedAt).toLocaleTimeString()}</span>
                          </div>
                          <button 
                            className="btn-view-modal"
                            onClick={() => openSubmissions(item.assignmentId)}
                          >
                            <FaEye /> View
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;