import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaCalendarAlt, FaClock, FaVideo, FaCheckCircle,
  FaBell, FaSearch, FaCalendarDay, FaListUl, FaBookOpen,
  FaGraduationCap, FaRegClock, FaChevronDown, FaTimes,
  FaDownload, FaUserTie, FaSpinner, FaCheck, FaPrint,
  FaLayerGroup, FaBook, FaHourglassHalf, FaCalendarWeek,
  FaChalkboardTeacher, FaPlay, FaLock, FaFilePdf,
  FaArrowRight, FaExternalLinkAlt, FaExclamationTriangle,
  FaCalendarCheck, FaInfoCircle, FaHistory
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { io } from 'socket.io-client';
import LiveClassButton from './LiveClassButton';
import './Schedule.css';

const Schedule = () => {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('today');
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [socketConnected, setSocketConnected] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({});
  
  const notificationRef = useRef(null);
  const socketRef = useRef(null);

  const API = axios.create({
    baseURL: '${import.meta.env.VITE_API_URL}/api',
  });

  API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // üî• IMPROVED: Better date calculation using sessionDate from backend
  const getScheduleDate = (schedule) => {
    // Priority 1: Use sessionDate from backend (most accurate)
    if (schedule.sessionDate) {
      const date = new Date(schedule.sessionDate);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Priority 2: Calculate from course start date
    if (schedule.courseId?.startDate) {
      try {
        const start = new Date(schedule.courseId.startDate);
        if (isNaN(start.getTime())) return null;
        
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (schedule.weekNumber - 1) * 7);
        
        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(schedule.day);
        if (dayIndex === -1) return null;
        
        const scheduleDate = new Date(weekStart);
        scheduleDate.setDate(weekStart.getDate() + dayIndex);
        
        return scheduleDate;
      } catch (e) {
        console.error('Date calculation error:', e);
      }
    }
    
    return null;
  };

  // üî• IMPROVED: Better status calculation based on actual date/time
  const getClassStatus = (schedule) => {
    const now = new Date();
    const scheduleDate = getScheduleDate(schedule);
    
    if (!scheduleDate) return schedule.status || 'upcoming';
    
    const [hours, minutes] = schedule.time.split(':');
    const classStartTime = new Date(scheduleDate);
    classStartTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
    
    const classEndTime = new Date(classStartTime);
    classEndTime.setMinutes(classStartTime.getMinutes() + (schedule.duration || 60));
    
    // Class already ended
    if (now > classEndTime) return 'completed';
    
    // Class is currently ongoing
    if (now >= classStartTime && now <= classEndTime) return 'ongoing';
    
    // Class is upcoming
    return 'upcoming';
  };

  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatFullDate = (date) => {
    if (!date || isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  // üî• IMPROVED: Fetch attendance stats
  const fetchAttendanceStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await API.get('/attendance/my-stats');
      if (response.data?.success) {
        setAttendanceStats(response.data.data || {});
      }
    } catch (err) {
      console.log('Attendance stats not available');
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await API.get('/schedules/my-schedules/student');
      const schedulesData = response.data?.data || [];
      
      // Get unique courses from enrolled courses
      const uniqueCourses = [...new Map(schedulesData.map(s => 
        [s.courseId?._id || s.courseId, {
          _id: s.courseId?._id || s.courseId,
          title: s.courseId?.title || 'Unknown Course',
          thumbnail: s.courseId?.thumbnail,
          startDate: s.courseId?.startDate,
          totalWeeks: s.courseId?.duration || 12,
          description: s.courseId?.description
        }]
      )).values()].filter(c => c._id); // Filter out undefined courses

      // Enrich schedules with calculated dates and actual status
      const enrichedSchedules = schedulesData.map(schedule => {
        const scheduleDate = getScheduleDate(schedule);
        const actualStatus = getClassStatus({...schedule, calculatedDate: scheduleDate});
        
        return {
          ...schedule,
          calculatedDate: scheduleDate,
          formattedDate: formatDate(scheduleDate),
          actualStatus: actualStatus,
          isPast: actualStatus === 'completed',
          isToday: scheduleDate ? new Date().toDateString() === scheduleDate.toDateString() : false
        };
      });
      
      setCourses(uniqueCourses);
      setSchedules(enrichedSchedules);
      
      // Auto-select first course if none selected
      if (!selectedCourse && uniqueCourses.length > 0) {
        setSelectedCourse(uniqueCourses[0]);
      }
      
      // Generate smart notifications
      generateNotifications(enrichedSchedules);
      
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCourse]);

  // üî• IMPROVED: Smart notifications
  const generateNotifications = (schedules) => {
    const now = new Date();
    const upcomingClasses = schedules.filter(s => {
      if (!s.calculatedDate || s.actualStatus === 'completed') return false;
      
      const classTime = new Date(s.calculatedDate);
      const [hours, minutes] = s.time.split(':');
      classTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
      
      const diffHours = (classTime - now) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 24;
    });

    const newNotifications = upcomingClasses.map((sched, idx) => ({
      id: `upcoming-${sched._id || idx}`,
      title: `Upcoming: ${sched.title || sched.topic}`,
      message: `${sched.courseId?.title || 'Course'} - ${sched.day} at ${sched.time}`,
      read: false,
      scheduleId: sched._id,
      weekNumber: sched.weekNumber,
      day: sched.day,
      courseId: sched.courseId?._id || sched.courseId,
      type: 'upcoming',
      timeUntil: sched.calculatedDate
    }));

    // Add completion notifications for recently completed classes
    const recentlyCompleted = schedules.filter(s => {
      if (s.actualStatus !== 'completed' || !s.calculatedDate) return false;
      const daysSince = (now - s.calculatedDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 1; // Within last 24 hours
    });

    recentlyCompleted.forEach((sched, idx) => {
      newNotifications.push({
        id: `completed-${sched._id || idx}`,
        title: `Completed: ${sched.title || sched.topic}`,
        message: 'Class has ended. Check your attendance.',
        read: false,
        scheduleId: sched._id,
        type: 'completed',
        courseId: sched.courseId?._id || sched.courseId
      });
    });

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchAttendanceStats();
    }
  }, [fetchData, fetchAttendanceStats, user]);

  // Socket.IO connection
  useEffect(() => {
    if (!user?.id || courses.length === 0) return;
    
    if (socketRef.current) return;

    try {
      const newSocket = io('${import.meta.env.VITE_API_URL}', {
        transports: ['websocket', 'polling'],
        query: { studentId: user.id },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setSocketConnected(true);
        courses.forEach(course => newSocket.emit('joinCourse', course._id));
      });

      newSocket.on('connect_error', (err) => {
        console.log('⚠️ Socket error:', err.message);
        setSocketConnected(false);
      });

      newSocket.on('disconnect', () => {
        console.log('⚠️ Socket disconnected');
        setSocketConnected(false);
      });

      // Real-time updates
      newSocket.on('scheduleUpdated', () => fetchData());
      newSocket.on('newSchedule', () => fetchData());
      newSocket.on('scheduleCancelled', () => fetchData());
      newSocket.on('classStarted', (data) => {
        toast.success(`🔴 Live class started: ${data.message}`);
        fetchData();
      });
      newSocket.on('zoomMeetingCreated', (data) => {
        toast.info(`📹 Zoom meeting scheduled: ${data.message}`);
        fetchData();
      });

    } catch (error) {
      console.log('Socket error:', error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [courses, fetchData, user]);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    
    const course = courses.find(c => c._id === notif.courseId);
    if (course) {
      setSelectedCourse(course);
      
      if (notif.type === 'upcoming') {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (notif.day === today) {
          setViewMode('today');
        } else {
          setViewMode('weekly');
        }
        setExpandedWeeks(prev => ({...prev, [notif.weekNumber]: true}));
      } else {
        setViewMode('timetable');
      }
      
      toast.success(`Showing schedule details`);
    }
    
    setShowNotifications(false);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const getCurrentWeek = (courseStartDate) => {
    if (!courseStartDate) return 1;
    try {
      const start = new Date(courseStartDate);
      if (isNaN(start.getTime())) return 1;
      
      const now = new Date();
      const diffTime = now - start;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return Math.max(1, week);
    } catch (e) {
      return 1;
    }
  };

  // üî• FILTER: Only show schedules for selected course and enrolled student
  const courseSchedules = selectedCourse 
    ? schedules.filter(s => {
        const courseId = s.courseId?._id || s.courseId;
        return courseId === selectedCourse._id && courseId;
      })
    : [];

  const currentWeekNum = selectedCourse ? getCurrentWeek(selectedCourse.startDate) : 1;

  // üî• IMPROVED: Group all weeks data (not just current)
  const weeksData = () => {
    const weeks = {};
    const maxWeek = Math.max(...courseSchedules.map(s => s.weekNumber), currentWeekNum);
    
    for (let i = 1; i <= maxWeek; i++) {
      weeks[i] = courseSchedules
        .filter(s => s.weekNumber === i)
        .sort((a, b) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
          if (dayDiff !== 0) return dayDiff;
          return a.time.localeCompare(b.time);
        });
    }
    return weeks;
  };

  const groupedWeeks = weeksData();

  const today = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  
  // üî• IMPROVED: Today's classes with better filtering
  const todayClasses = courseSchedules.filter(s => {
    return s.isToday && s.weekNumber <= currentWeekNum;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const currentWeekClasses = groupedWeeks[currentWeekNum] || [];

  // üî• IMPROVED: Stats calculation
  const stats = {
    totalClasses: courseSchedules.filter(s => s.weekNumber <= currentWeekNum).length,
    completed: courseSchedules.filter(s => s.actualStatus === 'completed').length,
    upcoming: courseSchedules.filter(s => s.actualStatus === 'upcoming').length,
    ongoing: courseSchedules.filter(s => s.actualStatus === 'ongoing').length,
    todayCount: todayClasses.length,
    currentWeek: currentWeekNum,
    totalWeeks: selectedCourse?.totalWeeks || 12,
    attendanceRate: attendanceStats.overallAttendance || 0
  };

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => ({...prev, [weekNum]: !prev[weekNum]}));
  };

  // üî• IMPROVED: PDF Download with all weeks
  const downloadPDF = () => {
    try {
      toast.loading('Generating PDF...');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      
      // Header
      doc.setFillColor(0, 11, 41);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CLASS TIMETABLE', margin, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedCourse?.title || 'Course'}`, margin, 30);
      
      // Student info
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.text(`Student: ${user?.name || 'Student'}`, margin, 48);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 54);
      doc.text(`Current Week: ${currentWeekNum} | Total Classes: ${stats.totalClasses}`, margin, 60);
      
      // Prepare table data - ALL weeks
      const tableData = [];
      Object.entries(groupedWeeks).forEach(([weekNum, classes]) => {
        classes.forEach(schedule => {
          tableData.push([
            `Week ${weekNum}`,
            schedule.day.substring(0, 3),
            schedule.formattedDate || '-',
            schedule.time,
            schedule.title || schedule.topic,
            schedule.instructor || '-',
            schedule.type?.toUpperCase() || 'LIVE',
            schedule.actualStatus?.toUpperCase() || 'UPCOMING'
          ]);
        });
      });

      if (tableData.length === 0) {
        toast.dismiss();
        toast.error('No data to export');
        return;
      }

      autoTable(doc, {
        startY: 68,
        head: [['WEEK', 'DAY', 'DATE', 'TIME', 'TOPIC', 'INSTRUCTOR', 'TYPE', 'STATUS']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 11, 41],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50],
          cellPadding: 3
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 25 },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 22, halign: 'center' }
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          overflow: 'linebreak'
        },
        margin: { left: margin, right: margin }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount} | SkillsMind LMS`, margin, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`${selectedCourse?.title || 'Course'}_Timetable_Week${currentWeekNum}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error('PDF Error:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'live': return <FaVideo />;
      case 'recorded': return <FaPlay />;
      case 'workshop': return <FaChalkboardTeacher />;
      default: return <FaBookOpen />;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <FaCheck />;
      case 'ongoing': return <FaVideo />;
      case 'upcoming': return <FaClock />;
      default: return <FaRegClock />;
    }
  };

  // üî• IMPROVED: Live class button with better logic
  const renderLiveClassButton = (schedule) => {
    if (schedule.type !== 'live') return null;
    
    // Don't show button for completed classes
    if (schedule.actualStatus === 'completed') {
      return (
        <div className="class-completed-badge">
          <FaCheckCircle /> Completed
        </div>
      );
    }
    
    return (
      <div className="live-class-wrapper">
        <LiveClassButton schedule={schedule} />
      </div>
    );
  };

  // üî• IMPROVED: Today view with better status
  const renderTodayView = () => (
    <div className="view-box">
      <div className="box-header">
        <h3><FaCalendarDay /> Today's Classes</h3>
        <div className="header-badges">
          <span className="date-tag">{formatFullDate(new Date())}</span>
          {stats.todayCount > 0 && (
            <span className="count-badge">{stats.todayCount} classes</span>
          )}
        </div>
      </div>
      
      {todayClasses.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">
            <FaRegClock />
          </div>
          <h4>No classes today</h4>
          <p>Enjoy your free time or check upcoming classes</p>
          <button 
            className="btn-check-week"
            onClick={() => setViewMode('weekly')}
          >
            <FaCalendarAlt /> Check This Week
          </button>
        </div>
      ) : (
        <div className="class-items">
          {todayClasses.map((schedule, idx) => (
            <div 
              key={idx} 
              className={`class-row ${schedule.actualStatus} ${schedule.isToday ? 'is-today' : ''}`}
            >
              <div className="row-time">
                <span className="big-time">{schedule.time}</span>
                <span className="small-dur">{schedule.duration || 60} min</span>
                {schedule.actualStatus === 'ongoing' && (
                  <span className="live-pulse">● LIVE</span>
                )}
              </div>
              <div className="row-info">
                <div className="row-title-wrap">
                  <h4>{schedule.title || schedule.topic}</h4>
                  {schedule.actualStatus === 'completed' && (
                    <span className="completed-badge"><FaCheck /> Done</span>
                  )}
                </div>
                <div className="row-meta">
                  <span className="week-tag">Week {schedule.weekNumber}</span>
                  <span className={`type-badge ${schedule.type}`}>
                    {getTypeIcon(schedule.type)} {schedule.type}
                  </span>
                  {schedule.instructor && (
                    <span className="inst-tag"><FaUserTie /> {schedule.instructor}</span>
                  )}
                </div>
                {renderLiveClassButton(schedule)}
              </div>
              <div className="row-action">
                <span className={`status-tag ${schedule.actualStatus}`}>
                  {getStatusIcon(schedule.actualStatus)} {schedule.actualStatus}
                </span>
                {schedule.actualStatus === 'upcoming' && schedule.calculatedDate && (
                  <span className="time-until">
                    in {Math.ceil((schedule.calculatedDate - new Date()) / (1000 * 60 * 60))}h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // üî• IMPROVED: Weekly view with all status
  const renderWeeklyView = () => (
    <div className="view-box">
      <div className="box-header">
        <h3><FaCalendarAlt /> Week {currentWeekNum} Schedule</h3>
        <div className="header-badges">
          <span className="current-tag">Current Week</span>
          <span className="progress-badge">
            {currentWeekClasses.filter(c => c.actualStatus === 'completed').length}/{currentWeekClasses.length} Done
          </span>
        </div>
      </div>
      
      {currentWeekClasses.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">
            <FaCalendarAlt />
          </div>
          <h4>No classes this week</h4>
          <p>Check the full timetable for upcoming weeks</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="schedule-table modern-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Time</th>
                <th>Topic</th>
                <th>Instructor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentWeekClasses.map((schedule, idx) => (
                <tr 
                  key={idx} 
                  className={`${schedule.day === today ? 'today-line' : ''} ${schedule.actualStatus}`}
                >
                  <td className="day-cell">
                    <span className="day-name">{schedule.day.substring(0, 3)}</span>
                    {schedule.day === today && <span className="today-badge">TODAY</span>}
                  </td>
                  <td className="date-cell">{schedule.formattedDate}</td>
                  <td className="time-cell">
                    <FaClock /> {schedule.time}
                  </td>
                  <td className="topic-cell">
                    <div className="topic-title">{schedule.title || schedule.topic}</div>
                    <div className="topic-meta">{schedule.duration || 60} min • {schedule.type}</div>
                  </td>
                  <td className="inst-cell">{schedule.instructor || '-'}</td>
                  <td className="status-cell">
                    <span className={`status-pill ${schedule.actualStatus}`}>
                      {getStatusIcon(schedule.actualStatus)} {schedule.actualStatus}
                    </span>
                  </td>
                  <td className="action-cell">
                    {renderLiveClassButton(schedule)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // üî• IMPROVED: Full timetable with all weeks
  const renderFullTimetable = () => (
    <div className="view-box">
      <div className="box-header">
        <h3><FaBookOpen /> Complete Timetable</h3>
        <div className="header-badges">
          <span className="course-tag">{selectedCourse?.title}</span>
          <span className="total-weeks-badge">{Object.keys(groupedWeeks).length} Weeks</span>
        </div>
      </div>
      
      <div className="timetable-content">
        {Object.entries(groupedWeeks).length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">
              <FaBookOpen />
            </div>
            <h4>No schedule available</h4>
            <p>Your course schedule will appear here</p>
          </div>
        ) : (
          Object.entries(groupedWeeks).map(([weekNum, classes]) => {
            const completedCount = classes.filter(s => s.actualStatus === 'completed').length;
            const isCurrentWeek = parseInt(weekNum) === currentWeekNum;
            const isExpanded = expandedWeeks[weekNum] || isCurrentWeek;
            const isPastWeek = parseInt(weekNum) < currentWeekNum;
            
            return (
              <div 
                key={weekNum} 
                className={`week-box ${isCurrentWeek ? 'current' : ''} ${isPastWeek ? 'past' : ''}`}
              >
                <button className="week-header-btn" onClick={() => toggleWeek(weekNum)}>
                  <div className="week-title-row">
                    <span className="week-num">Week {weekNum}</span>
                    <span className="week-classes-count">{classes.length} classes</span>
                    {isCurrentWeek && <span className="current-week-badge">CURRENT</span>}
                    {isPastWeek && <span className="past-week-badge">COMPLETED</span>}
                  </div>
                  <div className="week-title-right">
                    <div className="week-progress">
                      <div 
                        className="progress-bar" 
                        style={{width: `${classes.length ? (completedCount/classes.length)*100 : 0}%`}}
                      ></div>
                    </div>
                    <span className="week-done">{completedCount}/{classes.length}</span>
                    <FaChevronDown className={`arrow-icon ${isExpanded ? 'up' : ''}`} />
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="week-table-box">
                    {classes.length === 0 ? (
                      <p className="no-class-text">No classes scheduled for this week</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="inner-schedule-table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Topic</th>
                              <th>Status</th>
                              <th>Join</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classes.map((schedule, idx) => (
                              <tr 
                                key={idx} 
                                className={`${schedule.actualStatus} ${schedule.isToday ? 'is-today' : ''}`}
                              >
                                <td className="day-cell">{schedule.day.substring(0, 3)}</td>
                                <td className="date-cell">{schedule.formattedDate}</td>
                                <td>{schedule.time}</td>
                                <td className="topic-cell">
                                  {schedule.title || schedule.topic}
                                  {schedule.instructor && (
                                    <div className="instructor-small">
                                      <FaUserTie /> {schedule.instructor}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span className={`mini-status ${schedule.actualStatus}`}>
                                    {schedule.actualStatus === 'completed' ? <FaCheck /> : 
                                     schedule.actualStatus === 'ongoing' ? <FaVideo /> : <FaClock />}
                                  </span>
                                </td>
                                <td>
                                  {renderLiveClassButton(schedule)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // üî• IMPROVED: List view with search
  const renderListView = () => {
    const filteredSchedules = courseSchedules
      .filter(s => {
        const searchLower = searchTerm.toLowerCase();
        return (
          s.title?.toLowerCase().includes(searchLower) ||
          s.topic?.toLowerCase().includes(searchLower) ||
          s.day?.toLowerCase().includes(searchLower) ||
          s.instructor?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.indexOf(a.day) - days.indexOf(b.day);
      });

    return (
      <div className="view-box">
        <div className="box-header">
          <h3><FaListUl /> All Classes</h3>
          <div className="search-inline">
            <FaSearch />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredSchedules.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">
              <FaSearch />
            </div>
            <h4>No classes found</h4>
            <p>Try adjusting your search</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="schedule-table list-view-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Topic</th>
                  <th>Instructor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule, idx) => (
                  <tr key={idx} className={schedule.actualStatus}>
                    <td className="center-cell">
                      <span className="week-badge">W{schedule.weekNumber}</span>
                    </td>
                    <td>{schedule.day.substring(0, 3)}</td>
                    <td className="date-cell">{schedule.formattedDate}</td>
                    <td className="time-cell">{schedule.time}</td>
                    <td className="topic-cell">{schedule.title || schedule.topic}</td>
                    <td>{schedule.instructor || '-'}</td>
                    <td>
                      <span className={`status-pill ${schedule.actualStatus}`}>
                        {schedule.actualStatus}
                      </span>
                    </td>
                    <td>
                      {renderLiveClassButton(schedule)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="schedule-page">
        <div className="loading-wrap">
          <FaSpinner className="spin" size={40} color="#000B29" />
          <p>Loading your schedule...</p>
        </div>
      </div>
    );
  }

  // Empty state when no courses
  if (courses.length === 0) {
    return (
      <div className="schedule-page">
        <div className="empty-state-full">
          <div className="empty-icon-large">
            <FaCalendarAlt />
          </div>
          <h2>No Courses Enrolled</h2>
          <p>You haven't enrolled in any courses yet.</p>
          <button className="btn-browse-courses">
            <FaBookOpen /> Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      {/* Banner */}
      <div className="compressed-banner">
        <div className="banner-top">
          <div className="banner-left-compact">
            <div className="icon-box">
              <FaCalendarWeek />
            </div>
            <div className="text-box">
              <h1>My Class Schedule</h1>
              <p>{selectedCourse?.title} • Week {currentWeekNum} • {formatFullDate(new Date())}</p>
            </div>
          </div>
          
          <div className="notif-box" ref={notificationRef}>
            <button 
              className="notif-btn-compact"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
            </button>
            
            {showNotifications && (
              <div className="notif-drop">
                <div className="notif-drop-header">
                  <h4>Notifications ({unreadCount})</h4>
                  <button onClick={clearAllNotifications}>Clear All</button>
                </div>
                <div className="notif-drop-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <FaBell size={20} color="#9ca3af" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notif-item-compact ${!notif.read ? 'unread' : ''} ${notif.type}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notif-content">
                          <p className="notif-item-title">{notif.title}</p>
                          <p className="notif-item-desc">{notif.message}</p>
                        </div>
                        <FaArrowRight className="notif-arrow" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="stats-line">
          <div className="stat-card-compact">
            <div className="stat-icon-c blue"><FaBook /></div>
            <div className="stat-text-c">
              <span className="stat-num-c">{stats.totalClasses}</span>
              <span className="stat-label-c">Total</span>
            </div>
          </div>
          
          <div className="stat-card-compact">
            <div className="stat-icon-c green"><FaCheckCircle /></div>
            <div className="stat-text-c">
              <span className="stat-num-c">{stats.completed}</span>
              <span className="stat-label-c">Done</span>
            </div>
          </div>
          
          <div className="stat-card-compact">
            <div className="stat-icon-c orange"><FaHourglassHalf /></div>
            <div className="stat-text-c">
              <span className="stat-num-c">{stats.upcoming}</span>
              <span className="stat-label-c">Upcoming</span>
            </div>
          </div>
          
          <div className="stat-card-compact">
            <div className="stat-icon-c purple"><FaLayerGroup /></div>
            <div className="stat-text-c">
              <span className="stat-num-c">{stats.currentWeek}</span>
              <span className="stat-label-c">Week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="course-filter">
          <span className="filter-label">My Courses:</span>
          <div className="course-chips">
            {courses.map(course => (
              <button
                key={course._id}
                className={`course-chip ${selectedCourse?._id === course._id ? 'active' : ''}`}
                onClick={() => setSelectedCourse(course)}
              >
                {course.title}
              </button>
            ))}
          </div>
        </div>

        <div className="search-pdf">
          <button className="pdf-btn" onClick={downloadPDF}>
            <FaFilePdf /> <span className="pdf-text">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button 
          className={viewMode === 'today' ? 'active' : ''} 
          onClick={() => setViewMode('today')}
        >
          <FaCalendarDay /> <span>Today</span>
          {stats.todayCount > 0 && <span className="tab-badge">{stats.todayCount}</span>}
        </button>
        <button 
          className={viewMode === 'weekly' ? 'active' : ''} 
          onClick={() => setViewMode('weekly')}
        >
          <FaCalendarAlt /> <span>This Week</span>
        </button>
        <button 
          className={viewMode === 'timetable' ? 'active' : ''} 
          onClick={() => setViewMode('timetable')}
        >
          <FaBookOpen /> <span>All Weeks</span>
        </button>
        <button 
          className={viewMode === 'list' ? 'active' : ''} 
          onClick={() => setViewMode('list')}
        >
          <FaListUl /> <span>List</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-wrap">
        {viewMode === 'today' && renderTodayView()}
        {viewMode === 'weekly' && renderWeeklyView()}
        {viewMode === 'timetable' && renderFullTimetable()}
        {viewMode === 'list' && renderListView()}
      </div>
    </div>
  );
};

export default Schedule;