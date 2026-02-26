import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  Share2,
  Printer,
  MoreHorizontal,
  Star,
  Target,
  BookOpen,
  Clock,
  ChevronDown,
  Medal,
  TrendingDown,
  Minus
} from 'lucide-react';
import './Results.css';

const Results = () => {
  const [selectedSemester, setSelectedSemester] = useState('Fall 2025');
  const [showDropdown, setShowDropdown] = useState(false);

  const semesters = ['Fall 2025', 'Spring 2025', 'Fall 2024'];

  const results = {
    gpa: 3.85,
    cgpa: 3.72,
    totalCredits: 45,
    earnedCredits: 42,
    rank: 'Top 10%',
    totalCourses: 6,
    completed: 4,
    current: 2,
    dropped: 0
  };

  const gradeDistribution = [
    { grade: 'A', count: 3, color: '#10b981' },
    { grade: 'A-', count: 2, color: '#34d399' },
    { grade: 'B+', count: 1, color: '#f59e0b' },
    { grade: 'B', count: 0, color: '#fbbf24' },
    { grade: 'C', count: 0, color: '#f97316' }
  ];

  const courses = [
    { 
      code: 'DM-301',
      course: 'Advanced Digital Marketing', 
      credit: 3,
      grade: 'A', 
      percentage: 94, 
      status: 'current',
      semester: 'Fall 2025',
      instructor: 'Dr. Sarah Khan'
    },
    { 
      code: 'GD-201',
      course: 'Graphic Design Mastery', 
      credit: 3,
      grade: 'A', 
      percentage: 92, 
      status: 'completed',
      semester: 'Fall 2025',
      instructor: 'Prof. Ali Ahmad'
    },
    { 
      code: 'FL-401',
      course: 'Freelancing & Entrepreneurship', 
      credit: 3,
      grade: 'A-', 
      percentage: 89, 
      status: 'completed',
      semester: 'Fall 2025',
      instructor: 'Mam Nadia Hussain'
    },
    { 
      code: 'CAD-101',
      course: 'AutoCAD Professional', 
      credit: 4,
      grade: 'A', 
      percentage: 96, 
      status: 'completed',
      semester: 'Fall 2025',
      instructor: 'Eng. Usman Tariq'
    },
    { 
      code: 'WD-501',
      course: 'Full Stack Web Development', 
      credit: 4,
      grade: 'A-', 
      percentage: 88, 
      status: 'completed',
      semester: 'Spring 2025',
      instructor: 'Sir Bilal Qadir'
    },
    { 
      code: 'UX-301',
      course: 'UX Research Methods', 
      credit: 3,
      grade: 'B+', 
      percentage: 85, 
      status: 'completed',
      semester: 'Spring 2025',
      instructor: 'Dr. Ayesha Noor'
    }
  ];

  const currentCourses = courses.filter(c => c.status === 'current');
  const completedCourses = courses.filter(c => c.status === 'completed');

  const getGradeColor = (grade) => {
    const colors = {
      'A': '#10b981',
      'A-': '#34d399',
      'B+': '#f59e0b',
      'B': '#fbbf24',
      'B-': '#f97316',
      'C+': '#ef4444',
      'C': '#dc2626'
    };
    return colors[grade] || '#6b7280';
  };

  const getGradeIcon = (percentage) => {
    if (percentage >= 90) return <Star size={16} className="grade-icon excellent" />;
    if (percentage >= 80) return <TrendingUp size={16} className="grade-icon good" />;
    if (percentage >= 70) return <Minus size={16} className="grade-icon average" />;
    return <TrendingDown size={16} className="grade-icon poor" />;
  };

  return (
    <div className="results-page">
      {/* Header */}
      <header className="results-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Academic Results</h1>
            <p>Track your academic performance and achievements</p>
          </div>
          <div className="header-actions">
            <div className="semester-dropdown">
              <button 
                className="dropdown-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Calendar size={18} />
                <span>{selectedSemester}</span>
                <ChevronDown size={16} className={showDropdown ? 'rotate' : ''} />
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  {semesters.map(sem => (
                    <button 
                      key={sem}
                      onClick={() => {
                        setSelectedSemester(sem);
                        setShowDropdown(false);
                      }}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="action-icon-btn">
              <Download size={20} />
            </button>
            <button className="action-icon-btn">
              <Printer size={20} />
            </button>
            <button className="action-icon-btn">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* GPA Hero Section */}
      <div className="gpa-hero">
        <div className="gpa-main-card">
          <div className="gpa-visual">
            <svg viewBox="0 0 120 120" className="gpa-circle">
              <circle className="circle-bg" cx="60" cy="60" r="54" />
              <circle 
                className="circle-progress" 
                cx="60" 
                cy="60" 
                r="54"
                style={{ strokeDashoffset: 339.292 - (339.292 * results.gpa) / 4 }}
              />
            </svg>
            <div className="gpa-content">
              <span className="gpa-label">GPA</span>
              <span className="gpa-value">{results.gpa}</span>
              <span className="gpa-scale">/ 4.0</span>
            </div>
          </div>
          <div className="gpa-details">
            <div className="gpa-header">
              <h3>Semester Performance</h3>
              <span className="rank-badge">
                <Medal size={14} />
                {results.rank}
              </span>
            </div>
            <div className="gpa-stats-row">
              <div className="gpa-stat">
                <span className="stat-label">CGPA</span>
                <span className="stat-value">{results.cgpa}</span>
              </div>
              <div className="gpa-stat">
                <span className="stat-label">Credits</span>
                <span className="stat-value">{results.earnedCredits}/{results.totalCredits}</span>
              </div>
              <div className="gpa-stat">
                <span className="stat-label">Completion</span>
                <span className="stat-value">{Math.round((results.earnedCredits/results.totalCredits)*100)}%</span>
              </div>
            </div>
            <div className="gpa-progress-bar">
              <div 
                className="gpa-progress-fill" 
                style={{ width: `${(results.gpa/4)*100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats-grid">
          <div className="quick-stat-card courses">
            <div className="quick-icon">
              <BookOpen size={24} />
            </div>
            <div className="quick-info">
              <h4>{results.totalCourses}</h4>
              <p>Total Courses</p>
            </div>
          </div>
          <div className="quick-stat-card completed">
            <div className="quick-icon">
              <Award size={24} />
            </div>
            <div className="quick-info">
              <h4>{results.completed}</h4>
              <p>Completed</p>
            </div>
          </div>
          <div className="quick-stat-card current">
            <div className="quick-icon">
              <Clock size={24} />
            </div>
            <div className="quick-info">
              <h4>{results.current}</h4>
              <p>In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution & Current Courses */}
      <div className="results-grid">
        {/* Grade Distribution */}
        <div className="distribution-card">
          <div className="card-header">
            <h3>Grade Distribution</h3>
            <button className="more-btn">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="distribution-chart">
            {gradeDistribution.map((item, idx) => (
              <div key={idx} className="dist-bar-group">
                <div className="dist-bar-container">
                  <div 
                    className="dist-bar" 
                    style={{ 
                      height: `${item.count * 60}px`,
                      backgroundColor: item.color,
                      opacity: item.count > 0 ? 1 : 0.3
                    }}
                  >
                    {item.count > 0 && <span className="bar-count">{item.count}</span>}
                  </div>
                </div>
                <span className="dist-label">{item.grade}</span>
              </div>
            ))}
          </div>
          <div className="distribution-legend">
            <div className="legend-item">
              <span className="dot excellent"></span>
              <span>Excellent (A)</span>
            </div>
            <div className="legend-item">
              <span className="dot good"></span>
              <span>Good (B)</span>
            </div>
            <div className="legend-item">
              <span className="dot average"></span>
              <span>Average (C)</span>
            </div>
          </div>
        </div>

        {/* Current Courses */}
        <div className="current-courses-card">
          <div className="card-header">
            <h3>Current Semester</h3>
            <span className="live-badge">LIVE</span>
          </div>
          <div className="current-list">
            {currentCourses.map((course, idx) => (
              <div key={idx} className="current-item">
                <div className="current-icon">
                  <Target size={20} />
                </div>
                <div className="current-info">
                  <h4>{course.course}</h4>
                  <p>{course.code} • {course.instructor}</p>
                </div>
                <div className="current-progress">
                  <div className="progress-ring-small">
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
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray={`${course.percentage}, 100`}
                      />
                    </svg>
                    <span>{course.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="results-table-card">
        <div className="table-header-section">
          <div>
            <h3>Detailed Results</h3>
            <p>Complete academic record</p>
          </div>
          <button className="download-transcript">
            <FileText size={18} />
            Transcript
          </button>
        </div>

        <div className="results-table">
          <div className="table-row header">
            <span className="col-code">Code</span>
            <span className="col-course">Course</span>
            <span className="col-credit">Credit</span>
            <span className="col-semester">Semester</span>
            <span className="col-percentage">Score</span>
            <span className="col-grade">Grade</span>
            <span className="col-status">Status</span>
          </div>

          {completedCourses.map((item, idx) => (
            <div key={idx} className="table-row data">
              <span className="col-code">{item.code}</span>
              <span className="col-course">
                <div className="course-info">
                  <span className="course-title">{item.course}</span>
                  <span className="course-instructor">{item.instructor}</span>
                </div>
              </span>
              <span className="col-credit">{item.credit}</span>
              <span className="col-semester">{item.semester}</span>
              <span className="col-percentage">
                <div className="percentage-display">
                  <div className="mini-bar">
                    <div 
                      className="mini-fill" 
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: getGradeColor(item.grade)
                      }}
                    />
                  </div>
                  <span className="pct-text">{item.percentage}%</span>
                </div>
              </span>
              <span className="col-grade">
                <span 
                  className="grade-pill"
                  style={{ 
                    backgroundColor: `${getGradeColor(item.grade)}20`,
                    color: getGradeColor(item.grade)
                  }}
                >
                  {getGradeIcon(item.percentage)}
                  {item.grade}
                </span>
              </span>
              <span className="col-status">
                <span className={`status-pill ${item.status}`}>
                  {item.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;