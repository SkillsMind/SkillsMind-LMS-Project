import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { studentAPI } from '../../../services/api';
import "./Attendance.css";

const Attendance = () => {
  // State management
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [timeRange, setTimeRange] = useState('semester');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [rawData, setRawData] = useState([]);

  const studentId = localStorage.getItem('userId') || localStorage.getItem('studentId');

  // Fetch attendance data from API
  useEffect(() => {
    fetchAttendanceData();
  }, [timeRange, studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Real API call - isko apni actual API se replace karein
      const response = await studentAPI.getAttendance(studentId, { 
        range: timeRange,
        courseId: selectedCourse !== 'all' ? selectedCourse : undefined
      });

      if (response.data) {
        processAttendanceData(response.data);
      } else {
        setError('No attendance data available');
      }

    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Failed to load attendance data');
      // Error ke case mein data null rakhein, dummy data nahi dikhayein
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  // Process raw API data into usable format
  const processAttendanceData = (data) => {
    setRawData(data);

    // Extract unique courses for filter
    const uniqueCourses = [...new Set(data.records?.map(r => r.courseId) || [])];
    setCourses(uniqueCourses);

    // Calculate overall statistics
    const records = data.records || [];
    const totalClasses = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const overall = totalClasses > 0 ? Math.round(((present + late) / totalClasses) * 100) : 0;

    // Group by month
    const monthlyMap = new Map();
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          records: [],
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.records.push(record);
      monthData.total++;
      monthData[record.status]++;
    });

    // Calculate percentages and format monthly data
    const monthly = Array.from(monthlyMap.values()).map(m => ({
      month: m.month,
      percentage: m.total > 0 ? Math.round(((m.present + m.late) / m.total) * 100) : 0,
      classes: m.total,
      present: m.present,
      absent: m.absent,
      late: m.late,
      details: m.records.map(r => ({
        date: r.date,
        status: r.status,
        subject: r.courseName || r.subject || 'Unknown',
        courseId: r.courseId
      })).sort((a, b) => new Date(b.date) - new Date(a.date))
    })).sort((a, b) => new Date(b.month) - new Date(a.month));

    // Recent activity (last 7 days)
    const recentActivity = records
      .filter(r => {
        const daysDiff = (new Date() - new Date(r.date)) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Calculate streaks
    const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentStreak = 0;
    let maxStreak = 0;
    let lastAbsent = null;

    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      if (sortedRecords[i].status === 'present') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (sortedRecords[i].status === 'absent') {
          lastAbsent = sortedRecords[i].date;
        }
        currentStreak = 0;
      }
    }

    // Classes today
    const today = new Date().toISOString().split('T')[0];
    const classesToday = data.todayClasses || 0;

    setAttendanceData({
      overall,
      present,
      absent,
      late,
      totalClasses,
      semester: data.semester || 'Current Semester',
      monthly,
      recentActivity,
      currentStreak,
      lastAbsent,
      classesToday
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!attendanceData) return null;
    
    const total = attendanceData.present + attendanceData.absent + attendanceData.late;
    return {
      ...attendanceData,
      presentPercentage: total ? ((attendanceData.present / total) * 100).toFixed(1) : 0,
      absentPercentage: total ? ((attendanceData.absent / total) * 100).toFixed(1) : 0,
      latePercentage: total ? ((attendanceData.late / total) * 100).toFixed(1) : 0
    };
  }, [attendanceData]);

  // Status helpers
  const getStatusColor = (percentage) => {
    if (percentage >= 95) return '#059669';
    if (percentage >= 85) return '#0284c7';
    if (percentage >= 75) return '#d97706';
    return '#dc2626';
  };

  const getStatusText = (percentage) => {
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 85) return 'Good';
    if (percentage >= 75) return 'Average';
    return 'At Risk';
  };

  const getAttendanceIcon = (status) => {
    switch(status) {
      case 'present': return <CheckCircle size={16} className="status-icon present" />;
      case 'absent': return <XCircle size={16} className="status-icon absent" />;
      case 'late': return <Clock size={16} className="status-icon late" />;
      default: return <AlertCircle size={16} />;
    }
  };

  // Toggle month expansion
  const toggleMonth = (monthIndex) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthIndex]: !prev[monthIndex]
    }));
  };

  // Export report
  const handleExport = () => {
    if (!rawData) return;
    
    // CSV export
    const headers = ['Date', 'Course', 'Subject', 'Status'];
    const rows = rawData.records?.map(r => [
      r.date,
      r.courseName,
      r.subject,
      r.status
    ]) || [];
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="attendance-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="attendance-page">
        <div className="error-container">
          <AlertCircle size={48} className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchAttendanceData} className="btn-primary">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats) {
    return (
      <div className="attendance-page">
        <div className="empty-state">
          <Calendar size={48} className="empty-icon" />
          <h3>No attendance records found</h3>
          <p>Your attendance data will appear here once available.</p>
        </div>
      </div>
    );
  }

  // Calculate circle progress
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * stats.overall) / 100;

  return (
    <div className="attendance-page">
      {/* Header */}
      <header className="attendance-header">
        <div className="header-title-section">
          <h1>Attendance Record</h1>
          <p>Track your class participation and punctuality</p>
        </div>
        <div className="header-actions">
          {courses.length > 0 && (
            <div className="filter-group">
              <Filter size={16} />
              <select 
                className="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(courseId => (
                  <option key={courseId} value={courseId}>
                    {rawData.records.find(r => r.courseId === courseId)?.courseName || courseId}
                  </option>
                ))}
              </select>
            </div>
          )}
          <select 
            className="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="semester">This Semester</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
          <div className="semester-badge">
            <span>{stats.semester}</span>
          </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="stats-grid">
        {/* Overall Circle */}
        <div className="stat-card main-stat">
          <div className="circle-container">
            <svg className="progress-circle" viewBox="0 0 120 120">
              <circle className="circle-bg" cx="60" cy="60" r="54" />
              <circle 
                className="circle-progress" 
                cx="60" 
                cy="60" 
                r="54"
                style={{ 
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  stroke: getStatusColor(stats.overall)
                }}
              />
            </svg>
            <div className="circle-content">
              <span className="percentage">{stats.overall}%</span>
              <span 
                className="status-label"
                style={{ color: getStatusColor(stats.overall) }}
              >
                {getStatusText(stats.overall)}
              </span>
            </div>
          </div>
          <div className="stat-label-area">
            <h3>Overall Attendance</h3>
            <p>Based on {stats.totalClasses} total classes</p>
          </div>
        </div>

        {/* Present Card */}
        <div className="stat-card detail-stat present">
          <div className="stat-header">
            <div className="stat-icon">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>{stats.presentPercentage}%</span>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.present}</span>
            <span className="stat-name">Present</span>
          </div>
        </div>

        {/* Late Card */}
        <div className="stat-card detail-stat late">
          <div className="stat-header">
            <div className="stat-icon">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-trend neutral">
              <span>{stats.latePercentage}%</span>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.late}</span>
            <span className="stat-name">Late</span>
          </div>
        </div>

        {/* Absent Card */}
        <div className="stat-card detail-stat absent">
          <div className="stat-header">
            <div className="stat-icon">
              <XCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="stat-trend negative">
              <span>{stats.absentPercentage}%</span>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.absent}</span>
            <span className="stat-name">Absent</span>
          </div>
        </div>
      </div>

      {/* Performance Insight */}
      {stats.overall >= 90 && (
        <div className="insight-banner success">
          <div className="insight-icon">
            <Award size={20} />
          </div>
          <div className="insight-content">
            <h4>Great job!</h4>
            <p>Your attendance is excellent. Keep it up!</p>
          </div>
        </div>
      )}

      {stats.overall < 75 && (
        <div className="insight-banner warning">
          <div className="insight-icon">
            <AlertCircle size={20} />
          </div>
          <div className="insight-content">
            <h4>Attendance Alert</h4>
            <p>Your attendance is below 75%. Please attend more classes.</p>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      <div className="monthly-section">
        <div className="section-header">
          <div className="section-title">
            <h2>Monthly Breakdown</h2>
            <span className="subtitle">Click on a month to view details</span>
          </div>
          <button className="export-btn" onClick={handleExport}>
            <Download size={16} />
            Export Report
          </button>
        </div>

        <div className="months-list">
          {stats.monthly?.map((month, idx) => {
            const isExpanded = expandedMonths[idx];
            const hasDetails = month.details && month.details.length > 0;
            
            return (
              <div 
                key={idx} 
                className={`month-item ${isExpanded ? 'expanded' : ''}`}
              >
                <div 
                  className="month-summary"
                  onClick={() => hasDetails && toggleMonth(idx)}
                  style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                >
                  <div className="month-main">
                    <div className="month-icon">
                      <Calendar size={16} />
                    </div>
                    <div className="month-details">
                      <h4>{month.month}</h4>
                      <span className="classes-count">
                        {month.present} of {month.classes} classes attended
                      </span>
                    </div>
                  </div>

                  <div className="month-progress">
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${month.percentage}%`,
                          backgroundColor: getStatusColor(month.percentage)
                        }}
                      />
                    </div>
                    <span 
                      className="percentage-badge"
                      style={{ color: getStatusColor(month.percentage) }}
                    >
                      {month.percentage}%
                    </span>
                  </div>

                  <div className="month-status">
                    {month.percentage === 100 ? (
                      <span className="perfect-badge">Perfect</span>
                    ) : month.absent > 0 ? (
                      <span className="absent-count">{month.absent} absent</span>
                    ) : (
                      <span className="good-badge">Good</span>
                    )}
                    {hasDetails && (
                      <span className="expand-icon">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="month-details-expanded">
                    <div className="details-header">
                      <span>Date</span>
                      <span>Subject</span>
                      <span>Status</span>
                    </div>
                    {month.details.map((detail, dIdx) => (
                      <div key={dIdx} className="detail-row">
                        <span className="detail-date">
                          {new Date(detail.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="detail-subject">{detail.subject}</span>
                        <span className={`detail-status ${detail.status}`}>
                          {getAttendanceIcon(detail.status)}
                          <span>{detail.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!stats.monthly || stats.monthly.length === 0) && (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <h3>No monthly records found</h3>
            <p>Attendance data will appear here once classes begin.</p>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="quick-stats">
        <div className="quick-stat-item">
          <span className="quick-label">Current Streak</span>
          <span className="quick-value">{stats.currentStreak} days</span>
        </div>
        <div className="quick-stat-item">
          <span className="quick-label">Last Absent</span>
          <span className="quick-value">
            {stats.lastAbsent 
              ? new Date(stats.lastAbsent).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'None'
            }
          </span>
        </div>
        <div className="quick-stat-item">
          <span className="quick-label">Classes Today</span>
          <span className="quick-value">{stats.classesToday}</span>
        </div>
      </div>
    </div>
  );
};

export default Attendance;