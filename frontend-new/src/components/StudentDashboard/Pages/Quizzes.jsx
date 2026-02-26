import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { 
  FaQuestionCircle, FaClock, FaCheckCircle, FaTimesCircle,
  FaPlay, FaTrophy, FaPercentage, FaArrowRight, FaSpinner,
  FaBook, FaHistory, FaStar, FaCalendarAlt, FaHourglassHalf,
  FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaFlag,
  FaGraduationCap, FaBell, FaBellSlash, FaSearch, FaEye,
  FaFolderOpen, FaChevronDown, FaChartLine, FaExclamationCircle,
  FaFire, FaBrain, FaAward, FaRedo, FaExclamationTriangle,
  FaLightbulb, FaChartBar, FaClock as FaClockIcon, FaUserGraduate,
  FaFileAlt, FaPrint, FaShareAlt, FaHome, FaArrowLeft, FaCheckDouble,
  FaTimes as FaCross, FaExternalLinkAlt
} from 'react-icons/fa';
import './Quizzes.css';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({});
  
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [viewingDetailedResult, setViewingDetailedResult] = useState(null);
  const [detailedQuizData, setDetailedQuizData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  
  const [socket, setSocket] = useState(null);

  const { userId, token, user } = getAuthData();
  const API_URL = 'http://localhost:5000/api';

  function getAuthData() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      return { userId: user._id || user.id, token, user };
    } catch {
      return { userId: null, token: null, user: {} };
    }
  }

  const loadNotifications = () => {
    const saved = localStorage.getItem(`quiz_notifs_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) { console.error(e); }
    }
  };

  const saveNotifications = (notifs) => {
    localStorage.setItem(`quiz_notifs_${userId}`, JSON.stringify(notifs));
  };

  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotifs = [notification, ...prev].slice(0, 50);
      saveNotifications(newNotifs);
      return newNotifs;
    });
    setUnreadCount(c => c + 1);
  };

  const markRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(0);
  };

  const clearNotifs = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`quiz_notifs_${userId}`);
  };

  const deleteNotif = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  };

  // Navigate to specific quiz from notification
  const navigateToQuiz = (quizId, courseName) => {
    setActiveTab('available');
    setShowNotifPanel(false);
    
    // Expand the specific course
    if (courseName) {
      setExpandedCourses(prev => ({
        ...prev,
        [courseName]: true
      }));
    }
    
    // Scroll to quiz after a short delay
    setTimeout(() => {
      const quizElement = document.getElementById(`quiz-${quizId}`);
      if (quizElement) {
        quizElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        quizElement.classList.add('highlight-quiz');
        setTimeout(() => quizElement.classList.remove('highlight-quiz'), 2000);
      }
    }, 300);
    
    toast.success('Navigating to quiz...');
  };

  // Handle notification click - redirect to appropriate section
  const handleNotificationClick = (notification) => {
    markRead(notification.id);
    
    if (notification.type === 'new_quiz' && notification.quizId) {
      navigateToQuiz(notification.quizId, notification.courseName);
    } else if (notification.type === 'graded' && notification.quizId) {
      // Find the result and show details
      const result = results.find(r => r.quizId?.toString() === notification.quizId?.toString());
      if (result) {
        viewResultDetails(result);
        setShowNotifPanel(false);
      } else {
        setActiveTab('completed');
        setShowNotifPanel(false);
        toast.success('Showing completed quizzes');
      }
    } else {
      setShowNotifPanel(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!token || !userId) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [quizRes, resultRes] = await Promise.all([
        axios.get(`${API_URL}/quizzes/my-quizzes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/quizzes/my-results`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (quizRes.data.success && resultRes.data.success) {
        const attemptedIds = new Set(
          (resultRes.data.results || []).map(r => r.quizId?.toString())
        );
        
        const available = (quizRes.data.quizzes || []).filter(
          q => !attemptedIds.has(q._id?.toString())
        );
        
        setQuizzes(available);
        setResults(resultRes.data.results || []);
        
        // Initialize expanded state for courses
        const allCourseNames = [...new Set([
          ...available.map(q => q.courseName),
          ...resultRes.data.results.map(r => r.courseName)
        ])];
        const collapsed = {};
        allCourseNames.forEach(name => collapsed[name] = false);
        setExpandedCourses(collapsed);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  // Fetch detailed quiz result with questions
  const fetchQuizDetails = async (quizId) => {
    try {
      setLoadingDetails(true);
      const res = await axios.get(`${API_URL}/quizzes/${quizId}/my-result`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setDetailedQuizData(res.data.quiz);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch quiz details:', err);
      toast.error('Failed to load quiz details');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // View result details with full data
  const viewResultDetails = async (result) => {
    // First set basic data
    setViewingDetailedResult(result);
    
    // Then fetch detailed data with questions
    const detailedData = await fetchQuizDetails(result.quizId);
    
    if (detailedData) {
      setDetailedQuizData(detailedData.quiz);
      // Merge the submission data with result
      setViewingDetailedResult(prev => ({
        ...prev,
        ...detailedData.submission,
        questions: detailedData.quiz.questions
      }));
    }
  };

  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      newSocket.emit('joinStudentRoom', userId);
    });

    newSocket.on('newQuiz', (data) => {
      if (!data?.quiz) return;
      
      addNotification({
        id: Date.now(),
        type: 'new_quiz',
        title: 'New Quiz Available!',
        message: `${data.quiz.title} in ${data.quiz.courseName}`,
        quizId: data.quiz.id || data.quiz._id,
        courseId: data.quiz.courseId,
        courseName: data.quiz.courseName,
        createdAt: new Date().toISOString(),
        read: false,
        data: data.quiz
      });

      toast.success(`${data.quiz.title} is now available!`, {
        duration: 6000,
        action: { 
          label: 'View', 
          onClick: () => {
            navigateToQuiz(data.quiz.id || data.quiz._id, data.quiz.courseName);
          }
        }
      });
      
      fetchData();
    });

    newSocket.on('quizReminder', (data) => {
      addNotification({
        id: Date.now(),
        type: 'reminder',
        title: 'Quiz Reminder',
        message: `${data.quizTitle} starts in 1 hour`,
        quizId: data.quizId,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      toast(`${data.quizTitle} starts in 1 hour!`, {
        icon: '⏰',
        duration: 8000
      });
    });

    newSocket.on('quizGraded', (data) => {
      addNotification({
        id: Date.now(),
        type: 'graded',
        title: 'Results Available!',
        message: `${data.quizTitle}: ${data.obtainedMarks}/${data.totalMarks}`,
        quizId: data.quizId,
        createdAt: new Date().toISOString(),
        read: false
      });

      toast.success(`${data.quizTitle} results: ${data.obtainedMarks}/${data.totalMarks}`, {
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => {
            // Find and show the result
            const result = results.find(r => r.quizId?.toString() === data.quizId?.toString());
            if (result) {
              viewResultDetails(result);
            } else {
              setActiveTab('completed');
            }
          }
        }
      });
      
      fetchData();
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft]);

  const startQuiz = async (quiz) => {
    if (isStarting) return;
    
    const alreadyDone = results.some(r => 
      r.quizId?.toString() === quiz._id?.toString()
    );
    
    if (alreadyDone) {
      toast.error('You have already attempted this quiz!');
      return;
    }

    setIsStarting(true);
    const toastId = toast.loading('Starting quiz...');

    try {
      const res = await axios.get(`${API_URL}/quizzes/${quiz._id}/take`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActiveQuiz(res.data.quiz);
        setCurrentQIndex(0);
        setAnswers({});
        setTimeLeft((res.data.quiz.duration || 30) * 60);
        setShowResult(false);
        setQuizResult(null);
        toast.success('Good luck!', { id: toastId });
      }
    } catch (err) {
      let msg = 'Failed to start quiz';
      if (err.response?.status === 400) msg = 'Quiz already attempted or inactive';
      else if (err.response?.status === 403) msg = 'Not enrolled in this course';
      else if (err.response?.data?.error) msg = err.response.data.error;
      
      toast.error(msg, { id: toastId });
    } finally {
      setIsStarting(false);
    }
  };

  const selectAnswer = (qIdx, optIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitQuiz = async () => {
    if (isSubmitting || !activeQuiz) return;

    const totalQ = activeQuiz.questions.length;
    const answered = Object.keys(answers).length;
    
    if (answered < totalQ) {
      const confirmed = window.confirm(
        `Answered ${answered}/${totalQ} questions. Submit anyway?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting quiz...');

    try {
      const payload = {
        answers: activeQuiz.questions.map((q, idx) => ({
          questionId: q._id,
          selectedOption: answers[idx] !== undefined ? answers[idx] : -1
        })),
        timeTaken: ((activeQuiz.duration || 30) * 60) - timeLeft
      };

      const res = await axios.post(
        `${API_URL}/quizzes/${activeQuiz._id}/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setQuizResult(res.data.result);
        setShowResult(true);
        toast.success('Quiz submitted!', { id: toastId });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: '#16a34a', bg: '#dcfce7', icon: <FaTrophy /> };
    if (pct >= 80) return { label: 'A', color: '#16a34a', bg: '#dcfce7', icon: <FaAward /> };
    if (pct >= 70) return { label: 'B', color: '#3b82f6', bg: '#dbeafe', icon: <FaStar /> };
    if (pct >= 60) return { label: 'C', color: '#f59e0b', bg: '#fef3c7', icon: <FaCheckCircle /> };
    if (pct >= 50) return { label: 'D', color: '#f97316', bg: '#ffedd5', icon: <FaExclamationCircle /> };
    return { label: 'F', color: '#dc2626', bg: '#fee2e2', icon: <FaTimesCircle /> };
  };

  const toggleCourse = (courseName) => {
    setExpandedCourses(prev => ({ ...prev, [courseName]: !prev[courseName] }));
  };

  const groupedQuizzes = React.useMemo(() => {
    const filtered = quizzes.filter(q => 
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = {};
    filtered.forEach(q => {
      if (!grouped[q.courseName]) {
        grouped[q.courseName] = {
          courseName: q.courseName,
          courseId: q.courseId,
          quizzes: []
        };
      }
      grouped[q.courseName].quizzes.push(q);
    });

    return Object.values(grouped);
  }, [quizzes, searchQuery]);

  // Group results by course
  const groupedResults = React.useMemo(() => {
    const filtered = results.filter(r => 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = {};
    filtered.forEach(r => {
      if (!grouped[r.courseName]) {
        grouped[r.courseName] = {
          courseName: r.courseName,
          results: []
        };
      }
      grouped[r.courseName].results.push(r);
    });

    return Object.values(grouped);
  }, [results, searchQuery]);

  const stats = React.useMemo(() => {
    const total = quizzes.length + results.length;
    const completed = results.length;
    const passCount = results.filter(r => r.isPassed).length;
    const passRate = completed > 0 ? Math.round((passCount / completed) * 100) : 0;
    
    const avgScore = completed > 0
      ? Math.round(results.reduce((a, r) => 
          a + ((r.obtainedMarks / r.totalMarks) * 100), 0) / completed)
      : 0;

    const totalTime = results.reduce((a, r) => a + (r.timeTaken || 0), 0);
    const avgTime = completed > 0 ? Math.round(totalTime / completed / 60) : 0;

    const courseScores = {};
    results.forEach(r => {
      if (!courseScores[r.courseName]) {
        courseScores[r.courseName] = { total: 0, count: 0 };
      }
      courseScores[r.courseName].total += (r.obtainedMarks / r.totalMarks) * 100;
      courseScores[r.courseName].count += 1;
    });

    let bestCourse = 'N/A';
    let bestAvg = 0;
    Object.entries(courseScores).forEach(([course, data]) => {
      const avg = data.total / data.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestCourse = course;
      }
    });

    return { 
      total, completed, available: quizzes.length, passRate, 
      avgScore, avgTime, bestCourse, bestAvg: Math.round(bestAvg) 
    };
  }, [quizzes, results]);

  // ==================== VIEW: DETAILED RESULT ====================
  if (viewingDetailedResult) {
    const result = viewingDetailedResult;
    const percentage = ((result.obtainedMarks / result.totalMarks) * 100).toFixed(1);
    const grade = getGrade(parseFloat(percentage));
    const passed = parseFloat(percentage) >= (result.passingMarks || 50);
    
    // Use questions from detailed data or result
    const questions = detailedQuizData?.questions || result.questions || [];

    return (
      <div className="quiz-container detailed-result-view">
        <div className="page-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => {
              setViewingDetailedResult(null);
              setDetailedQuizData(null);
            }}>
              <FaArrowLeft /> Back to Results
            </button>
            <div className="header-title">
              <h1>Quiz Report Card</h1>
              <p>{result.title}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="result-score-display">
              <span className="score-main">{result.obtainedMarks}</span>
              <span className="score-total">/{result.totalMarks}</span>
              <span className="score-percent" style={{ color: '#ffffff' }}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-bar result-analytics">
          <div className="progress-ring">
            <svg viewBox="0 0 36 36">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path 
                className="circle-progress" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                strokeDasharray={`${percentage}, 100`}
                stroke={passed ? '#10b981' : '#E13630'}
              />
            </svg>
            <div className="progress-text">
              <span className="percentage" style={{ color: passed ? '#10b981' : '#E13630' }}>{Math.round(percentage)}%</span>
              <span className="label">Score</span>
            </div>
          </div>

          <div className="analytics-details">
            <div className="analytic-item grade-card" style={{ background: grade.bg, borderColor: grade.color }}>
              <div className="an-icon" style={{ color: grade.color }}>
                {grade.icon}
              </div>
              <div>
                <span className="value" style={{ color: grade.color }}>{grade.label}</span>
                <span className="label">Grade</span>
              </div>
            </div>
            <div className="analytic-item status-card" style={{ background: passed ? '#dcfce7' : '#fee2e2', borderColor: passed ? '#10b981' : '#dc2626' }}>
              <div className="an-icon" style={{ color: passed ? '#059669' : '#dc2626' }}>
                {passed ? <FaCheckCircle /> : <FaTimesCircle />}
              </div>
              <div>
                <span className="value" style={{ color: passed ? '#059669' : '#dc2626' }}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
                <span className="label">Status</span>
              </div>
            </div>
            <div className="analytic-item time-card" style={{ background: '#eff6ff', borderColor: '#3b82f6' }}>
              <div className="an-icon" style={{ color: '#3b82f6' }}>
                <FaClockIcon />
              </div>
              <div>
                <span className="value" style={{ color: '#3b82f6' }}>{formatTime(result.timeTaken || 0)}</span>
                <span className="label">Time Taken</span>
              </div>
            </div>
            <div className="analytic-item date-card" style={{ background: '#f3e8ff', borderColor: '#9333ea' }}>
              <div className="an-icon" style={{ color: '#9333ea' }}>
                <FaCalendarAlt />
              </div>
              <div>
                <span className="value" style={{ color: '#9333ea' }}>{new Date(result.submittedAt).toLocaleDateString()}</span>
                <span className="label">Submitted</span>
              </div>
            </div>
          </div>
        </div>

        {loadingDetails && (
          <div className="loading-details">
            <FaSpinner className="spin" /> Loading detailed results...
          </div>
        )}

        <div className="content-section">
          <h2 className="section-title"><FaFileAlt /> Question-wise Analysis</h2>
          <div className="questions-list">
            {result.answers?.map((ans, idx) => {
              const question = questions[idx] || {
                questionText: 'Question not available',
                options: [],
                correctOption: 0,
                marks: 10,
                explanation: ''
              };
              
              const yourAnswer = ans.selectedOption >= 0 
                ? String.fromCharCode(65 + ans.selectedOption) 
                : 'Not answered';
              const correctAnswer = String.fromCharCode(65 + question.correctOption);
              const isCorrect = ans.isCorrect;

              return (
                <div key={`analysis-${idx}`} className={`question-review-card ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-header">
                    <div className="review-title">
                      <span className="q-number">Q{idx + 1}</span>
                      <span className="q-marks">{ans.marksObtained}/{question.marks} marks</span>
                    </div>
                    <span className={`q-status-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                      {isCorrect ? <><FaCheckDouble /> Correct</> : <><FaTimes /> Wrong</>}
                    </span>
                  </div>
                  
                  <div className="review-body">
                    <p className="question-text">{question.questionText}</p>
                    
                    <div className="options-review">
                      {question.options?.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = ans.selectedOption === optIdx;
                        const isCorrectOption = question.correctOption === optIdx;
                        
                        let optionClass = 'option-item';
                        if (isCorrectOption) optionClass += ' correct-option';
                        else if (isSelected && !isCorrect) optionClass += ' wrong-option';
                        
                        return (
                          <div key={optIdx} className={optionClass}>
                            <span className="opt-letter">{letter}</span>
                            <span className="opt-text">{opt}</span>
                            {isCorrectOption && <FaCheck className="opt-icon correct" />}
                            {isSelected && !isCorrect && <FaTimes className="opt-icon wrong" />}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="explanation-box">
                        <div className="exp-header">
                          <FaLightbulb />
                          <span>Explanation</span>
                        </div>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="action-bar">
          <button className="btn-secondary" onClick={() => window.print()}>
            <FaPrint /> Print Report
          </button>
          <button className="btn-primary" onClick={() => {
            setViewingDetailedResult(null);
            setDetailedQuizData(null);
          }}>
            <FaHome /> Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ==================== VIEW: ACTIVE QUIZ ====================
  if (activeQuiz && !showResult) {
    const question = activeQuiz.questions[currentQIndex];
    const progress = ((currentQIndex + 1) / activeQuiz.questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="quiz-active-container">
        <div className="quiz-active-header">
          <div className="quiz-active-info">
            <h2>{activeQuiz.title}</h2>
            <span className="course-tag">{activeQuiz.courseName}</span>
          </div>
          <div className={`quiz-timer ${timeLeft < 60 ? 'urgent' : timeLeft < 300 ? 'warning' : ''}`}>
            <FaClockIcon />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button className="exit-btn" onClick={() => {
            if (window.confirm('Exit quiz? Progress will be lost!')) setActiveQuiz(null);
          }}>
            <FaTimes />
          </button>
        </div>

        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-text">
            Question {currentQIndex + 1} of {activeQuiz.questions.length} • {answeredCount} answered
          </div>
        </div>

        <div className="question-container">
          <div className="question-header">
            <span className="q-badge">Q{currentQIndex + 1}</span>
            <span className="marks-badge">{question.marks} marks</span>
          </div>
          
          <h3 className="question-title">{question.questionText}</h3>

          <div className="options-container">
            {question.options.map((opt, idx) => (
              <button
                key={`opt-${currentQIndex}-${idx}`}
                className={`option-btn ${answers[currentQIndex] === idx ? 'selected' : ''}`}
                onClick={() => selectAnswer(currentQIndex, idx)}
              >
                <span className="opt-letter-box">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text">{opt}</span>
                {answers[currentQIndex] === idx && <FaCheck className="check-icon" />}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            className="nav-btn"
            onClick={() => setCurrentQIndex(p => p - 1)}
            disabled={currentQIndex === 0}
          >
            <FaChevronLeft /> Previous
          </button>

          <div className="question-pills">
            {activeQuiz.questions.map((_, idx) => (
              <button
                key={`pill-${idx}`}
                className={`q-pill ${idx === currentQIndex ? 'active' : ''} ${answers[idx] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQIndex(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQIndex === activeQuiz.questions.length - 1 ? (
            <button 
              className="submit-btn"
              onClick={submitQuiz}
              disabled={isSubmitting}
            >
              {isSubmitting ? <FaSpinner className="spin" /> : <><FaFlag /> Finish</>}
            </button>
          ) : (
            <button 
              className="nav-btn primary"
              onClick={() => setCurrentQIndex(p => p + 1)}
            >
              Next <FaChevronRight />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==================== VIEW: QUIZ RESULT ====================
  if (showResult && quizResult) {
    const pct = parseFloat(quizResult.percentage);
    const grade = getGrade(pct);
    const passed = pct >= (activeQuiz?.passingMarks || 50);

    return (
      <div className="quiz-result-container">
        <div className={`result-card ${passed ? 'pass' : 'fail'}`}>
          <div className="result-icon" style={{ background: grade.bg, color: grade.color }}>
            {grade.icon}
          </div>
          
          <h2>{passed ? 'Congratulations!' : 'Quiz Completed'}</h2>
          <p className="result-subtitle">
            {passed 
              ? `You passed with ${grade.label} grade!` 
              : 'Keep practicing! You\'ll do better next time.'}
          </p>

          <div className="score-display">
            <div className="score-circle" style={{ 
              background: `conic-gradient(${passed ? '#10b981' : '#E13630'} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)` 
            }}>
              <div className="score-inner">
                <span className="score-percent">{pct}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
          </div>

          <div className="grade-badge" style={{ background: grade.bg, color: grade.color }}>
            Grade {grade.label}
          </div>

          <div className="result-stats">
            <div className="stat-box">
              <FaStar />
              <span className="stat-value">{quizResult.obtainedMarks}</span>
              <span className="stat-label">Marks</span>
            </div>
            <div className="stat-box">
              <FaBook />
              <span className="stat-value">{activeQuiz?.totalMarks}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-box">
              <FaClockIcon />
              <span className="stat-value">{formatTime(quizResult.timeTaken || 0)}</span>
              <span className="stat-label">Time</span>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn-primary" onClick={() => {
              const detailedResult = {
                ...quizResult,
                quizId: activeQuiz?._id,
                title: activeQuiz?.title,
                courseName: activeQuiz?.courseName,
                questions: activeQuiz?.questions,
                passingMarks: activeQuiz?.passingMarks,
                submittedAt: new Date().toISOString()
              };
              // Navigate to detailed result view
              setViewingDetailedResult(detailedResult);
              setDetailedQuizData(activeQuiz);
              setShowResult(false);
            }}>
              <FaEye /> View Detailed Report
            </button>
            <button className="btn-secondary" onClick={() => {
              setActiveQuiz(null);
              setShowResult(false);
              setActiveTab('completed');
            }}>
              All Results <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VIEW: MAIN LIST ====================
  return (
    <div className="quiz-container">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-circle">
            <FaBrain />
          </div>
          <div>
            <h1>Quiz Center</h1>
            <p>Challenge yourself, track progress, excel!</p>
          </div>
        </div>

        <div className="notification-wrapper" ref={notifRef}>
          <button 
            className="notification-btn"
            onClick={() => setShowNotifPanel(!showNotifPanel)}
          >
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifPanel && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                <div className="notification-actions">
                  <button onClick={() => setShowNotifPanel(false)} className="btn-close-mobile">
                    <FaTimes />
                  </button>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="btn-text">Mark all read</button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearNotifs} className="btn-text danger">Clear all</button>
                  )}
                </div>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <FaBellSlash />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <div 
                      key={`notif-${n.id}-${idx}`}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                    >
                      <div className={`notification-icon ${n.type}`}>
                        {n.type === 'new_quiz' ? <FaFire /> : 
                         n.type === 'reminder' ? <FaClockIcon /> : <FaTrophy />}
                      </div>
                      <div className="notification-content">
                        <h5>{n.title}</h5>
                        <p>{n.message}</p>
                        <span className="notification-time">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="notification-actions-inline">
                        {!n.read && <div className="unread-dot" />}
                        {n.type === 'new_quiz' && n.quizId && (
                          <button 
                            className="btn-view-notif"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToQuiz(n.quizId, n.courseName);
                            }}
                          >
                            <FaExternalLinkAlt /> View
                          </button>
                        )}
                        {n.type === 'graded' && n.quizId && (
                          <button 
                            className="btn-view-notif"
                            onClick={(e) => {
                              e.stopPropagation();
                              const result = results.find(r => r.quizId?.toString() === n.quizId?.toString());
                              if (result) {
                                viewResultDetails(result);
                                setShowNotifPanel(false);
                              }
                            }}
                          >
                            <FaEye /> View
                          </button>
                        )}
                        <button 
                          className="delete-notif-btn"
                          onClick={(e) => deleteNotif(e, n.id)}
                          title="Delete notification"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="header-stat-box">
          <div className="header-stat-icon stat-total">
            <FaQuestionCircle />
          </div>
          <div className="header-stat-info">
            <span className="header-stat-value">{stats.total}</span>
            <span className="header-stat-label">Total Quizzes</span>
          </div>
        </div>
        
        <div className="header-stat-box">
          <div className="header-stat-icon stat-pending">
            <FaHourglassHalf />
          </div>
          <div className="header-stat-info">
            <span className="header-stat-value">{stats.available}</span>
            <span className="header-stat-label">Available</span>
          </div>
        </div>
        
        <div className="header-stat-box">
          <div className="header-stat-icon stat-submitted">
            <FaCheckCircle />
          </div>
          <div className="header-stat-info">
            <span className="header-stat-value">{stats.completed}</span>
            <span className="header-stat-label">Completed</span>
          </div>
        </div>
        
        <div className="header-stat-box">
          <div className="header-stat-icon stat-graded">
            <FaTrophy />
          </div>
          <div className="header-stat-info">
            <span className="header-stat-value">{stats.passRate}%</span>
            <span className="header-stat-label">Pass Rate</span>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="filter-tabs">
          <button 
            className={activeTab === 'available' ? 'active' : ''}
            onClick={() => setActiveTab('available')}
          >
            Available ({stats.available})
          </button>
          <button 
            className={activeTab === 'completed' ? 'active' : ''}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({stats.completed})
          </button>
        </div>
        
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your quizzes...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <FaExclamationTriangle />
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={fetchData} className="btn-primary">
              <FaRedo /> Try Again
            </button>
          </div>
        ) : activeTab === 'available' ? (
          groupedQuizzes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>All Caught Up!</h3>
              <p>No quizzes available right now.</p>
              <button onClick={fetchData} className="btn-primary">
                <FaRedo /> Refresh
              </button>
            </div>
          ) : (
            <div className="course-grid">
              {groupedQuizzes.map((course, cIdx) => (
                <div 
                  key={`course-${course.courseName}-${cIdx}`}
                  className={`course-card ${expandedCourses[course.courseName] ? 'expanded' : ''}`}
                >
                  <div 
                    className="course-card-header"
                    onClick={() => toggleCourse(course.courseName)}
                  >
                    <div className="course-icon-wrapper">
                      <FaFolderOpen />
                    </div>
                    <div className="course-card-info">
                      <h3>{course.courseName}</h3>
                      <div className="course-stats-row">
                        <span className="stat-pill total">{course.quizzes.length} Quizzes</span>
                      </div>
                    </div>
                    <button className={`expand-btn ${expandedCourses[course.courseName] ? 'open' : ''}`}>
                      <FaChevronDown />
                    </button>
                  </div>

                  {expandedCourses[course.courseName] && (
                    <div className="course-quizzes-dropdown">
                      <div className="quizzes-grid">
                        {course.quizzes.map((quiz, qIdx) => (
                          <div key={`quiz-${quiz._id}-${qIdx}`} id={`quiz-${quiz._id}`} className="quiz-card">
                            <div className="quiz-card-header-info">
                              <h4 className="quiz-title">{quiz.title}</h4>
                              <span className="quiz-status-badge active">Active</span>
                            </div>
                            
                            <p className="quiz-description">{quiz.description || 'Test your knowledge with this interactive quiz'}</p>
                            
                            <div className="quiz-meta">
                              <span><FaQuestionCircle /> {quiz.questions?.length || 0} Qs</span>
                              <span><FaClockIcon /> {quiz.duration || 30}m</span>
                              <span><FaStar /> {quiz.totalMarks} marks</span>
                            </div>

                            <div className="quiz-footer">
                              <button 
                                className="btn-start"
                                onClick={() => startQuiz(quiz)}
                                disabled={isStarting}
                              >
                                {isStarting ? <FaSpinner className="spin" /> : <><FaPlay /> Start Quiz</>}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          groupedResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No Results Yet</h3>
              <p>Complete your first quiz to see results!</p>
              <button onClick={() => setActiveTab('available')} className="btn-primary">
                <FaPlay /> Take a Quiz
              </button>
            </div>
          ) : (
            <div className="course-grid results-course-grid">
              {groupedResults.map((course, cIdx) => (
                <div 
                  key={`result-course-${cIdx}`}
                  className={`course-card ${expandedCourses[course.courseName] ? 'expanded' : ''}`}
                >
                  <div 
                    className="course-card-header"
                    onClick={() => toggleCourse(course.courseName)}
                  >
                    <div className="course-icon-wrapper">
                      <FaFolderOpen />
                    </div>
                    <div className="course-card-info">
                      <h3>{course.courseName}</h3>
                      <div className="course-stats-row">
                        <span className="stat-pill total">{course.results.length} Results</span>
                      </div>
                    </div>
                    <button className={`expand-btn ${expandedCourses[course.courseName] ? 'open' : ''}`}>
                      <FaChevronDown />
                    </button>
                  </div>

                  {expandedCourses[course.courseName] && (
                    <div className="course-quizzes-dropdown">
                      <div className="results-grid">
                        {course.results.map((result, rIdx) => {
                          const pct = (result.obtainedMarks / result.totalMarks) * 100;
                          const grade = getGrade(pct);
                          const passed = pct >= (result.passingMarks || 50);

                          return (
                            <div key={`result-${result.quizId || rIdx}`} className="result-card-item">
                              <div className="result-card-header">
                                <h4>{result.title}</h4>
                                <span className="date">
                                  <FaCalendarAlt /> {new Date(result.submittedAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="result-card-body">
                                <div className="result-score-display">
                                  <div className="score-circle-small" style={{ 
                                    background: `conic-gradient(${passed ? '#10b981' : '#dc2626'} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)` 
                                  }}>
                                    <div className="score-inner-small">
                                      <span className="score-percent-small">{Math.round(pct)}%</span>
                                    </div>
                                  </div>
                                  <div className="score-text">
                                    <span className="marks">{result.obtainedMarks}/{result.totalMarks}</span>
                                    <span className="grade-badge-small" style={{ background: grade.bg, color: grade.color }}>
                                      {grade.label}
                                    </span>
                                  </div>
                                </div>

                                <div className={`result-status-badge ${passed ? 'pass' : 'fail'}`}>
                                  {passed ? <><FaCheckCircle /> Passed</> : <><FaTimesCircle /> Failed</>}
                                </div>
                              </div>

                              <div className="result-card-footer">
                                <button 
                                  className="btn-view"
                                  onClick={() => viewResultDetails(result)}
                                >
                                  <FaFileAlt /> View Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Quizzes;