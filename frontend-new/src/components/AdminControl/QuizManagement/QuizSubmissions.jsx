import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, FaUserGraduate, FaClock, FaCheckCircle,
  FaTimesCircle, FaPercentage, FaDownload, FaSpinner,
  FaSearch, FaFilter, FaEye, FaChartBar, FaTrophy, FaFilePdf
} from 'react-icons/fa';
import './QuizManager.css';
import { adminAPI } from '../../../services/api';

const QuizSubmissions = ({ quiz, onBack, onRefresh }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  useEffect(() => {
    fetchSubmissions();
  }, [quiz._id]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getQuizSubmissions(quiz._id);
      
      if (res.data.success) {
        setSubmissions(res.data.submissions || []);
      }
    } catch (err) {
      toast.error('Failed to load submissions', { style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const downloadBulkPDF = async () => {
    try {
      setDownloadingBulk(true);
      
      // Note: adminAPI mein bulk download ka method nahi hai, isliye direct axios use kar rahe hain
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminToken');
      const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
      
      const response = await axios.get(`${API_BASE}/quizzes/${quiz._id}/bulk-results-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quiz.title.replace(/\s+/g, '_')}_Complete_Results.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Complete results PDF downloaded successfully!', { style: toastStyle });
    } catch (err) {
      console.error('Bulk download error:', err);
      toast.error(err.response?.data?.error || 'Failed to download bulk PDF', { style: toastStyle });
    } finally {
      setDownloadingBulk(false);
    }
  };

  // Rest of the component remains the same (calculateStats, getGrade, filteredSubmissions, etc.)
  const calculateStats = () => {
    if (submissions.length === 0) return { avg: 0, highest: 0, lowest: 0, passed: 0 };
    
    const marks = submissions.map(s => (s.obtainedMarks / quiz.totalMarks) * 100);
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const passed = marks.filter(m => m >= (quiz.passingMarks || 50)).length;
    
    return {
      avg: avg.toFixed(1),
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      passed
    };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { label: 'A+', color: '#16a34a' };
    if (percentage >= 80) return { label: 'A', color: '#22c55e' };
    if (percentage >= 70) return { label: 'B', color: '#3b82f6' };
    if (percentage >= 60) return { label: 'C', color: '#f59e0b' };
    if (percentage >= 50) return { label: 'D', color: '#f97316' };
    return { label: 'F', color: '#dc2626' };
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const percentage = (sub.obtainedMarks / quiz.totalMarks) * 100;
    const passed = percentage >= (quiz.passingMarks || 50);
    
    if (filterStatus === 'passed') return matchesSearch && passed;
    if (filterStatus === 'failed') return matchesSearch && !passed;
    
    return matchesSearch;
  });

  const stats = calculateStats();

  // Rest of the component (JSX) remains exactly the same
  // ... (keeping the same JSX structure)
  
  if (selectedSubmission) {
    return (
      <SubmissionDetail 
        submission={selectedSubmission}
        quiz={quiz}
        onBack={() => setSelectedSubmission(null)}
      />
    );
  }

  return (
    <div className="submissions-view">
      <div className="submissions-header">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Back to Quizzes
        </button>
        
        <div className="submissions-title">
          <h2><FaChartBar /> Quiz Results</h2>
          <div className="assignment-subtitle">
            <span className="assignment-number">
              <FaCheckCircle /> {quiz.title}
            </span>
            <span className="course-name">{quiz.courseName}</span>
          </div>
        </div>
      </div>

      <div className="stats-dashboard" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
            <FaUserGraduate />
          </div>
          <div className="stat-info">
            <span className="stat-value">{submissions.length}</span>
            <span className="stat-label">Total Attempts</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <FaPercentage />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.avg}%</span>
            <span className="stat-label">Average Score</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <FaTrophy />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.highest}%</span>
            <span className="stat-label">Highest Score</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.passed}</span>
            <span className="stat-label">Passed</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select">
          <FaFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Students</option>
            <option value="passed">Passed Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={fetchSubmissions}>
          <FaSpinner className={loading ? 'spin' : ''} /> Refresh
        </button>

        <button 
          className="btn-bulk-download" 
          onClick={downloadBulkPDF}
          disabled={downloadingBulk || submissions.length === 0}
        >
          {downloadingBulk ? <FaSpinner className="spin" /> : <FaFilePdf />}
          {downloadingBulk ? 'Generating PDF...' : 'Download All Results PDF'}
        </button>
      </div>

      <div className="submissions-table-container">
        {loading ? (
          <div className="loading-cell">
            <FaSpinner className="spin" /> Loading submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-state-large">
            <FaUserGraduate size={64} />
            <h3>No submissions yet</h3>
            <p>Students haven't attempted this quiz</p>
          </div>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub) => {
                const percentage = ((sub.obtainedMarks / quiz.totalMarks) * 100).toFixed(1);
                const grade = getGrade(parseFloat(percentage));
                const passed = parseFloat(percentage) >= (quiz.passingMarks || 50);
                
                return (
                  <tr key={sub._id}>
                    <td>
                      <div className="student-cell-compact">
                        <div className="student-avatar-small">
                          {sub.studentId?.profilePic ? (
                            <img src={sub.studentId.profilePic} alt={sub.studentId.name} />
                          ) : (
                            <span>{sub.studentId?.name?.charAt(0) || 'S'}</span>
                          )}
                        </div>
                        <div className="student-info-compact">
                          <span className="student-name-compact">{sub.studentId?.name || 'Unknown'}</span>
                          <span className="student-email-compact">{sub.studentId?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="course-cell">{quiz.courseName}</td>
                    <td className="score-cell">
                      <span className="score-text">{sub.obtainedMarks}/{quiz.totalMarks}</span>
                    </td>
                    <td className="percentage-cell">
                      <span style={{ color: grade.color, fontWeight: 600 }}>
                        {percentage}%
                      </span>
                    </td>
                    <td>
                      <span className="grade-badge" style={{ background: grade.color, color: 'white' }}>
                        {grade.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${passed ? 'passed' : 'failed'}`}>
                        {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td>
                      <button 
                        className="btn-view-table"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// SubmissionDetail component remains exactly the same
const SubmissionDetail = ({ submission, quiz, onBack }) => {
  return (
    <div className="submission-detail">
      <button className="btn-back" onClick={onBack}>
        <FaArrowLeft /> Back to Results
      </button>

      <div className="detail-header">
        <h2>{submission.studentId?.name}'s Result</h2>
        <div className="result-summary">
          <div className="score-circle">
            <span className="score-number">{submission.obtainedMarks}</span>
            <span className="score-total">/{quiz.totalMarks}</span>
          </div>
          <div className="percentage">
            {((submission.obtainedMarks / quiz.totalMarks) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="answers-review">
        <h3>Answer Review</h3>
        {submission.answers?.map((answer, idx) => {
          const question = quiz.questions[idx];
          const isCorrect = answer.selectedOption === question.correctOption;
          
          return (
            <div key={idx} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="question-header-review">
                <span className="q-number">Q{idx + 1}</span>
                <span className="q-marks">{isCorrect ? question.marks : 0}/{question.marks} marks</span>
                {isCorrect ? <FaCheckCircle className="status-icon correct" /> : <FaTimesCircle className="status-icon wrong" />}
              </div>
              
              <p className="question-text-review">{question.questionText}</p>
              
              <div className="options-review">
                {question.options.map((opt, optIdx) => (
                  <div 
                    key={optIdx} 
                    className={`option-review ${
                      optIdx === question.correctOption ? 'correct-answer' : ''
                    } ${
                      optIdx === answer.selectedOption && optIdx !== question.correctOption ? 'wrong-answer' : ''
                    } ${
                      optIdx === answer.selectedOption ? 'selected' : ''
                    }`}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                    <span className="opt-text">{opt}</span>
                    {optIdx === question.correctOption && <FaCheckCircle className="correct-mark" />}
                    {optIdx === answer.selectedOption && optIdx !== question.correctOption && <FaTimesCircle className="wrong-mark" />}
                  </div>
                ))}
              </div>
              
              {question.explanation && (
                <div className="explanation-review">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizSubmissions;