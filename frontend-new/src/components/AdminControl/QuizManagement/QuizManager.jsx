import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, 
  FaBook, FaCheckCircle, FaClock, FaSearch,
  FaFilter, FaRocket, FaQuestionCircle, FaSave,
  FaSpinner, FaExclamationTriangle, FaChartBar,
  FaUsers, FaStar, FaTimes, FaArrowLeft,
  FaChevronDown, FaList,
  FaBell, FaTrophy, FaPercentage, FaClipboardList,
  FaPlay, FaPause, FaHistory, FaFileExcel,
  FaFilePdf, FaCheck, FaTimesCircle
} from 'react-icons/fa';
import './QuizManager.css';
import QuizCreator from './QuizCreator';
import QuizSubmissions from './QuizSubmissions';
import { adminAPI } from '../../../services/api';

const QuizManager = ({ onViewReport }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [view, setView] = useState('list');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grouped');
  const [expandedCourses, setExpandedCourses] = useState({});
  
  const [statsFilter, setStatsFilter] = useState(null);
  
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalSubmissions: 0,
    activeQuizzes: 0,
    avgScore: 0,
    pendingReviews: 0
  });

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllQuizzes();
      
      if (res.data.success) {
        setQuizzes(res.data.quizzes || []);
        calculateStats(res.data.quizzes || []);
      }
    } catch (err) {
      toast.error('Failed to load quizzes', { style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await adminAPI.getCourses();
      
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
    } finally {
      setCoursesLoading(false);
    }
  };

  const calculateStats = (quizzesList) => {
    const totalSubmissions = quizzesList.reduce((acc, q) => acc + (q.submissions?.length || 0), 0);
    const activeQuizzes = quizzesList.filter(q => q.status === 'active').length;
    
    let totalScore = 0;
    let totalAttempts = 0;
    quizzesList.forEach(q => {
      q.submissions?.forEach(sub => {
        if (sub.obtainedMarks !== undefined) {
          totalScore += (sub.obtainedMarks / q.totalMarks) * 100;
          totalAttempts++;
        }
      });
    });

    setStats({
      totalQuizzes: quizzesList.length,
      totalSubmissions: totalSubmissions,
      activeQuizzes: activeQuizzes,
      avgScore: totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0,
      pendingReviews: quizzesList.reduce((acc, q) => 
        acc + (q.submissions?.filter(s => !s.isGraded)?.length || 0), 0)
    });
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const openSubmissions = (quizId) => {
    setSelectedQuiz(quizzes.find(q => q._id === quizId));
    setView('submissions');
  };

  const handleViewReport = (quizId) => {
    if (onViewReport) {
      onViewReport(quizId);
    } else {
      toast.error('Report view not available', { style: toastStyle });
    }
  };

  const startCreate = () => {
    setSelectedQuiz(null);
    setView('create');
  };

  const startEdit = (quiz) => {
    setSelectedQuiz(quiz);
    setView('edit');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    const loadId = toast.loading('Deleting...', { style: toastStyle });
    
    try {
      await adminAPI.deleteQuiz(id);
      toast.success('Quiz deleted!', { id: loadId, style: toastStyle });
      fetchQuizzes();
    } catch (err) {
      toast.error('Delete failed', { id: loadId, style: toastStyle });
    }
  };

  const toggleQuizStatus = async (quizId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await adminAPI.toggleQuizStatus(quizId, newStatus);
      toast.success(`Quiz ${newStatus === 'active' ? 'activated' : 'paused'}!`, { style: toastStyle });
      fetchQuizzes();
    } catch (err) {
      toast.error('Failed to update status', { style: toastStyle });
    }
  };

  // Rest of the functions (getGroupedQuizzes, getStatusBadge, etc.) remain the same
  const getGroupedQuizzes = () => {
    let filtered = quizzes.filter(q => {
      const matchesSearch = 
        q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || q.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    if (statsFilter === 'active') {
      filtered = filtered.filter(q => q.status === 'active');
    } else if (statsFilter === 'attempts') {
      filtered = filtered.filter(q => (q.submissions?.length || 0) > 0);
    }

    const grouped = {};
    filtered.forEach(quiz => {
      const courseId = quiz.courseId?._id || quiz.courseId || 'unknown';
      const courseName = quiz.courseName || 'Unknown Course';
      
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseId: courseId,
          courseName: courseName,
          quizzes: []
        };
      }
      grouped[courseId].quizzes.push(quiz);
    });

    Object.values(grouped).forEach(course => {
      course.quizzes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      course.quizzes.forEach((quiz, index) => {
        quiz.courseQuizNumber = index + 1;
      });
    });

    return Object.values(grouped);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#16a34a', color: '#fff' },
      inactive: { bg: '#9ca3af', color: '#fff' },
      completed: { bg: '#000B29', color: '#fff' },
      draft: { bg: '#f59e0b', color: '#fff' }
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

  const handleStatsClick = (type) => {
    if (statsFilter === type) {
      setStatsFilter(null);
    } else {
      setStatsFilter(type);
    }
  };

  const groupedData = getGroupedQuizzes();
  const flatQuizzes = quizzes.filter(q => {
    const matchesSearch = 
      q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Submissions View
  if (view === 'submissions' && selectedQuiz) {
    return (
      <QuizSubmissions 
        quiz={selectedQuiz} 
        onBack={() => setView('list')}
        onRefresh={fetchQuizzes}
      />
    );
  }

  // Create/Edit View
  if (view === 'create' || view === 'edit') {
    return (
      <QuizCreator
        quiz={selectedQuiz}
        courses={courses}
        onCancel={() => setView('list')}
        onSuccess={() => {
          fetchQuizzes();
          setView('list');
        }}
      />
    );
  }

  // Total Attempts View
  if (statsFilter === 'attempts') {
    const courseAttempts = getAllAttemptsByCourse();
    
    return (
      <div className="quiz-manager">
        <div className="manager-header">
          <div>
            <h1><FaUsers /> Total Attempts</h1>
            <p>All quiz submissions grouped by course</p>
          </div>
          <button className="btn-back" onClick={() => setStatsFilter(null)}>
            <FaArrowLeft /> Back
          </button>
        </div>
        
        <div className="stats-detail-view">
          {courseAttempts.length === 0 ? (
            <div className="empty-state-large">
              <FaUsers size={64} />
              <h3>No attempts yet</h3>
              <p>Students haven't attempted any quizzes</p>
            </div>
          ) : (
            <div className="attempts-by-course">
              {courseAttempts.map((course) => (
                <div key={course.courseId} className="attempts-course-group">
                  <div className="attempts-course-header">
                    <FaBook /> {course.courseName}
                    <span style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.9 }}>
                      {course.attempts.length} attempts
                    </span>
                  </div>
                  
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Quiz</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.attempts.map((attempt, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="student-info-cell">
                              <div className="student-avatar">
                                {attempt.studentId?.name?.charAt(0) || 'S'}
                              </div>
                              <span className="student-name">
                                {attempt.studentId?.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="quiz-name-cell">{attempt.quizTitle}</td>
                          <td>
                            <span className="score-badge">
                              {attempt.obtainedMarks}/{attempt.totalMarks}
                            </span>
                          </td>
                          <td>
                            <span className={`percentage-badge ${getGradeColor(attempt.percentage)}`}>
                              {attempt.percentage}%
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(attempt.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Average Scores View
  if (statsFilter === 'scores') {
    const courseScores = getScoresByCourse();
    
    return (
      <div className="quiz-manager">
        <div className="manager-header">
          <div>
            <h1><FaTrophy /> Average Scores</h1>
            <p>Performance overview grouped by course</p>
          </div>
          <button className="btn-back" onClick={() => setStatsFilter(null)}>
            <FaArrowLeft /> Back
          </button>
        </div>
        
        <div className="stats-detail-view">
          <div className="score-overview-header">
            <FaTrophy />
            <h2>{stats.avgScore}%</h2>
            <p>Overall Average Score Across All Quizzes</p>
          </div>
          
          <div className="course-scores-container">
            {courseScores.map((course) => (
              <div key={course.courseId} className="course-score-card">
                <div className="course-score-header">
                  <h3><FaBook /> {course.courseName}</h3>
                  <span className="course-average">{course.courseAvg}% avg</span>
                </div>
                
                <div className="quiz-scores-list">
                  {course.quizzes.map((quiz) => (
                    <div key={quiz._id} className="quiz-score-item">
                      <div className="quiz-score-info">
                        <h4>{quiz.title}</h4>
                        <p>{quiz.attemptsCount} attempts • {quiz.questions?.length || 0} questions</p>
                      </div>
                      
                      <div className="quiz-score-bar-container">
                        <div className="score-progress-bg">
                          <div 
                            className={`score-progress-fill ${
                              quiz.avgScore >= 80 ? 'excellent' :
                              quiz.avgScore >= 60 ? 'good' :
                              quiz.avgScore >= 40 ? 'average' : 'poor'
                            }`}
                            style={{ width: `${quiz.avgScore}%` }}
                          />
                        </div>
                        <span className="score-value">{quiz.avgScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Quizzes View
  if (statsFilter === 'active') {
    const activeQuizzesList = quizzes.filter(q => q.status === 'active');
    
    return (
      <div className="quiz-manager">
        <div className="manager-header">
          <div>
            <h1><FaPlay /> Active Quizzes</h1>
            <p>Currently active and available for students</p>
          </div>
          <button className="btn-back" onClick={() => setStatsFilter(null)}>
            <FaArrowLeft /> Back
          </button>
        </div>
        
        <div className="stats-detail-view">
          {activeQuizzesList.length === 0 ? (
            <div className="empty-state-large">
              <FaPlay size={64} />
              <h3>No active quizzes</h3>
              <p>Activate quizzes to make them available for students</p>
            </div>
          ) : (
            <div className="active-quizzes-list">
              {activeQuizzesList.map((quiz) => (
                <div key={quiz._id} className="active-quiz-card">
                  <div className="active-quiz-icon">
                    <FaPlay />
                  </div>
                  
                  <div className="active-quiz-info">
                    <h3>{quiz.title}</h3>
                    <div className="active-quiz-meta">
                      <span><FaBook /> {quiz.courseName}</span>
                      <span><FaQuestionCircle /> {quiz.questions?.length || 0} questions</span>
                      <span><FaClock /> {quiz.duration || 'No limit'} mins</span>
                      <span>{quiz.totalMarks} marks</span>
                    </div>
                  </div>
                  
                  <span className="active-badge">
                    <FaCheckCircle /> Live
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Total Quizzes View
  if (statsFilter === 'all') {
    return (
      <div className="quiz-manager">
        <div className="manager-header">
          <div>
            <h1><FaClipboardList /> All Quizzes</h1>
            <p>Complete list of all quizzes</p>
          </div>
          <button className="btn-back" onClick={() => setStatsFilter(null)}>
            <FaArrowLeft /> Back
          </button>
        </div>
        
        <div className="stats-detail-view">
          <div className="total-quizzes-list">
            {quizzes.map((quiz, index) => (
              <div key={quiz._id} className="total-quiz-item">
                <div className="total-quiz-number">Q{index + 1}</div>
                
                <div className="total-quiz-info">
                  <h4>{quiz.title}</h4>
                  <p>{quiz.courseName} • {getStatusBadge(quiz.status)}</p>
                </div>
                
                <div className="total-quiz-stats">
                  <div className="total-quiz-stat">
                    <span className="total-quiz-stat-value">
                      {quiz.questions?.length || 0}
                    </span>
                    <span className="total-quiz-stat-label">Questions</span>
                  </div>
                  <div className="total-quiz-stat">
                    <span className="total-quiz-stat-value">
                      {quiz.submissions?.length || 0}
                    </span>
                    <span className="total-quiz-stat-label">Attempts</span>
                  </div>
                  <div className="total-quiz-stat">
                    <span className="total-quiz-stat-value">
                      {quiz.totalMarks}
                    </span>
                    <span className="total-quiz-stat-label">Marks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Helper functions for stats views
  const getAllAttemptsByCourse = () => {
    const courseAttempts = {};
    
    quizzes.forEach(quiz => {
      const courseId = quiz.courseId?._id || quiz.courseId || 'unknown';
      const courseName = quiz.courseName || 'Unknown Course';
      
      if (!courseAttempts[courseId]) {
        courseAttempts[courseId] = {
          courseId,
          courseName,
          attempts: []
        };
      }
      
      quiz.submissions?.forEach(sub => {
        courseAttempts[courseId].attempts.push({
          ...sub,
          quizTitle: quiz.title,
          totalMarks: quiz.totalMarks,
          percentage: ((sub.obtainedMarks / quiz.totalMarks) * 100).toFixed(1)
        });
      });
    });

    Object.values(courseAttempts).forEach(course => {
      course.attempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    });

    return Object.values(courseAttempts).filter(c => c.attempts.length > 0);
  };

  const getScoresByCourse = () => {
    const courseScores = {};
    
    quizzes.forEach(quiz => {
      const courseId = quiz.courseId?._id || quiz.courseId || 'unknown';
      const courseName = quiz.courseName || 'Unknown Course';
      
      if (!courseScores[courseId]) {
        courseScores[courseId] = {
          courseId,
          courseName,
          quizzes: [],
          totalAttempts: 0,
          totalScore: 0
        };
      }
      
      const attempts = quiz.submissions || [];
      const avgScore = attempts.length > 0 
        ? attempts.reduce((acc, s) => acc + (s.obtainedMarks/quiz.totalMarks)*100, 0) / attempts.length
        : 0;

      courseScores[courseId].quizzes.push({
        ...quiz,
        avgScore: Math.round(avgScore),
        attemptsCount: attempts.length
      });
      
      courseScores[courseId].totalAttempts += attempts.length;
      courseScores[courseId].totalScore += avgScore;
    });

    Object.values(courseScores).forEach(course => {
      course.courseAvg = course.quizzes.length > 0 
        ? Math.round(course.totalScore / course.quizzes.length)
        : 0;
    });

    return Object.values(courseScores);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  };

  // Main List View Return
  return (
    <div className="quiz-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1><FaQuestionCircle /> Quiz Management</h1>
          <p>Create and manage MCQ quizzes for your courses</p>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={startCreate}>
            <FaPlus /> Create New Quiz
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div 
          className={`stat-card ${statsFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleStatsClick('all')}
          style={{ cursor: 'pointer', position: 'relative' }}
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
            <span className="stat-value">{stats.totalQuizzes}</span>
            <span className="stat-label">Total Quizzes</span>
          </div>
          {statsFilter === 'all' && <div className="active-indicator" />}
        </div>
        
        <div 
          className={`stat-card ${statsFilter === 'attempts' ? 'active' : ''}`}
          onClick={() => handleStatsClick('attempts')}
          style={{ cursor: 'pointer', position: 'relative' }}
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
            <span className="stat-label">Total Attempts</span>
          </div>
          {statsFilter === 'attempts' && <div className="active-indicator" />}
        </div>
        
        <div 
          className={`stat-card ${statsFilter === 'active' ? 'active' : ''}`}
          onClick={() => handleStatsClick('active')}
          style={{ cursor: 'pointer', position: 'relative' }}
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
            <FaPlay color="white" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.activeQuizzes}</span>
            <span className="stat-label">Active Quizzes</span>
          </div>
          {statsFilter === 'active' && <div className="active-indicator" />}
        </div>
        
        <div 
          className={`stat-card ${statsFilter === 'scores' ? 'active' : ''}`}
          onClick={() => handleStatsClick('scores')}
          style={{ cursor: 'pointer', position: 'relative' }}
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
            <FaTrophy color="white" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.avgScore}%</span>
            <span className="stat-label">Avg Score</span>
          </div>
          {statsFilter === 'scores' && <div className="active-indicator" />}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select">
          <FaFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="view-toggle">
          <button 
            className={viewMode === 'grouped' ? 'active' : ''}
            onClick={() => setViewMode('grouped')}
            title="Grouped by Course"
          >
            <FaChartBar />
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <FaList />
          </button>
        </div>

        <button className="btn-refresh" onClick={fetchQuizzes}>
          <FaSpinner className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Course Groups or List View */}
      <div className={viewMode === 'grouped' ? 'course-groups' : 'assignments-list-view'}>
        {loading ? (
          <div className="loading-cell">
            <FaSpinner className="spin" /> Loading quizzes...
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
                        {course.quizzes.length} quizzes
                      </span>
                    </div>
                  </div>
                  <div className="course-stats">
                    <div className="stat">
                      <span className="stat-value">
                        {course.quizzes.reduce((acc, q) => acc + (q.submissions?.length || 0), 0)}
                      </span>
                      <span className="stat-label">Attempts</span>
                    </div>
                    <button className={`expand-btn ${expandedCourses[course.courseId] ? 'open' : ''}`}>
                      <FaChevronDown />
                    </button>
                  </div>
                </div>

                <div className={`course-assignments ${expandedCourses[course.courseId] ? 'expanded' : ''}`}>
                  {course.quizzes.map(quiz => (
                    <div key={quiz._id} className="assignment-row">
                      <div className="assignment-info">
                        <span className="asm-number">Q{quiz.courseQuizNumber}</span>
                        <div className="assignment-details">
                          <h4>{quiz.title}</h4>
                          <div className="assignment-meta">
                            <span><FaQuestionCircle /> {quiz.questions?.length || 0} questions</span>
                            <span><FaClock /> {quiz.duration || 'No limit'} mins</span>
                            <span>{quiz.totalMarks} marks</span>
                            {getStatusBadge(quiz.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="assignment-actions">
                        <button 
                          className="btn-view-report"
                          onClick={() => handleViewReport(quiz._id)}
                          title="View Detailed Report"
                        >
                          <FaChartBar /> Report
                        </button>
                        
                        <button 
                          className="btn-submissions"
                          onClick={() => openSubmissions(quiz._id)}
                        >
                          <FaUsers /> {quiz.submissions?.length || 0} attempts
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => startEdit(quiz)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-toggle"
                          onClick={() => toggleQuizStatus(quiz._id, quiz.status)}
                          title={quiz.status === 'active' ? 'Pause' : 'Activate'}
                          style={{
                            background: quiz.status === 'active' ? '#fef3c7' : '#dcfce7',
                            color: quiz.status === 'active' ? '#92400e' : '#166534'
                          }}
                        >
                          {quiz.status === 'active' ? <FaPause /> : <FaPlay />}
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(quiz._id)}
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
              <FaQuestionCircle size={64} />
              <h3>No quizzes found</h3>
              <p>Create your first quiz to get started</p>
            </div>
          )
        ) : (
          flatQuizzes.length > 0 ? (
            <div className="flat-assignments-list">
              {flatQuizzes.map((quiz, index) => (
                <div key={quiz._id} className="assignment-row list-view">
                  <div className="assignment-info">
                    <span className="asm-number">Q{index + 1}</span>
                    <div className="assignment-details">
                      <h4>{quiz.title}</h4>
                      <div className="assignment-meta">
                        <span className="course-tag"><FaBook /> {quiz.courseName}</span>
                        <span><FaQuestionCircle /> {quiz.questions?.length || 0} questions</span>
                        <span>{quiz.totalMarks} marks</span>
                        {getStatusBadge(quiz.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="assignment-actions">
                    <button 
                      className="btn-view-report"
                      onClick={() => handleViewReport(quiz._id)}
                      title="View Detailed Report"
                    >
                      <FaChartBar /> Report
                    </button>
                    
                    <button 
                      className="btn-submissions"
                      onClick={() => openSubmissions(quiz._id)}
                    >
                      <FaUsers /> {quiz.submissions?.length || 0}
                    </button>
                    <button 
                      className="btn-edit" 
                      onClick={() => startEdit(quiz)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-toggle"
                      onClick={() => toggleQuizStatus(quiz._id, quiz.status)}
                      title={quiz.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {quiz.status === 'active' ? <FaPause /> : <FaPlay />}
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(quiz._id)}
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
              <FaQuestionCircle size={64} />
              <h3>No quizzes found</h3>
              <p>Create your first quiz to get started</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default QuizManager;