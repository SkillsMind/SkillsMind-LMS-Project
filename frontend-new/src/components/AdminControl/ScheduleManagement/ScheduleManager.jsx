import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FaPlus, FaTrash, FaEdit, FaEye, FaArrowLeft, FaSpinner,
  FaCalendarAlt, FaClock, FaVideo, FaChalkboardTeacher,
  FaUsers, FaCheckCircle, FaSearch, FaFilter, FaSync,
  FaChevronDown, FaChevronUp, FaGraduationCap, FaLayerGroup,
  FaTrashAlt, FaExpandAlt, FaCompressAlt, FaCalendarCheck,
  FaPlayCircle, FaHistory, FaRegCalendarCheck, FaCalendarWeek,
  FaDownload, FaFilePdf
} from 'react-icons/fa';
import ScheduleCreator from './ScheduleCreator';
import './ScheduleManager.css';

const ScheduleManager = () => {
  const [view, setView] = useState('list');
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandAll, setExpandAll] = useState(false);

  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    liveClasses: 0,
    recordedClasses: 0
  });

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '12px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '6px'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const schedulesRes = await adminAPI.getSchedules();
      let schedulesData = [];
      if (Array.isArray(schedulesRes.data)) {
        schedulesData = schedulesRes.data;
      } else if (schedulesRes.data?.data && Array.isArray(schedulesRes.data.data)) {
        schedulesData = schedulesRes.data.data;
      } else if (schedulesRes.data?.schedules && Array.isArray(schedulesRes.data.schedules)) {
        schedulesData = schedulesRes.data.schedules;
      }
      
      setSchedules(schedulesData);

      const coursesRes = await adminAPI.getCourses();
      let coursesData = [];
      if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
      } else if (coursesRes.data?.courses && Array.isArray(coursesRes.data.courses)) {
        coursesData = coursesRes.data.courses;
      } else if (coursesRes.data?.data && Array.isArray(coursesRes.data.data)) {
        coursesData = coursesRes.data.data;
      }
      
      setCourses(coursesData);
      calculateStats(schedulesData);
      
      if (coursesData.length > 0) {
        setExpandedCourses([coursesData[0]._id]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load schedules', { style: toastStyle });
      setSchedules([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!Array.isArray(data)) {
      setStats({ totalSessions: 0, upcomingSessions: 0, liveClasses: 0, recordedClasses: 0 });
      return;
    }

    const now = new Date();
    const upcoming = data.filter(s => {
      const sessionDate = s.sessionDate ? new Date(s.sessionDate) : new Date(s.startDate);
      return sessionDate > now && s.status === 'upcoming';
    });
    const live = data.filter(s => s.type === 'live');
    const recorded = data.filter(s => s.type === 'recorded');

    setStats({
      totalSessions: data.length,
      upcomingSessions: upcoming.length,
      liveClasses: live.length,
      recordedClasses: recorded.length
    });
  };

  // Generate PDF using jsPDF
  const generatePDF = async (courseName, weeks) => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      
      // SkillMind Colors
      const primaryColor = '#000B29';
      const accentColor = '#E30613';
      
      // Header with Logo placeholder
      pdf.setFillColor(0, 11, 41);
      pdf.rect(0, 0, 297, 35, 'F');
      
      // Logo text (since we can't easily load image)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SKILLMIND', 15, 22);
      
      pdf.setTextColor(227, 6, 19);
      pdf.setFontSize(10);
      pdf.text('●', 75, 22);
      
      // Course Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(courseName.toUpperCase(), 150, 22);
      
      // Date
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 250, 22);
      
      // Summary Box
      const totalClasses = Object.values(weeks).flat().length;
      const totalWeeks = Object.keys(weeks).length;
      
      pdf.setFillColor(248, 249, 250);
      pdf.rect(10, 45, 277, 25, 'F');
      pdf.setDrawColor(224, 224, 224);
      pdf.rect(10, 45, 277, 25, 'S');
      
      pdf.setTextColor(0, 11, 41);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Weeks: ${totalWeeks}`, 20, 60);
      pdf.text(`Total Classes: ${totalClasses}`, 100, 60);
      pdf.text(`Course Schedule`, 200, 60);
      
      let yPosition = 80;
      
      // Sort weeks
      const sortedWeeks = Object.entries(weeks).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
      
      sortedWeeks.forEach(([weekNum, classes], weekIndex) => {
        // Check if new page needed
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Week Header
        pdf.setFillColor(0, 11, 41);
        pdf.rect(10, yPosition, 277, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`WEEK ${weekNum}`, 15, yPosition + 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${classes.length} Classes`, 250, yPosition + 8);
        
        yPosition += 15;
        
        // Table Header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10, yPosition, 277, 10, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.line(10, yPosition + 10, 287, yPosition + 10);
        
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SESSION', 15, yPosition + 7);
        pdf.text('DAY', 50, yPosition + 7);
        pdf.text('TOPIC', 80, yPosition + 7);
        pdf.text('TIME', 180, yPosition + 7);
        pdf.text('TYPE', 210, yPosition + 7);
        pdf.text('STATUS', 240, yPosition + 7);
        pdf.text('DURATION', 270, yPosition + 7);
        
        yPosition += 12;
        
        // Classes
        classes.forEach((cls, idx) => {
          if (yPosition > 190) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Alternate row colors
          if (idx % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(10, yPosition - 2, 277, 10, 'F');
          }
          
          pdf.setTextColor(50, 50, 50);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          pdf.text(`S${idx + 1}`, 15, yPosition + 5);
          pdf.text((cls.day || 'TBD').substring(0, 3).toUpperCase(), 50, yPosition + 5);
          
          // Topic (truncate if too long)
          const topic = (cls.title || cls.topic || 'Untitled');
          const truncatedTopic = topic.length > 35 ? topic.substring(0, 35) + '...' : topic;
          pdf.text(truncatedTopic, 80, yPosition + 5);
          
          pdf.text(cls.time || '--:--', 180, yPosition + 5);
          
          // Type with color
          if (cls.type === 'live') {
            pdf.setTextColor(198, 40, 40);
            pdf.text('LIVE', 210, yPosition + 5);
          } else {
            pdf.setTextColor(46, 125, 50);
            pdf.text('RECORDED', 210, yPosition + 5);
          }
          pdf.setTextColor(50, 50, 50);
          
          // Status
          if (cls.status === 'upcoming') {
            pdf.setTextColor(21, 101, 192);
            pdf.text('UPCOMING', 240, yPosition + 5);
          } else if (cls.status === 'completed') {
            pdf.setTextColor(46, 125, 50);
            pdf.text('COMPLETED', 240, yPosition + 5);
          } else {
            pdf.text((cls.status || 'N/A').toUpperCase(), 240, yPosition + 5);
          }
          pdf.setTextColor(50, 50, 50);
          
          pdf.text(`${cls.duration || '--'} min`, 270, yPosition + 5);
          
          yPosition += 10;
        });
        
        yPosition += 8;
      });
      
      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFillColor(0, 11, 41);
        pdf.rect(0, 205, 297, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('© 2024 SkillMind. All rights reserved.', 15, 214);
        pdf.text(`Page ${i} of ${pageCount}`, 260, 214);
        pdf.text('This schedule is subject to changes.', 120, 214);
      }
      
      // Save PDF
      pdf.save(`${courseName.replace(/\s+/g, '_')}_Schedule.pdf`);
      
      toast.success('PDF downloaded successfully!', {
        style: {
          border: '1px solid #000B29',
          padding: '16px',
          color: '#000B29',
          background: '#ffffff',
        }
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { style: toastStyle });
    }
  };

  const handleStatClick = (type) => {
    if (type === 'live') {
      setTimeout(() => {
        const firstLive = document.querySelector('.type-pill.live');
        if (firstLive) {
          firstLive.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstLive.closest('.class-row').style.background = '#fff5f5';
          setTimeout(() => {
            firstLive.closest('.class-row').style.background = '';
          }, 2000);
        }
      }, 100);
    } else if (type === 'upcoming') {
      setTimeout(() => {
        const firstUpcoming = document.querySelector('.status-pill.upcoming');
        if (firstUpcoming) {
          firstUpcoming.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstUpcoming.closest('.class-row').style.background = '#f0f9ff';
          setTimeout(() => {
            firstUpcoming.closest('.class-row').style.background = '';
          }, 2000);
        }
      }, 100);
    } else if (type === 'total') {
      setExpandAll(true);
      const allCourses = Object.keys(groupedSchedules);
      setExpandedCourses(allCourses);
      const allWeeks = {};
      allCourses.forEach(courseId => {
        const weeks = [...new Set(groupedSchedules[courseId].schedules.map(s => s.weekNumber || 1))];
        weeks.forEach(weekNum => {
          allWeeks[`${courseId}-week-${weekNum}`] = true;
        });
      });
      setExpandedWeeks(allWeeks);
    }
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleWeek = (courseId, weekNum) => {
    const key = `${courseId}-week-${weekNum}`;
    setExpandedWeeks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAll = () => {
    if (expandAll) {
      setExpandedCourses([]);
      setExpandedWeeks({});
    } else {
      const allCourses = Object.keys(groupedSchedules);
      setExpandedCourses(allCourses);
      const allWeeks = {};
      allCourses.forEach(courseId => {
        const weeks = [...new Set(groupedSchedules[courseId].schedules.map(s => s.weekNumber || 1))];
        weeks.forEach(weekNum => {
          allWeeks[`${courseId}-week-${weekNum}`] = true;
        });
      });
      setExpandedWeeks(allWeeks);
    }
    setExpandAll(!expandAll);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await adminAPI.deleteSchedule(id);
      toast.success('Schedule deleted', { style: toastStyle });
      fetchData();
    } catch (err) {
      toast.error('Failed to delete', { style: toastStyle });
    }
  };

  const handleDeleteCourseSchedules = async (courseId, courseName) => {
    const courseSchedules = groupedSchedules[courseId]?.schedules || [];
    if (courseSchedules.length === 0) return;
    if (!window.confirm(`Delete ALL ${courseSchedules.length} schedules for "${courseName}"?`)) return;

    try {
      const deletePromises = courseSchedules.map(s => adminAPI.deleteSchedule(s._id));
      await Promise.all(deletePromises);
      toast.success(`All schedules deleted`, { style: toastStyle });
      fetchData();
    } catch (err) {
      toast.error('Failed to delete', { style: toastStyle });
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setView('creator');
  };

  const handleCreateNew = () => {
    setSelectedSchedule(null);
    setView('creator');
  };

  const handleViewDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedSchedule(null);
    setView('list');
  };

  const handleSuccess = () => {
    setView('list');
    fetchData();
  };

  const filteredSchedules = Array.isArray(schedules) ? schedules.filter(schedule => {
    const matchesCourse = selectedCourse === 'all' || schedule.courseId?._id === selectedCourse || schedule.courseId === selectedCourse;
    const matchesSearch = (schedule.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (schedule.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesCourse && matchesSearch;
  }) : [];

  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const courseId = schedule.courseId?._id || schedule.courseId || 'uncategorized';
    const courseName = schedule.courseId?.title || 'Uncategorized';
    const courseObj = schedule.courseId || { title: 'Uncategorized', _id: 'uncategorized' };
    const weekNum = schedule.weekNumber || 1;
    
    if (!acc[courseId]) {
      acc[courseId] = { 
        course: courseObj, 
        courseName, 
        schedules: [],
        weeks: {}
      };
    }
    
    if (!acc[courseId].weeks[weekNum]) {
      acc[courseId].weeks[weekNum] = [];
    }
    
    acc[courseId].weeks[weekNum].push(schedule);
    acc[courseId].schedules.push(schedule);
    return acc;
  }, {});

  Object.keys(groupedSchedules).forEach(courseId => {
    Object.keys(groupedSchedules[courseId].weeks).forEach(weekNum => {
      groupedSchedules[courseId].weeks[weekNum].sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });
    });
  });

  if (view === 'creator') {
    return (
      <ScheduleCreator 
        schedule={selectedSchedule}
        courses={courses}
        onCancel={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  if (view === 'detail' && selectedSchedule) {
    return <ScheduleDetail schedule={selectedSchedule} onBack={handleBack} />;
  }

  return (
    <div className="schedule-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1><FaCalendarAlt /> Schedule Manager</h1>
          <p>Manage class schedules for all courses</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchData}>
            <FaSync /> Refresh
          </button>
          <button className="btn-create" onClick={handleCreateNew}>
            <FaPlus /> Create Schedule
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card total" onClick={() => handleStatClick('total')}>
          <div className="stat-icon total-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>

        <div className="stat-card upcoming" onClick={() => handleStatClick('upcoming')}>
          <div className="stat-icon upcoming-icon">
            <FaRegCalendarCheck />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.upcomingSessions}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>

        <div className="stat-card live" onClick={() => handleStatClick('live')}>
          <div className="stat-icon live-icon">
            <FaPlayCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.liveClasses}</span>
            <span className="stat-label">Live Classes</span>
          </div>
        </div>

        <div className="stat-card recorded" onClick={() => handleStatClick('recorded')}>
          <div className="stat-icon recorded-icon">
            <FaHistory />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.recordedClasses}</span>
            <span className="stat-label">Recorded</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <FaFilter />
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="all">All Courses</option>
            {Array.isArray(courses) && courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
        </div>

        <button className="btn-expand-toggle" onClick={toggleAll}>
          {expandAll ? <><FaCompressAlt /> Collapse</> : <><FaExpandAlt /> Expand All</>}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-cell"><FaSpinner className="spin" /> Loading...</div>
      ) : !Array.isArray(schedules) || schedules.length === 0 ? (
        <div className="empty-state">
          <FaCalendarAlt size={40} color="#ccc" />
          <h3>No schedules found</h3>
          <button className="btn-create" onClick={handleCreateNew}>
            <FaPlus /> Create Schedule
          </button>
        </div>
      ) : (
        <div className="courses-accordion">
          {Object.values(groupedSchedules).map(({ course, courseName, weeks }) => {
            const courseId = course?._id || 'uncategorized';
            const isExpanded = expandedCourses.includes(courseId);
            const weekNumbers = Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b));
            const totalClasses = Object.values(weeks).flat().length;
            
            return (
              <div key={courseId} className={`course-card ${isExpanded ? 'expanded' : ''}`}>
                {/* Course Header */}
                <div className="course-header" onClick={() => toggleCourse(courseId)}>
                  <div className="course-header-main">
                    <div className="course-icon">
                      <FaGraduationCap />
                    </div>
                    <div className="course-info">
                      <h3>{courseName}</h3>
                      <div className="course-meta">
                        <span className="meta-badge weeks">{weekNumbers.length} Weeks</span>
                        <span className="meta-badge classes">{totalClasses} Classes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="course-header-actions">
                    <button 
                      className="btn-download"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePDF(courseName, weeks);
                      }}
                      title="Download PDF"
                    >
                      <FaFilePdf /> PDF
                    </button>
                    <button 
                      className="btn-delete-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourseSchedules(courseId, courseName);
                      }}
                    >
                      <FaTrashAlt /> Delete All
                    </button>
                    <div className="expand-icon">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Course Content - Shows Weeks */}
                {isExpanded && (
                  <div className="course-content">
                    {weekNumbers.map(weekNum => {
                      const weekClasses = weeks[weekNum];
                      const weekKey = `${courseId}-week-${weekNum}`;
                      const isWeekExpanded = expandedWeeks[weekKey];
                      
                      return (
                        <div key={weekKey} className={`week-card ${isWeekExpanded ? 'expanded' : ''}`}>
                          {/* Week Header */}
                          <div className="week-header" onClick={() => toggleWeek(courseId, weekNum)}>
                            <div className="week-info">
                              <FaCalendarWeek className="week-icon" />
                              <span className="week-title">Week {weekNum}</span>
                              <span className="week-count">{weekClasses.length} classes</span>
                            </div>
                            <div className="week-toggle">
                              {isWeekExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                          </div>
                          
                          {/* Week Content - Shows Classes */}
                          {isWeekExpanded && (
                            <div className="week-content">
                              <div className="classes-table">
                                <div className="table-header">
                                  <div className="th-day">Day</div>
                                  <div className="th-topic">Topic</div>
                                  <div className="th-time">Time</div>
                                  <div className="th-type">Type</div>
                                  <div className="th-status">Status</div>
                                  <div className="th-actions">Actions</div>
                                </div>
                                
                                <div className="table-body">
                                  {weekClasses.map((schedule, idx) => (
                                    <div key={schedule._id} className="class-row">
                                      <div className="td-day">
                                        <div className="day-badge">{schedule.day?.slice(0, 3)}</div>
                                        <span className="session-num">S{idx + 1}</span>
                                      </div>
                                      
                                      <div className="td-topic">
                                        <h4>{schedule.title || schedule.topic}</h4>
                                        {schedule.description && (
                                          <p className="topic-desc">{schedule.description.substring(0, 40)}...</p>
                                        )}
                                      </div>
                                      
                                      <div className="td-time">
                                        <span className="time-text">{schedule.time}</span>
                                        <span className="duration-badge">{schedule.duration} min</span>
                                      </div>
                                      
                                      <div className="td-type">
                                        <span className={`type-pill ${schedule.type}`}>
                                          {schedule.type === 'live' ? '● Live' : 'Rec'}
                                        </span>
                                      </div>
                                      
                                      <div className="td-status">
                                        <span className={`status-pill ${schedule.status}`}>
                                          {schedule.status}
                                        </span>
                                      </div>
                                      
                                      <div className="td-actions">
                                        <button className="btn-action view" onClick={() => handleViewDetail(schedule)}>
                                          <FaEye /> View
                                        </button>
                                        <button className="btn-action edit" onClick={() => handleEdit(schedule)}>
                                          <FaEdit /> Edit
                                        </button>
                                        <button className="btn-action delete" onClick={() => handleDelete(schedule._id)}>
                                          <FaTrash /> Del
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// FIXED Schedule Detail View Component
const ScheduleDetail = ({ schedule, onBack }) => {
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!schedule || !schedule.courseId) {
      setLoading(false);
      setError('Invalid schedule data');
      return;
    }
    fetchEnrolledStudents();
  }, [schedule]);

  const fetchEnrolledStudents = async () => {
    try {
      const courseId = schedule.courseId?._id || schedule.courseId;
      if (!courseId) {
        setError('No course ID found');
        setLoading(false);
        return;
      }
      
      const res = await adminAPI.getCourseStudents(courseId);
      setEnrolledStudents(res.data?.students || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch students error:', err);
      setError('Failed to load students');
      setLoading(false);
    }
  };

  // If no schedule, show error
  if (!schedule) {
    return (
      <div className="detail-view">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <div className="detail-card">
          <div className="empty-state">
            <h3>No schedule selected</h3>
            <button className="btn-create" onClick={onBack}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-view">
      <button className="btn-back" onClick={onBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="detail-card">
        <div className="detail-header-improved">
          <div className="detail-badge">Week {schedule.weekNumber || 1}</div>
          <h2>{schedule.title || schedule.topic || 'Untitled Schedule'}</h2>
          <p className="course-name">{schedule.courseId?.title || schedule.courseId || 'Unknown Course'}</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-icon"><FaCalendarAlt /></div>
            <div className="detail-content">
              <label>Day</label>
              <span>{schedule.day || 'Not specified'}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="detail-icon"><FaClock /></div>
            <div className="detail-content">
              <label>Time</label>
              <span>{schedule.time || 'Not specified'}</span>
            </div>
          </div>
          
          {schedule.sessionDate && (
            <div className="detail-item">
              <div className="detail-icon"><FaCalendarCheck /></div>
              <div className="detail-content">
                <label>Date</label>
                <span>{new Date(schedule.sessionDate).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          )}
          
          <div className="detail-item">
            <div className="detail-icon" style={{background: '#ffebee', color: '#c62828'}}><FaVideo /></div>
            <div className="detail-content">
              <label>Type</label>
              <span className={schedule.type}>{schedule.type || 'live'}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="detail-icon" style={{background: '#e3f2fd', color: '#1565c0'}}><FaCheckCircle /></div>
            <div className="detail-content">
              <label>Status</label>
              <span className={schedule.status}>{schedule.status || 'upcoming'}</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon" style={{background: '#f3e5f5', color: '#7b1fa2'}}><FaClock /></div>
            <div className="detail-content">
              <label>Duration</label>
              <span>{schedule.duration ? `${schedule.duration} minutes` : 'Not specified'}</span>
            </div>
          </div>
        </div>

        {schedule.meetingLink && (
          <div className="detail-section-improved">
            <h4><FaVideo /> Meeting Link</h4>
            <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
              {schedule.meetingLink}
            </a>
            <small>Available 15 minutes before class starts</small>
          </div>
        )}

        {schedule.description && (
          <div className="detail-section-improved">
            <h4>Description</h4>
            <p>{schedule.description}</p>
          </div>
        )}

        <div className="detail-section-improved">
          <h3><FaUsers /> Enrolled Students ({enrolledStudents.length})</h3>
          {loading ? (
            <div className="loading-cell">Loading students...</div>
          ) : error ? (
            <p className="no-students">{error}</p>
          ) : enrolledStudents.length === 0 ? (
            <p className="no-students">No students enrolled in this course yet.</p>
          ) : (
            <div className="students-grid-improved">
              {enrolledStudents.map((student, idx) => (
                <div key={student._id} className="student-card">
                  <div className="student-avatar-improved" style={{background: `hsl(${(idx * 50) % 360}, 70%, 45%)`}}>
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{student.name || 'Unknown'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;