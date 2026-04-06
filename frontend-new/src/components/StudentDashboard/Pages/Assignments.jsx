import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { 
  FaDownload, FaUpload, FaCheckCircle, FaClock, 
  FaExclamationTriangle, FaFileAlt, FaTimes, FaPaperPlane,
  FaStar, FaCalendarAlt, FaBook, FaSearch, FaFilter,
  FaEye, FaFilePdf, FaFileWord, FaFileArchive, FaCheck,
  FaChevronDown, FaGraduationCap, FaBell,
  FaBellSlash, FaChartLine, FaClipboardCheck, FaExclamationCircle,
  FaEdit, FaSave, FaChevronLeft, FaFolderOpen, FaTasks
} from 'react-icons/fa';
import "./Assignments.css";

// 🔥 NEW: Smart Deadline Countdown Component
const DeadlineCountdown = ({ dueDate, status }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (status === 'graded' || status === 'submitted') return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const difference = due - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      
      if (days < 1) setIsUrgent(true);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [dueDate, status]);

  if (status === 'graded' || status === 'submitted') {
    return <span className="countdown-complete">✓ Complete</span>;
  }

  const { days, hours, minutes, seconds } = timeLeft;
  
  let displayText = '';
  let urgencyClass = 'countdown-normal';
  
  if (days > 3) {
    displayText = `${days}d ${hours}h left`;
  } else if (days >= 1) {
    displayText = `${days}d ${hours}h ${minutes}m`;
    urgencyClass = 'countdown-warning';
  } else if (hours >= 1) {
    displayText = `${hours}h ${minutes}m ${seconds}s`;
    urgencyClass = 'countdown-urgent';
  } else {
    displayText = `${minutes}m ${seconds}s`;
    urgencyClass = 'countdown-critical';
  }

  if (days < 0 || (days === 0 && hours === 0 && minutes === 0 && seconds === 0)) {
    return <span className="countdown-overdue">⚠ Overdue</span>;
  }

  return (
    <div className={`deadline-countdown ${urgencyClass}`}>
      <FaClock className="countdown-icon" />
      <span>{displayText}</span>
    </div>
  );
};

// ============================================
// 🆕 UPDATED: Assignments Component with onNavigate prop
// ============================================
const Assignments = ({ onNavigate }) => {
  const [filter, setFilter] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  
  // Modal States
  const [submitModal, setSubmitModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submitFiles, setSubmitFiles] = useState([]);
  const [submitComments, setSubmitComments] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const enrolledCoursesRef = useRef(enrolledCourses);
  enrolledCoursesRef.current = enrolledCourses;

  const getUserId = () => {
    try {
      const user = localStorage.getItem('user');
      if (user && user !== 'undefined' && user !== 'null') {
        const parsed = JSON.parse(user);
        return parsed._id || parsed.id || parsed.userId;
      }
      return localStorage.getItem('userId') || localStorage.getItem('studentId');
    } catch (e) {
      return localStorage.getItem('userId');
    }
  };

  const getToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('accessToken');
  };

  const studentId = getUserId();
  const token = getToken();
  const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem(`notifications_${studentId}`);
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, [studentId]);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(`notifications_${studentId}`, JSON.stringify(notifications));
    }
  }, [notifications, studentId]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Due date reminders check
  useEffect(() => {
    if (assignments.length === 0) return;
    
    const checkDueDates = () => {
      const now = new Date();
      
      assignments.forEach(assignment => {
        if (assignment.status === 'pending' || assignment.status === 'overdue') {
          const dueDate = new Date(assignment.dueDate);
          const hoursLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60));
          
          if ([24, 12, 4, 1].includes(hoursLeft) && hoursLeft > 0) {
            const reminderKey = `reminder_${assignment._id}_${hoursLeft}`;
            const sentReminders = JSON.parse(localStorage.getItem('sentReminders') || '[]');
            
            if (!sentReminders.includes(reminderKey)) {
              sentReminders.push(reminderKey);
              localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
              
              const reminder = {
                id: Date.now(),
                type: 'reminder',
                title: 'Due Date Reminder',
                message: `${assignment.title} due in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`,
                assignmentId: assignment._id,
                courseId: assignment.courseId,
                createdAt: new Date().toISOString(),
                read: false,
                data: assignment
              };
              
              setNotifications(prev => [reminder, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              toast.error(`⏰ ${assignment.title} due in ${hoursLeft}h!`, {
                duration: 8000,
                action: {
                  label: 'Submit Now',
                  onClick: () => handleNotificationClick(reminder)
                }
              });
            }
          }
        }
      });
    };
    
    const interval = setInterval(checkDueDates, 5 * 60 * 1000);
    checkDueDates();
    
    return () => clearInterval(interval);
  }, [assignments]);

  // Setup socket and fetch data
  useEffect(() => {
    if (!studentId || !token) {
      setError('Please login first to view assignments');
      setLoading(false);
      return;
    }
    
    const newSocket = setupSocketConnection();
    checkEnrollmentAndFetchAssignments();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const checkEnrollmentAndFetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUserId = getUserId();
      const currentToken = getToken();
      
      if (!currentUserId || !currentToken) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      let enrolledCourseIds = [];
      
      try {
        const userRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        
        const userData = userRes.data.user || userRes.data;
        enrolledCourseIds = userData?.enrolledCourses || [];
        
      } catch (err1) {
        try {
          const profileRes = await axios.get(`${API_BASE}/student-profile/details/${currentUserId}`, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          
          const profile = profileRes.data.profile || profileRes.data;
          enrolledCourseIds = profile?.enrolledCourses || [];
        } catch (err2) {
          setError('Failed to fetch enrollment data');
          setLoading(false);
          return;
        }
      }
      
      setEnrolledCourses(enrolledCourseIds);
      
      if (enrolledCourseIds && enrolledCourseIds.length > 0) {
        setIsEnrolled(true);
        await fetchAssignmentsForStudent(currentUserId, currentToken);
      } else {
        setIsEnrolled(false);
        setAssignments([]);
        setLoading(false);
      }
      
    } catch (err) {
      setError('Failed to check enrollment');
      setLoading(false);
    }
  };

  const fetchAssignmentsForStudent = async (userId, authToken) => {
    try {
      const response = await axios.get(`${API_BASE}/assignments/student/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.data.success) {
        const fetchedAssignments = (response.data.assignments || []).map(a => ({
          ...a,
          id: a.id || a._id,
          _id: a._id || a.id
        }));
        
        const assignmentsWithCourseNumbers = addCourseAssignmentNumbers(fetchedAssignments);
        setAssignments(assignmentsWithCourseNumbers);
        
        // 🆕 FIX: All courses collapsed by default
        const courseIds = [...new Set(assignmentsWithCourseNumbers.map(a => a.courseId))];
        const expanded = {};
        courseIds.forEach(id => { expanded[id] = false; }); // false = collapsed
        setExpandedCourses(expanded);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const addCourseAssignmentNumbers = (assignmentsList) => {
    const courseCounters = {};
    
    const sorted = [...assignmentsList].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    return sorted.map(assignment => {
      const courseId = assignment.courseId || 'unknown';
      
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

  const setupSocketConnection = () => {
    try {
      const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        if (studentId) {
          const cleanStudentId = studentId.toString().trim();
          newSocket.emit('joinStudentRoom', cleanStudentId);
          
          if (enrolledCoursesRef.current && enrolledCoursesRef.current.length > 0) {
            enrolledCoursesRef.current.forEach(courseId => {
              newSocket.emit('joinCourse', courseId.toString());
            });
          }
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
      });

      newSocket.on('newAssignment', (data) => {
        console.log('📚 New assignment received:', data);
        
        if (!data.assignment) return;
        
        const assignment = data.assignment;
        
        const newNotification = {
          id: Date.now(),
          type: 'new_assignment',
          title: 'New Assignment Assigned',
          message: `${assignment.title} in ${assignment.courseName}`,
          assignmentId: assignment.id,
          courseId: assignment.courseId,
          createdAt: new Date().toISOString(),
          read: false,
          data: assignment
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.success(`📚 New assignment: ${assignment.title}`, {
          duration: 6000,
          action: {
            label: 'View',
            onClick: () => handleNotificationClick(newNotification)
          }
        });
        
        setAssignments(prev => {
          const exists = prev.some(a => (a.id || a._id) === assignment.id);
          if (exists) return prev;
          return [{
            id: assignment.id,
            _id: assignment.id,
            assignmentNo: assignment.assignmentNo,
            title: assignment.title,
            description: assignment.description,
            courseName: assignment.courseName,
            courseId: assignment.courseId,
            dueDate: assignment.dueDate,
            totalMarks: assignment.totalMarks,
            status: 'pending',
            createdAt: assignment.createdAt
          }, ...prev];
        });
        
        checkEnrollmentAndFetchAssignments();
      });

      newSocket.on('assignmentGraded', (data) => {
        console.log('🎉 Assignment graded:', data);
        
        const notification = {
          id: Date.now(),
          type: 'graded',
          title: 'Assignment Graded',
          message: `${data.assignmentTitle} - You scored ${data.obtainedMarks}/${data.totalMarks}`,
          assignmentId: data.assignmentId,
          createdAt: new Date().toISOString(),
          read: false,
          data: data
        };
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.success(`🎉 Graded: ${data.assignmentTitle} - ${data.obtainedMarks}/${data.totalMarks}`, {
          duration: 6000,
          action: {
            label: 'View',
            onClick: () => handleNotificationClick(notification)
          }
        });
        
        checkEnrollmentAndFetchAssignments();
      });

      newSocket.on('submissionConfirmed', (data) => {
        toast.success(`✅ ${data.assignmentTitle} submitted successfully!`);
        checkEnrollmentAndFetchAssignments();
      });

      return newSocket;

    } catch (err) {
      console.error('Socket setup error:', err);
      return null;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    const assignment = assignments.find(a => 
      (a._id || a.id) === notification.assignmentId || 
      (a._id || a.id) === notification.data?._id ||
      (a._id || a.id) === notification.data?.id
    );
    
    if (assignment) {
      setExpandedCourses(prev => ({
        ...prev,
        [assignment.courseId]: true
      }));
      
      openViewModal(assignment);
      
      setTimeout(() => {
        const element = document.getElementById(`assignment-${assignment._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-assignment');
          setTimeout(() => element.classList.remove('highlight-assignment'), 3000);
        }
      }, 300);
    } else {
      checkEnrollmentAndFetchAssignments();
    }
    
    setShowNotifications(false);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${studentId}`);
  };

  const deleteNotification = (e, notificationId) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const updated = notifications.filter(n => n.id !== notificationId);
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_assignment': return <FaBook />;
      case 'graded': return <FaStar />;
      case 'reminder': return <FaClock />;
      default: return <FaBell />;
    }
  };

  const openViewModal = (assignment) => {
    setViewingAssignment(assignment);
    setViewModal(true);
  };

  const openSubmitModal = (assignment) => {
    setSubmittingAssignment(assignment);
    setSubmitFiles([]);
    setSubmitComments('');
    setSubmitModal(true);
  };

 // ============================================
// 🆕 UPDATED: Open Assignment Builder - With Real Student Data
// ============================================
const openAssignmentBuilder = (assignment) => {
  // 🔥 Get real user data from localStorage
  const userStr = localStorage.getItem('user');
  let userData = {};
  try {
    userData = JSON.parse(userStr) || {};
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  // 🔥 Prepare complete assignment data with real student info
  const assignmentData = {
    _id: assignment._id,
    courseId: assignment.courseId,
    title: assignment.title,
    courseName: assignment.courseName,
    courseAssignmentNo: assignment.courseAssignmentNo,
    description: assignment.description,
    dueDate: assignment.dueDate,
    totalMarks: assignment.totalMarks,
    // 🔥 Real student data
    studentName: userData.name || userData.fullName || userData.username || 'Student',
    studentEmail: userData.email || '',
    studentId: userData.studentId || userData._id || userData.id || '',
    // 🔥 Course data
    courseCode: assignment.courseCode || '',
    assignmentNo: assignment.assignmentNo || assignment.courseAssignmentNo
  };

  console.log('🔥 Opening Assignment Builder with data:', assignmentData);

  // Store in localStorage
  localStorage.setItem('currentAssignment', JSON.stringify(assignmentData));
  
  // Navigate internally
  if (onNavigate) {
    onNavigate('assignment-builder');
  } else {
    window.location.href = `/assignment-builder?id=${assignment._id}&courseId=${assignment.courseId}`;
  }
};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-rar-compressed', 'text/plain'];
    const maxSize = 10 * 1024 * 1024;

    const invalidFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return true;
      }
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|zip|rar|txt)$/i)) {
        toast.error(`${file.name} is not a valid file type`);
        return true;
      }
      return false;
    });

    if (invalidFiles.length === 0) {
      setSubmitFiles(files);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submitFiles.length) {
      toast.error('Please select at least one file');
      return;
    }

    setSubmitLoading(true);
    const formData = new FormData();
    
    submitFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('comments', submitComments);

    try {
      const response = await axios.post(
        `${API_BASE}/assignments/${submittingAssignment._id}/submit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Assignment submitted successfully!');
        setSubmitModal(false);
        checkEnrollmentAndFetchAssignments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.pdf$/i)) return <FaFilePdf className="file-icon pdf" />;
    if (filename.match(/\.(doc|docx)$/i)) return <FaFileWord className="file-icon word" />;
    if (filename.match(/\.(zip|rar)$/i)) return <FaFileArchive className="file-icon archive" />;
    return <FaFileAlt className="file-icon" />;
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const getGroupedAssignments = () => {
    const filtered = assignments.filter(assignment => {
      const matchesSearch = 
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.courseName?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filter === 'pending') matchesFilter = ['pending', 'overdue'].includes(assignment.status);
      else if (filter === 'submitted') matchesFilter = assignment.status === 'submitted';
      else if (filter === 'graded') matchesFilter = assignment.status === 'graded';

      return matchesSearch && matchesFilter;
    });

    const grouped = {};
    filtered.forEach(assignment => {
      const courseId = assignment.courseId || 'unknown';
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseName: assignment.courseName,
          courseId: courseId,
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'graded': return { bg: '#10b981', color: '#ffffff', label: 'Graded' };
      case 'submitted': return { bg: '#3b82f6', color: '#ffffff', label: 'Submitted' };
      case 'pending': return { bg: '#f59e0b', color: '#ffffff', label: 'Pending' };
      case 'overdue': return { bg: '#ef4444', color: '#ffffff', label: 'Overdue' };
      default: return { bg: '#6b7280', color: '#ffffff', label: 'Pending' };
    }
  };

  const calculateDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCounts = () => ({
    all: assignments.length,
    pending: assignments.filter(a => ['pending', 'overdue'].includes(a.status)).length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    graded: assignments.filter(a => a.status === 'graded').length
  });

  const getAnalytics = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'graded' || a.status === 'submitted').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const gradedAssignments = assignments.filter(a => a.status === 'graded');
    const averageScore = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((acc, curr) => 
          acc + (curr.obtainedMarks / curr.totalMarks) * 100, 0) / gradedAssignments.length)
      : 0;
    
    const dueSoon = assignments.filter(a => {
      const daysLeft = calculateDaysLeft(a.dueDate);
      return (a.status === 'pending' || a.status === 'overdue') && daysLeft <= 3 && daysLeft >= 0;
    }).length;

    return { completionRate, averageScore, dueSoon };
  };

  const getCourseStats = (courseAssignments) => {
    const total = courseAssignments.length;
    const completed = courseAssignments.filter(a => a.status === 'graded' || a.status === 'submitted').length;
    const pending = courseAssignments.filter(a => a.status === 'pending' || a.status === 'overdue').length;
    return { total, completed, pending };
  };

  const counts = getCounts();
  const analytics = getAnalytics();
  const groupedData = getGroupedAssignments();

  if (loading) {
    return (
      <div className="assignments-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignments-container">
        <div className="error-state">
          <FaExclamationTriangle size={48} color="#dc2626" />
          <p>{error}</p>
          <button onClick={checkEnrollmentAndFetchAssignments} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      {/* Header with Notification Bell */}
      <div className="page-header">
        <div className="header-left">
          <div className="icon-circle">
            <FaGraduationCap />
          </div>
          <div>
            <h1>My Assignments</h1>
            <p>Track your coursework and submissions</p>
          </div>
        </div>
        
        {/* Notification Bell */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                <div className="notification-actions">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="btn-text">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="btn-text danger">
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <FaBellSlash size={24} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`notification-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={`notification-icon ${notif.type}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="notification-content">
                        <h5>{notif.title}</h5>
                        <p>{notif.message}</p>
                        <span className="notification-time">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.read && <div className="unread-dot"></div>}
                      <button 
                        className="delete-notif-btn"
                        onClick={(e) => deleteNotification(e, notif.id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="stats-container">
          <div className="header-stat-box">
            <div className="header-stat-icon stat-total">
              <FaBook />
            </div>
            <div className="header-stat-info">
              <span className="header-stat-value">{counts.all}</span>
              <span className="header-stat-label">Total</span>
            </div>
          </div>
          <div className="header-stat-box">
            <div className="header-stat-icon stat-pending">
              <FaClock />
            </div>
            <div className="header-stat-info">
              <span className="header-stat-value">{counts.pending}</span>
              <span className="header-stat-label">Pending</span>
            </div>
          </div>
          <div className="header-stat-box">
            <div className="header-stat-icon stat-submitted">
              <FaCheckCircle />
            </div>
            <div className="header-stat-info">
              <span className="header-stat-value">{counts.submitted}</span>
              <span className="header-stat-label">Submitted</span>
            </div>
          </div>
          <div className="header-stat-box">
            <div className="header-stat-icon stat-graded">
              <FaStar />
            </div>
            <div className="header-stat-info">
              <span className="header-stat-value">{counts.graded}</span>
              <span className="header-stat-label">Graded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="analytics-bar">
        <div className="progress-ring">
          <svg viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#000B29"
              strokeWidth="3"
              strokeDasharray={`${analytics.completionRate}, 100`}
            />
          </svg>
          <div className="progress-text">
            <span className="percentage">{analytics.completionRate}%</span>
            <span className="label">Complete</span>
          </div>
        </div>
        
        <div className="analytics-details">
          <div className="analytic-item">
            <FaChartLine />
            <div>
              <span className="value">{analytics.averageScore}%</span>
              <span className="label">Avg Grade</span>
            </div>
          </div>
          <div className="analytic-item urgent">
            <FaExclamationCircle />
            <div>
              <span className="value">{analytics.dueSoon}</span>
              <span className="label">Due Soon</span>
            </div>
          </div>
          <div className="analytic-item">
            <FaClipboardCheck />
            <div>
              <span className="value">{counts.graded}</span>
              <span className="label">Graded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="controls-bar">
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'graded', label: 'Graded' }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 🆕 NEW: Course Grid View */}
      <div className="courses-list">
        {!isEnrolled ? (
          <div className="empty-state">
            <FaGraduationCap size={48} />
            <h3>Not Enrolled in Any Course</h3>
            <p>You need to enroll in a course to view assignments.</p>
            <button onClick={() => window.location.href = '/get-enrolment'} className="btn-primary">
              Browse Courses
            </button>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="empty-state">
            <FaBook size={48} />
            <h3>No Assignments Found</h3>
            <p>No assignments match your current filter.</p>
            <button onClick={checkEnrollmentAndFetchAssignments} className="btn-secondary">
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* 🆕 Course Cards Grid - 3 per row */}
            <div className="course-grid">
              {groupedData.map((course) => {
                const stats = getCourseStats(course.assignments);
                const isExpanded = expandedCourses[course.courseId];
                
                return (
                  <div 
                    key={course.courseId} 
                    className={`course-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCourse(course.courseId)}
                  >
                    <div className="course-card-header">
                      <div className="course-icon-wrapper">
                        <FaFolderOpen />
                      </div>
                      <div className="course-card-info">
                        <h3>{course.courseName}</h3>
                        <div className="course-stats-row">
                          <span className="stat-pill total">{stats.total} Total</span>
                          <span className="stat-pill pending">{stats.pending} Pending</span>
                          <span className="stat-pill completed">{stats.completed} Done</span>
                        </div>
                      </div>
                      <button className={`expand-btn ${isExpanded ? 'open' : ''}`}>
                        <FaChevronDown />
                      </button>
                    </div>
                    
                    {/* 🆕 Assignments Dropdown */}
                    {isExpanded && (
                      <div className="course-assignments-dropdown">
                        <div className="assignments-grid expanded">
                          {course.assignments.map((assignment) => {
                            const daysLeft = calculateDaysLeft(assignment.dueDate);
                            const isOverdue = daysLeft < 0;
                            const statusStyle = getStatusColor(assignment.status);
                            const isUrgent = daysLeft <= 2 && daysLeft >= 0 && assignment.status === 'pending';
                            
                            return (
                              <div 
                                key={assignment._id} 
                                id={`assignment-${assignment._id}`}
                                className={`assignment-card ${isUrgent ? 'urgent' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* ==========================================
                                    VERTICAL LAYOUT: Same for Desktop & Mobile
                                    ========================================== */}
                                
                                {/* Title - TOP CENTER (Full Width) */}
                                <h4 className="asm-title">{assignment.title}</h4>
                                
                                {/* Number and Status Row - BELOW TITLE */}
                                <div className="card-header-info">
                                  <span className="asm-number">#{assignment.courseAssignmentNo}</span>
                                  <span 
                                    className="status-badge"
                                    style={{ 
                                      background: statusStyle.bg, 
                                      color: statusStyle.color 
                                    }}
                                  >
                                    {statusStyle.label}
                                  </span>
                                </div>
                                
                                <div className="card-body">
                                  <p className="asm-desc">{assignment.description?.substring(0, 100)}...</p>
                                  
                                  {/* 🆕 PDF FILES SECTION ADDED HERE */}
                                  {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div className="pdf-files-section">
                                      <div className="pdf-files-list">
                                        {assignment.attachments.map((file, idx) => (
                                          <a 
                                            key={idx}
                                            href={`${import.meta.env.VITE_API_URL}${file.url}`}
                                            download
                                            className="pdf-file-item"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FaFilePdf className="pdf-icon" />
                                            <span className="pdf-filename">{file.filename}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="card-meta">
                                    <div className="meta-item countdown">
                                      <DeadlineCountdown 
                                        dueDate={assignment.dueDate} 
                                        status={assignment.status} 
                                      />
                                    </div>
                                    <div className="meta-item marks">
                                      <FaStar />
                                      <span>{assignment.totalMarks} marks</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="card-footer">
                                  {assignment.status === 'graded' ? (
                                    <div className="grade-display">
                                      <FaStar className="star-icon" />
                                      <span className="score">{assignment.obtainedMarks}</span>
                                      <span className="total">/{assignment.totalMarks}</span>
                                    </div>
                                  ) : (
                                    <div className="marks-display">{assignment.totalMarks} marks</div>
                                  )}
                                  
                                  <div className="card-actions">
                                    <button 
                                      className="btn-view"
                                      onClick={() => openViewModal(assignment)}
                                      title="View Details"
                                    >
                                      <FaEye />
                                    </button>
                                    
                                    {(assignment.status === 'pending' || assignment.status === 'overdue') && (
                                      <button 
                                        className="btn-build"
                                        onClick={() => openAssignmentBuilder(assignment)}
                                        title="Create Assignment"
                                      >
                                        <FaEdit /> Build
                                      </button>
                                    )}
                                    
                                    {assignment.status === 'pending' || assignment.status === 'overdue' ? (
                                      <button 
                                        className="btn-submit"
                                        onClick={() => openSubmitModal(assignment)}
                                      >
                                        <FaUpload /> Submit
                                      </button>
                                    ) : assignment.status === 'submitted' ? (
                                      <button className="btn-status submitted" disabled>
                                        <FaCheck /> Done
                                      </button>
                                    ) : (
                                      <button className="btn-status graded" disabled>
                                        <FaStar /> Graded
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewModal && viewingAssignment && (
        <div className="modal-overlay" onClick={() => setViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#000B29' }}>
              <div className="modal-title">
                <span className="asm-badge">#{viewingAssignment.courseAssignmentNo}</span>
                <h3 style={{ color: '#ffffff' }}>{viewingAssignment.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setViewModal(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Course</span>
                  <span className="value">{viewingAssignment.courseName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status</span>
                  <span className={`value status-${viewingAssignment.status}`}>
                    {viewingAssignment.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Due Date</span>
                  <span className="value">
                    {new Date(viewingAssignment.dueDate).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Total Marks</span>
                  <span className="value">{viewingAssignment.totalMarks}</span>
                </div>
              </div>

              {(viewingAssignment.status === 'pending' || viewingAssignment.status === 'overdue') && (
                <div className="countdown-box">
                  <h4>Time Remaining</h4>
                  <DeadlineCountdown 
                    dueDate={viewingAssignment.dueDate} 
                    status={viewingAssignment.status} 
                  />
                </div>
              )}

              <div className="description-box">
                <h4>Description</h4>
                <p>{viewingAssignment.description}</p>
              </div>

              {viewingAssignment.attachments?.length > 0 && (
                <div className="materials-box">
                  <h4>Materials</h4>
                  <div className="files-list">
                    {viewingAssignment.attachments.map((file, idx) => (
                      <a 
                        key={idx}
                        href={`${import.meta.env.VITE_API_URL}${file.url}`}
                        download
                        className="file-item"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getFileIcon(file.filename)}
                        <span>{file.filename}</span>
                        <FaDownload />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewingAssignment.status === 'graded' && (
                <div className="grade-box">
                  <h4>Your Grade</h4>
                  <div className="grade-display-large">
                    <FaStar className="star-icon" />
                    <span className="score">{viewingAssignment.obtainedMarks}</span>
                    <span className="total">/ {viewingAssignment.totalMarks}</span>
                  </div>
                  {viewingAssignment.feedback && (
                    <div className="feedback-text">
                      <strong>Feedback:</strong> {viewingAssignment.feedback}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {(viewingAssignment.status === 'pending' || viewingAssignment.status === 'overdue') && (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setViewModal(false);
                      openAssignmentBuilder(viewingAssignment);
                    }}
                  >
                    <FaEdit /> Build Assignment
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setViewModal(false);
                      openSubmitModal(viewingAssignment);
                    }}
                  >
                    <FaUpload /> Submit Assignment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(false)}>
          <div className="modal-content submit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaUpload /> Submit Assignment</h3>
              <button className="close-btn" onClick={() => setSubmitModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="submit-info">
                <span className="asm-num">#{submittingAssignment?.courseAssignmentNo}</span>
                <h4>{submittingAssignment?.title}</h4>
                <p>{submittingAssignment?.courseName}</p>
              </div>

              <div className="upload-box">
                <label className="upload-title">
                  <FaFileAlt /> Upload Files (Max 5 files, 10MB each)
                </label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                    id="file-upload"
                    hidden
                  />
                  <label htmlFor="file-upload" className="upload-btn">
                    <FaUpload /> Choose Files
                  </label>
                </div>
                
                {submitFiles.length > 0 && (
                  <div className="selected-files">
                    {submitFiles.map((file, idx) => (
                      <span key={idx} className="file-chip">
                        {file.name}
                        <button onClick={() => setSubmitFiles(prev => prev.filter((_, i) => i !== idx))}>
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="file-types">Accepted: PDF, DOC, DOCX, ZIP, RAR, TXT</p>
              </div>

              <div className="comments-box">
                <label>Comments (Optional)</label>
                <textarea
                  value={submitComments}
                  onChange={(e) => setSubmitComments(e.target.value)}
                  placeholder="Add any comments about your submission..."
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setSubmitModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSubmitAssignment}
                disabled={submitLoading || submitFiles.length === 0}
              >
                {submitLoading ? 'Submitting...' : <><FaPaperPlane /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;