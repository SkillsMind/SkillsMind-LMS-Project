import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('authToken') || 
                    localStorage.getItem('adminToken');
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
      {/* Header */}
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

      {/* Stats Cards */}
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

      {/* Filters */}
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

      <style jsx>{`
        .submissions-view {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .submissions-header {
          margin-bottom: 24px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 11, 41, 0.08);
        }
        
        .submissions-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 11, 41, 0.08);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        
        .submissions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .submissions-table thead {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .submissions-table th {
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        
        .submissions-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        .submissions-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .submissions-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .student-cell-compact {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        
        .student-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #000B29;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .student-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .student-info-compact {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        
        .student-name-compact {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .student-email-compact {
          color: #64748b;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .course-cell {
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .score-cell {
          font-weight: 600;
          white-space: nowrap;
        }
        
        .score-text {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
        }
        
        .percentage-cell {
          font-weight: 600;
          white-space: nowrap;
        }
        
        .grade-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-block;
          white-space: nowrap;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .status-badge.passed {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .status-badge.failed {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .date-cell {
          color: #64748b;
          font-size: 13px;
          white-space: nowrap;
        }
        
        .btn-view-table {
          padding: 8px 14px;
          background: #000B29;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .btn-view-table:hover {
          background: #E30613;
          transform: translateY(-1px);
        }

        .btn-bulk-download {
          padding: 10px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          margin-left: 10px;
        }

        .btn-bulk-download:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-2px);
        }

        .btn-bulk-download:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 1100px) {
          .submissions-table {
            font-size: 13px;
          }
          
          .submissions-table th,
          .submissions-table td {
            padding: 12px 8px;
          }
          
          .student-email-compact {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// Submission Detail Component
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

      <style jsx>{`
        .submission-detail {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .detail-header {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 11, 41, 0.08);
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-header h2 {
          margin: 0;
          color: #000B29;
        }
        
        .result-summary {
          text-align: center;
        }
        
        .score-circle {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        
        .score-number {
          font-size: 48px;
          font-weight: 800;
          color: #000B29;
        }
        
        .score-total {
          font-size: 24px;
          color: #6b7280;
        }
        
        .percentage {
          font-size: 20px;
          font-weight: 700;
          color: #16a34a;
        }
        
        .answers-review {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 11, 41, 0.08);
        }
        
        .answers-review h3 {
          margin: 0 0 20px 0;
          color: #000B29;
        }
        
        .answer-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        .answer-item.correct {
          border-color: #16a34a;
          background: #f0fdf4;
        }
        
        .answer-item.incorrect {
          border-color: #dc2626;
          background: #fef2f2;
        }
        
        .question-header-review {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .q-number {
          background: #000B29;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }
        
        .q-marks {
          margin-left: auto;
          font-weight: 600;
          color: #6b7280;
        }
        
        .status-icon {
          font-size: 20px;
        }
        
        .status-icon.correct {
          color: #16a34a;
        }
        
        .status-icon.wrong {
          color: #dc2626;
        }
        
        .question-text-review {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 15px;
          line-height: 1.5;
        }
        
        .options-review {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .option-review {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          border: 2px solid transparent;
        }
        
        .option-review.correct-answer {
          background: #dcfce7;
          border-color: #16a34a;
        }
        
        .option-review.wrong-answer {
          background: #fee2e2;
          border-color: #dc2626;
        }
        
        .option-review.selected {
          font-weight: 600;
        }
        
        .opt-letter {
          width: 28px;
          height: 28px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .option-review.correct-answer .opt-letter {
          background: #16a34a;
          color: white;
        }
        
        .option-review.wrong-answer .opt-letter {
          background: #dc2626;
          color: white;
        }
        
        .correct-mark {
          color: #16a34a;
          margin-left: auto;
        }
        
        .wrong-mark {
          color: #dc2626;
          margin-left: auto;
        }
        
        .explanation-review {
          margin-top: 16px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 6px;
          font-size: 13px;
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

export default QuizSubmissions;