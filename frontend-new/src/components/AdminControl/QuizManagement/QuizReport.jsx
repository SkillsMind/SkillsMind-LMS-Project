import React, { useState, useEffect } from 'react';
// 🔥 FIXED: Import path - ab sahi hai
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaDownload, FaEnvelope, FaCheckCircle, FaTimesCircle,
  FaUsers, FaChartBar, FaArrowLeft, FaSpinner, FaSearch
} from 'react-icons/fa';
import './QuizReport.css';

// 🔥 FIXED: Props accept karo - quizId aur onBack
const QuizReport = ({ quizId, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submitted');
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 FIXED: quizId check karo
  useEffect(() => {
    console.log('🔵 QuizReport mounted with quizId:', quizId);
    if (quizId) {
      fetchReport();
    } else {
      toast.error('No quiz selected');
      setLoading(false);
    }
  }, [quizId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      console.log('🔵 Fetching report for quizId:', quizId);
      
      const res = await adminAPI.getQuizReport(quizId);
      console.log('🔵 Report response:', res.data);
      
      if (res.data.success) {
        setReport(res.data);
      } else {
        toast.error('Failed to load report data');
      }
    } catch (err) {
      console.error('❌ Fetch report error:', err);
      toast.error(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (studentId, studentName) => {
    try {
      toast.loading('Generating PDF...');
      
      const response = await adminAPI.downloadResultPDF(quizId, studentId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_${studentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to download PDF');
      console.error(err);
    }
  };

  const sendEmail = async (studentId) => {
    try {
      const res = await adminAPI.sendResultEmail(quizId, studentId);
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  const filteredStudents = (students) => {
    if (!students) return [];
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 🔥 FIXED: Loading state
  if (loading) return (
    <div className="quiz-report-container">
      <div className="loading">
        <FaSpinner className="spin" /> Loading report...
      </div>
    </div>
  );
  
  // 🔥 FIXED: No report state
  if (!report) return (
    <div className="quiz-report-container">
      <div className="report-header">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Back to Quizzes
        </button>
      </div>
      <div className="no-report">
        <h2>No report found</h2>
        <p>Could not load quiz report. Please try again.</p>
      </div>
    </div>
  );

  return (
    <div className="quiz-report-container">
      {/* Header */}
      <div className="report-header">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Back to Quizzes
        </button>
        <h1><FaChartBar /> Quiz Report</h1>
      </div>

      {/* Quiz Info Card */}
      <div className="quiz-info-card">
        <h2>{report.quiz?.title || 'Quiz Title'}</h2>
        <p className="course-name">{report.quiz?.courseName || 'Course Name'}</p>
        <div className="quiz-meta">
          <span>Total Marks: {report.quiz?.totalMarks || 0}</span>
          <span>Passing: {report.quiz?.passingMarks || 50}%</span>
          <span>Duration: {report.quiz?.duration || 30} mins</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <FaUsers />
          <div>
            <h3>{report.stats?.totalEnrolled || 0}</h3>
            <p>Total Enrolled</p>
          </div>
        </div>
        
        <div className="stat-card green">
          <FaCheckCircle />
          <div>
            <h3>{report.stats?.totalSubmitted || 0}</h3>
            <p>Submitted</p>
          </div>
        </div>
        
        <div className="stat-card red">
          <FaTimesCircle />
          <div>
            <h3>{report.stats?.totalNotSubmitted || 0}</h3>
            <p>Not Submitted</p>
          </div>
        </div>
        
        <div className="stat-card purple">
          <FaChartBar />
          <div>
            <h3>{report.stats?.submissionRate || 0}%</h3>
            <p>Submission Rate</p>
          </div>
        </div>
        
        <div className="stat-card orange">
          <FaChartBar />
          <div>
            <h3>{report.stats?.averageScore || 0}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card teal">
          <div>
            <h3>{report.stats?.passCount || 0} / {report.stats?.failCount || 0}</h3>
            <p>Passed / Failed</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <FaSearch />
        <input 
          type="text" 
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'submitted' ? 'active' : ''}
          onClick={() => setActiveTab('submitted')}
        >
          Submitted ({report.submittedStudents?.length || 0})
        </button>
        <button 
          className={activeTab === 'notSubmitted' ? 'active' : ''}
          onClick={() => setActiveTab('notSubmitted')}
        >
          Not Submitted ({report.notSubmittedStudents?.length || 0})
        </button>
      </div>

      {/* Students Table */}
      <div className="students-table-container">
        {activeTab === 'submitted' ? (
          <table className="students-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents(report.submittedStudents).length > 0 ? (
                filteredStudents(report.submittedStudents).map((student, idx) => (
                  <tr key={student.studentId}>
                    <td className="rank">{idx + 1}</td>
                    <td>
                      <div className="student-info">
                        <img src={student.profilePic || '/default-avatar.png'} alt="" />
                        <div>
                          <strong>{student.name}</strong>
                          <small>{student.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{student.obtainedMarks}/{student.totalMarks}</td>
                    <td>
                      <div className="percentage-bar">
                        <div 
                          className="fill" 
                          style={{width: `${student.percentage}%`, background: student.isPassed ? '#4CAF50' : '#f44336'}}
                        />
                        <span>{student.percentage?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${student.isPassed ? 'passed' : 'failed'}`}>
                        {student.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-download"
                        onClick={() => downloadPDF(student.studentId, student.name)}
                        title="Download PDF"
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="btn-email"
                        onClick={() => sendEmail(student.studentId)}
                        title="Send Email"
                      >
                        <FaEnvelope />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>
                    No students have submitted yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents(report.notSubmittedStudents).length > 0 ? (
                filteredStudents(report.notSubmittedStudents).map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <div className="student-info">
                        <img src={student.profilePic || '/default-avatar.png'} alt="" />
                        <div>
                          <strong>{student.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>
                      <span className="status-badge pending">Not Submitted</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{textAlign: 'center', padding: '30px'}}>
                    All students have submitted
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default QuizReport;