import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FaArrowLeft, FaUsers, FaFileAlt, FaDownload, 
  FaStar, FaClock, FaCheckCircle, FaTimes, 
  FaEdit, FaCheck, FaFilePdf, FaFileWord, 
  FaFileArchive, FaInbox, FaSpinner, FaFileExcel,
  FaUser, FaGraduationCap, FaCalendar, FaEnvelope,
  FaPhone, FaList, FaChevronDown, FaChevronUp,
  FaHashtag, FaBook, FaRobot, FaBrain, FaMagic,
  FaExternalLinkAlt, FaExclamationTriangle,
  FaSync, FaChartPie, FaHistory, FaComment,
  FaEye, FaSearch
} from 'react-icons/fa';
import './SubmissionsView.css';

const SubmissionsView = ({ assignmentId, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // 🔥 AI GRADING STATES (ENHANCED)
  const [aiGrading, setAiGrading] = useState(false);
  const [aiBatchGrading, setAiBatchGrading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAIResult, setShowAIResult] = useState(false);
  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });

  // 🔥 NEW: AI Progress Dropdown State
  const [aiProgressExpanded, setAiProgressExpanded] = useState(false);
  
  // 🔥 NEW: Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
  const token = localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('adminToken');

  useEffect(() => {
    fetchSubmissions();
    fetchAIStatus();
    
    // Auto-refresh AI status every 10 seconds if batch grading is active
    const interval = setInterval(() => {
      if (aiBatchGrading) {
        fetchAIStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/assignments/${assignmentId}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setSubmissions(res.data.submissions || []);
        setAssignment(res.data.assignment);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH AI GRADING STATUS
  const fetchAIStatus = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/ai-grading/status/${assignmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setAiStatus(res.data.stats);
      }
    } catch (err) {
      console.log('AI status fetch error:', err);
    }
  };

  const openGradeModal = (submission) => {
    setGradingSubmission(submission);
    setGradeMarks(submission.obtainedMarks || '');
    setGradeFeedback(submission.feedback || '');
    setShowAIResult(false);
    setAiResult(null);
  };

  const closeGradeModal = () => {
    setGradingSubmission(null);
    setGradeMarks('');
    setGradeFeedback('');
    setShowAIResult(false);
    setAiResult(null);
  };

  const handleGradeSubmit = async () => {
    if (!gradeMarks || gradeMarks < 0 || gradeMarks > assignment.totalMarks) {
      toast.error(`Please enter valid marks (0-${assignment.totalMarks})`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/assignments/${assignmentId}/grade`,
        { 
          submissionId: gradingSubmission._id, 
          marks: parseInt(gradeMarks), 
          feedback: gradeFeedback 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Graded successfully!');
      closeGradeModal();
      fetchSubmissions();
      fetchAIStatus();
    } catch (err) {
      console.error('Grade error:', err);
      toast.error(err.response?.data?.error || 'Failed to grade');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 AI GRADE SINGLE SUBMISSION (FIXED URL)
  const handleAIGrade = async (submission) => {
    setAiGrading(true);
    setGradingSubmission(submission);
    
    const loadId = toast.loading('🤖 AI is reading and analyzing submission...', {
      duration: 60000
    });
    
    try {
      // ✅ FIXED: Correct API endpoint
      const res = await axios.post(
        `${API_BASE}/ai-grading/grade/${submission._id}`,
        { 
          manualReview: false, 
          overrideMarks: null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setAiResult(res.data.grading);
        setShowAIResult(true);
        toast.success(
          `✅ AI Graded: ${res.data.grading.marks}/${assignment?.totalMarks} (${res.data.grading.grade})`, 
          { id: loadId }
        );
        fetchSubmissions();
        fetchAIStatus();
      } else {
        throw new Error(res.data.message || 'AI grading failed');
      }
    } catch (err) {
      console.error('AI Grade error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
        setApiQuotaExceeded(true);
        toast.error('⚠️ AI API quota exceeded. Please grade manually.', { id: loadId });
      } else if (err.response?.data?.requiresManualReview) {
        toast.error(`⚠️ ${errorMsg}. Please grade manually.`, { id: loadId });
        openGradeModal(submission);
      } else {
        toast.error(`❌ ${errorMsg}`, { id: loadId });
      }
    } finally {
      setAiGrading(false);
    }
  };

  // 🔥 AI BATCH GRADE ALL PENDING (FIXED - Removed infinite loop)
  const handleAIBatchGrade = async () => {
    const ungraded = submissions.filter(s => s.status !== 'graded');
    
    if (ungraded.length === 0) {
      toast.info('No ungraded submissions found!');
      return;
    }

    if (!window.confirm(`🤖 Grade ${ungraded.length} submissions with AI?\n\nThis may take a few minutes.`)) {
      return;
    }

    setAiBatchGrading(true);
    setBatchProgress({ current: 0, total: ungraded.length, message: 'Starting...' });
    
    const loadId = toast.loading(`🤖 Starting batch grading of ${ungraded.length} submissions...`);

    try {
      // ✅ FIXED: Correct API endpoint
      const res = await axios.post(
        `${API_BASE}/ai-grading/batch-grade/${assignmentId}`,
        { delayBetweenRequests: 3000 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success(res.data.message, { id: loadId });
        
        if (res.data.failed > 0) {
          toast.error(`${res.data.failed} submissions failed to grade. Check console for details.`, { duration: 5000 });
        }
        
        fetchSubmissions();
        fetchAIStatus();
      } else {
        throw new Error(res.data.error || 'Batch grading failed');
      }
    } catch (err) {
      console.error('Batch grade error:', err);
      const errorMsg = err.response?.data?.error || err.message;
      
      if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        setApiQuotaExceeded(true);
        toast.error('⚠️ AI API quota exceeded. Please grade manually.', { id: loadId });
      } else {
        toast.error(`❌ ${errorMsg}`, { id: loadId });
      }
    } finally {
      setAiBatchGrading(false);
      setBatchProgress({ current: 0, total: 0, message: '' });
    }
  };

  // 🔥 MANUAL OVERRIDE AI GRADE (FIXED URL)
  const handleOverrideGrade = async () => {
    if (!gradeMarks || gradeMarks < 0 || gradeMarks > assignment.totalMarks) {
      toast.error(`Please enter valid marks (0-${assignment.totalMarks})`);
      return;
    }

    setSubmitting(true);
    try {
      // ✅ FIXED: Correct API endpoint
      await axios.put(
        `${API_BASE}/ai-grading/override/${gradingSubmission._id}`,
        { 
          marks: parseInt(gradeMarks), 
          feedback: gradeFeedback,
          reason: 'Manual override after AI grading'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('✅ Grade overridden successfully!');
      closeGradeModal();
      fetchSubmissions();
      fetchAIStatus();
    } catch (err) {
      console.error('Override error:', err);
      toast.error(err.response?.data?.error || 'Failed to update grade');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 RE-GRADE SUBMISSION (FIXED URL)
  const handleRegrade = async (submission) => {
    if (!window.confirm('🔄 Re-grade this submission with AI?\n\nThis will re-analyze the submission and may produce different results.')) {
      return;
    }

    setAiGrading(true);
    const loadId = toast.loading('🔄 Re-grading submission...');

    try {
      // ✅ FIXED: Correct API endpoint
      const res = await axios.post(
        `${API_BASE}/ai-grading/regrade/${submission._id}`,
        { instructions: 'Please re-evaluate carefully' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`✅ Re-graded: ${res.data.grading.marks}/${assignment?.totalMarks}`, { id: loadId });
        fetchSubmissions();
        fetchAIStatus();
      } else {
        throw new Error(res.data.error || 'Re-grading failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Re-grading failed', { id: loadId });
    } finally {
      setAiGrading(false);
    }
  };

  // 🔥 TEST API FUNCTION (FIXED URL)
  const handleTestAPI = async () => {
    const loadId = toast.loading('🧪 Testing Gemini API...');
    
    try {
      // ✅ FIXED: Correct API endpoint
      const res = await axios.get(
        `${API_BASE}/ai-grading/test`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        setApiQuotaExceeded(false);
        toast.success(
          <div>
            <strong>✅ API Working!</strong>
            <br />Model: {res.data.model}
            <br />PDF Support: {res.data.pdfSupport ? 'Yes' : 'No'}
          </div>, 
          { id: loadId, duration: 5000 }
        );
      } else {
        throw new Error(res.data.error || 'API test failed');
      }
    } catch (err) {
      console.error('API Test error:', err);
      const errorMsg = err.response?.data?.error || 'API test failed';
      
      if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        setApiQuotaExceeded(true);
        toast.error('⚠️ API Quota Exceeded', { id: loadId });
      } else {
        toast.error(`❌ ${errorMsg}`, { id: loadId });
      }
    }
  };

  const downloadSubmissionsList = () => {
    if (!submissions.length) {
      toast.error('No submissions to download');
      return;
    }

    const rows = [];
    rows.push([
      'Student Name', 'Email', 'Submission Date', 'Status',
      'Obtained Marks', 'Total Marks', 'Grade Percentage',
      'Feedback', 'Files Count', 'Student Comments', 'AI Graded', 'AI Confidence'
    ]);
    
    submissions.forEach(sub => {
      const percentage = sub.obtainedMarks && assignment?.totalMarks 
        ? ((sub.obtainedMarks / assignment.totalMarks) * 100).toFixed(1) + '%'
        : 'N/A';
        
      rows.push([
        sub.student?.name || 'Unknown',
        sub.student?.email || 'N/A',
        new Date(sub.submittedAt).toLocaleString(),
        sub.status,
        sub.obtainedMarks || 'Not Graded',
        assignment?.totalMarks || 'N/A',
        percentage,
        sub.feedback || 'No feedback',
        sub.files?.length || 0,
        sub.comments || 'No comments',
        sub.aiGraded ? 'Yes' : 'No',
        sub.aiConfidence ? `${sub.aiConfidence}%` : 'N/A'
      ]);
    });

    const csvContent = rows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${assignment?.title || 'Assignment'}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Excel Download started!');
  };

  const downloadSubmissionsPDF = async () => {
    if (!submissions.length) {
      toast.error('No submissions to download');
      return;
    }

    setGeneratingPDF(true);
    toast.loading('Generating PDF... Please wait');

    try {
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '1123px';
      pdfContainer.style.background = '#ffffff';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

      const gradedCount = submissions.filter(s => s.status === 'graded').length;
      const pendingCount = submissions.filter(s => s.status === 'submitted').length;
      const aiGradedCount = submissions.filter(s => s.aiGraded).length;
      const averageMarks = submissions.filter(s => s.status === 'graded').length > 0 
        ? (submissions.reduce((acc, s) => acc + (s.obtainedMarks || 0), 0) / submissions.filter(s => s.status === 'graded').length).toFixed(1)
        : '0.0';
      const highestScore = Math.max(...submissions.map(s => s.obtainedMarks || 0), 0);

      const tableRows = submissions.map((sub, index) => {
        const percentage = sub.obtainedMarks && assignment?.totalMarks 
          ? ((sub.obtainedMarks / assignment.totalMarks) * 100).toFixed(1)
          : 0;
        
        const statusColors = {
          graded: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
          submitted: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
          pending: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
        };
        
        const statusStyle = statusColors[sub.status] || statusColors.pending;
        
        return `
          <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #000B29;">${index + 1}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">
              <div style="font-weight: 700; color: #000B29; font-size: 12px;">${sub.student?.name || 'Unknown'}</div>
              <div style="font-size: 10px; color: #666;">${sub.student?.email || 'N/A'}</div>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #333;">
              ${new Date(sub.submittedAt).toLocaleDateString()}<br>
              <small style="color: #999;">${new Date(sub.submittedAt).toLocaleTimeString()}</small>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${statusStyle.bg}; color: ${statusStyle.text}; border: 1px solid ${statusStyle.border};">
                ${sub.status}
              </span>
              ${sub.aiGraded ? '<span style="display: inline-block; margin-left: 5px; padding: 2px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; background: #667eea; color: white;">AI</span>' : ''}
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-weight: 700; color: ${sub.status === 'graded' ? '#000B29' : '#999'}; font-size: 13px;">
              ${sub.status === 'graded' ? `${sub.obtainedMarks}/${assignment?.totalMarks}<br><span style="font-size: 10px; color: #666; font-weight: 600;">${percentage}%</span>` : 'Pending'}
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; color: #555; font-style: italic; max-width: 150px;">
              ${sub.feedback || 'No feedback provided'}
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #000B29;">
              ${sub.files?.length || 0} files
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; color: #666; max-width: 120px;">
              ${sub.comments || 'No comments'}
            </td>
          </tr>
        `;
      }).join('');

      const assignmentDisplayNo = assignment?.courseAssignmentNo 
        ? `Assignment ${assignment.courseAssignmentNo}` 
        : assignment?.assignmentNo || 'N/A';

      pdfContainer.innerHTML = `
        <div style="width: 100%; color: #000B29;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #000B29; padding-bottom: 20px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 70px; height: 70px; background: #000B29; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border-radius: 8px;">
                S
              </div>
              <div>
                <div style="font-size: 28px; font-weight: 800; color: #000B29; letter-spacing: -0.5px;">SkillsMind</div>
                <div style="font-size: 11px; color: #E30613; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Assignment Report</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 700; color: #000B29; margin-bottom: 5px;">${assignment?.title || 'Assignment Submissions'}</div>
              <div style="font-size: 11px; color: #666;">Generated: ${currentDate}</div>
              <div style="font-size: 10px; color: #E30613; font-weight: 600; margin-top: 3px;">ID: ${assignmentDisplayNo}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #000B29 0%, #001a4d 100%); border-radius: 8px; padding: 20px; margin-bottom: 25px; color: white;">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #E30613; color: white;">
              📋 ${assignment?.title || 'Assignment Details'}
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
              <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Course</div>
                <div style="font-size: 14px; font-weight: 700; color: #fff;">${assignment?.courseName || 'N/A'}</div>
              </div>
              <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Total Marks</div>
                <div style="font-size: 16px; font-weight: 700; color: #E30613;">${assignment?.totalMarks || 'N/A'}</div>
              </div>
              <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Submissions</div>
                <div style="font-size: 16px; font-weight: 700; color: #fff;">${submissions.length}</div>
              </div>
              <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Graded</div>
                <div style="font-size: 16px; font-weight: 700; color: #fff;">${gradedCount}</div>
              </div>
              <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">AI Graded</div>
                <div style="font-size: 16px; font-weight: 700; color: #fff;">${aiGradedCount}</div>
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 20px; margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #E30613;">
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #000B29;">${gradedCount}</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Graded</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #000B29;">${pendingCount}</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Pending Review</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #000B29;">${averageMarks}</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Average Marks</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #000B29;">${highestScore}</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Highest Score</div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <div style="font-size: 16px; font-weight: 700; color: #000B29; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 2px solid #E30613;">
              👥 Student Submissions Record
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px;">
              <thead style="background: #000B29; color: #fff;">
                <tr>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">#</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Student Info</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Submission Date</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Status</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Marks</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Feedback</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Files</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 3px solid #E30613;">Comments</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #000B29; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #666;">
            <div style="font-weight: 700; color: #000B29; display: flex; align-items: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #000B29; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border-radius: 4px;">S</span>
              © 2025 SkillsMind. All rights reserved.
            </div>
            <div>Confidential Academic Record</div>
            <div style="color: #E30613; font-weight: 600;">Page 1 of 1</div>
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `${assignmentDisplayNo}_${assignment?.title || 'Submissions'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.dismiss();
      toast.success('PDF Downloaded Successfully!');
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.pdf$/i)) return <FaFilePdf className="file-icon pdf" />;
    if (filename.match(/\.(doc|docx)$/i)) return <FaFileWord className="file-icon word" />;
    if (filename.match(/\.(zip|rar)$/i)) return <FaFileArchive className="file-icon archive" />;
    return <FaFileAlt className="file-icon" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Direct download function for files
  const handleFileDownload = (file) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_URL}${file.url}`;
    link.download = file.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${file.filename}...`);
  };

  // 🔥 FILTER SUBMISSIONS
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="submissions-view">
        <div className="loading-center">
          <FaSpinner className="spin" /> Loading submissions...
        </div>
      </div>
    );
  }

  const ungradedCount = submissions.filter(s => s.status !== 'graded').length;

  return (
    <div className="submissions-view">
      {/* Header */}
      <div className="submissions-header">
        <button className="btn-back" onClick={onClose}>
          <FaArrowLeft /> Back to Assignments
        </button>
        <div className="submissions-title">
          <h2><FaUsers /> Assignment Submissions</h2>
          {assignment && (
            <div className="assignment-subtitle">
              <span className="assignment-number">
                <FaHashtag /> 
                {assignment.courseAssignmentNo 
                  ? `Assignment ${assignment.courseAssignmentNo}` 
                  : assignment.assignmentNo}
              </span>
              <span className="assignment-name"><FaBook /> {assignment.title}</span>
              <span className="course-name">({assignment.courseName})</span>
            </div>
          )}
        </div>
        {/* 🔥 TEST API BUTTON */}
        <button 
          className="btn-test-api" 
          onClick={handleTestAPI}
          title="Test if Gemini API is working"
        >
          <FaRobot /> Test API
        </button>
      </div>

      {/* API Quota Warning */}
      {apiQuotaExceeded && (
        <div className="api-warning-banner">
          <FaExclamationTriangle />
          <span>
            <strong>AI API Quota Exceeded:</strong> AI grading is temporarily unavailable. 
            Please use manual grading or try again later.
          </span>
          <button onClick={() => setApiQuotaExceeded(false)}>Dismiss</button>
        </div>
      )}

      {/* 🔥 AI STATUS DASHBOARD - COLLAPSIBLE */}
      {aiStatus && (
        <div className="ai-status-dashboard-collapsible">
          <div 
            className="ai-status-header"
            onClick={() => setAiProgressExpanded(!aiProgressExpanded)}
          >
            <div className="status-title">
              <FaChartPie /> AI Grading Progress
              <span className="status-summary">
                {aiStatus.graded}/{aiStatus.total} graded ({aiStatus.progress}%)
              </span>
            </div>
            <div className={`expand-icon ${aiProgressExpanded ? 'expanded' : ''}`}>
              {aiProgressExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          
          {aiProgressExpanded && (
            <div className="ai-status-content">
              <div className="status-stats">
                <div className="stat-item">
                  <span className="stat-value">{aiStatus.progress}%</span>
                  <span className="stat-label">Complete</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{aiStatus.graded}/{aiStatus.total}</span>
                  <span className="stat-label">Graded</span>
                </div>
                <div className="stat-item ai">
                  <span className="stat-value">{aiStatus.aiGraded}</span>
                  <span className="stat-label">AI Graded</span>
                </div>
                <div className="stat-item pending">
                  <span className="stat-value">{aiStatus.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${aiStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔥 BATCH GRADING PROGRESS */}
      {aiBatchGrading && (
        <div className="batch-progress-banner">
          <FaSpinner className="spin" />
          <div className="progress-info">
            <span>🤖 Batch Grading in Progress...</span>
            <span className="progress-count">
              {batchProgress.current} / {batchProgress.total}
            </span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill animated" 
              style={{ 
                width: `${batchProgress.total > 0 
                  ? (batchProgress.current / batchProgress.total) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Summary Card */}
      {assignment && (
        <div className="summary-card">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Course</span>
              <span className="value">{assignment.courseName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Marks</span>
              <span className="value">{assignment.totalMarks}</span>
            </div>
            <div className="summary-item">
              <span className="label">Submissions</span>
              <span className="value highlight">{submissions.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Graded</span>
              <span className="value success">
                {submissions.filter(s => s.status === 'graded').length}
              </span>
            </div>
          </div>
          
          {/* Download Buttons + AI Batch Grade */}
          <div className="action-buttons-container">
            <div className="download-section">
              <button className="btn-action btn-excel" onClick={downloadSubmissionsList}>
                <FaFileExcel className="btn-icon" />
                <span>Excel</span>
              </button>
              <button 
                className="btn-action btn-pdf" 
                onClick={downloadSubmissionsPDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? <FaSpinner className="btn-icon spin" /> : <FaFilePdf className="btn-icon" />}
                <span>{generatingPDF ? 'Generating...' : 'PDF'}</span>
              </button>
            </div>
            
            <div className="ai-section">
              <button 
                className="btn-action btn-ai-batch"
                onClick={handleAIBatchGrade}
                disabled={aiBatchGrading || ungradedCount === 0 || apiQuotaExceeded}
                title={apiQuotaExceeded ? "API quota exceeded - use manual grading" : "Auto-grade all submissions"}
              >
                {aiBatchGrading ? <FaSpinner className="btn-icon spin" /> : <FaRobot className="btn-icon" />}
                <span>
                  {aiBatchGrading ? 'AI Grading...' : `AI Grade All (${ungradedCount})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 SEARCH AND FILTER BAR */}
      <div className="table-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="graded">Graded</option>
            <option value="submitted">Pending</option>
          </select>
        </div>
      </div>

      {/* 🔥 SUBMISSIONS TABLE */}
      <div className="submissions-table-wrapper">
        <div className="submissions-table-container">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <FaInbox size={48} />
              <h3>No Submissions Found</h3>
              <p>{submissions.length === 0 ? "Students haven't submitted this assignment." : "No matching submissions found."}</p>
            </div>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th className="col-student">Student Info</th>
                  <th className="col-files">Submitted Files</th>
                  <th className="col-date">Submission Date</th>
                  <th className="col-status">Status</th>
                  <th className="col-marks">Marks</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub._id} className={sub.aiGraded ? 'ai-graded-row' : ''}>
                    {/* 🔥 COMPACT STUDENT INFO - NAME & EMAIL INLINE */}
                    <td className="student-cell">
                      <div className="student-info-compact">
                        <div className="student-avatar-small">
                          {sub.student?.profilePic ? (
                            <img 
                              src={sub.student.profilePic} 
                              alt={sub.student?.name}
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {sub.student?.name?.charAt(0) || 'S'}
                            </div>
                          )}
                        </div>
                        <div className="student-details-inline">
                          <div className="student-name-row">
                            <h4>{sub.student?.name || 'Unknown Student'}</h4>
                            {sub.comments && (
                              <div className="has-comments-tooltip">
                                <span className="has-comments-badge">
                                  <FaComment />
                                </span>
                                <div className="comments-tooltip">
                                  <strong>Student Comments:</strong>
                                  <p>{sub.comments}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="student-email-inline">{sub.student?.email || 'No email'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Files Column */}
                    <td className="files-cell">
                      {sub.files?.length > 0 ? (
                        <div className="files-list-compact">
                          {sub.files.map((file, idx) => (
                            <button
                              key={idx}
                              className="file-tag"
                              onClick={() => handleFileDownload(file)}
                              title={`Download ${file.filename}`}
                            >
                              <span className="file-icon-wrapper pdf-icon-box">
                                <FaFilePdf className="file-icon pdf" />
                              </span>
                              <span className="filename-truncate">{file.filename}</span>
                              <FaDownload className="download-icon" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="no-files">No files</span>
                      )}
                    </td>

                    {/* Date Column */}
                    <td className="date-cell">
                      <div className="date-info">
                        <FaCalendar className="date-icon" />
                        <span>{formatDate(sub.submittedAt)}</span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="status-cell">
                      <div className={`status-badge-table ${sub.status}`}>
                        {sub.status === 'graded' ? <FaCheckCircle /> : <FaClock />}
                        <span>{sub.status}</span>
                        {sub.aiGraded && (
                          <span className="ai-indicator" title={`AI Confidence: ${sub.aiConfidence}%`}>
                            <FaRobot />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Marks Column */}
                    <td className="marks-cell">
                      {sub.status === 'graded' ? (
                        <div className="marks-display-table">
                          <span className="obtained-marks">{sub.obtainedMarks}</span>
                          <span className="total-marks">/ {assignment?.totalMarks}</span>
                          <span className="percentage">
                            ({((sub.obtainedMarks / assignment?.totalMarks) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="pending-marks">-- / {assignment?.totalMarks}</span>
                      )}
                    </td>

                    {/* 🔥 FIXED ACTIONS COLUMN */}
                    <td className="actions-cell">
                      <div className="action-buttons-table">
                        {sub.status === 'graded' ? (
                          <>
                            <button 
                              className="btn-action-table btn-edit"
                              onClick={() => openGradeModal(sub)}
                              title={sub.aiGraded ? "Override AI Grade" : "Edit Grade"}
                            >
                              <FaEdit />
                              <span>{sub.aiGraded ? 'Override' : 'Edit'}</span>
                            </button>
                            {sub.aiGraded && (
                              <button 
                                className="btn-action-table btn-regrade"
                                onClick={() => handleRegrade(sub)}
                                disabled={aiGrading}
                                title="Re-grade with AI"
                              >
                                <FaSync className={aiGrading ? 'spin' : ''} />
                                <span>Re-grade</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-action-table btn-grade"
                              onClick={() => openGradeModal(sub)}
                            >
                              <FaStar />
                              <span>Grade</span>
                            </button>
                            <button 
                              className="btn-action-table btn-ai"
                              onClick={() => handleAIGrade(sub)}
                              disabled={aiGrading || apiQuotaExceeded}
                              title={apiQuotaExceeded ? "API quota exceeded" : "Auto-grade with AI"}
                            >
                              {aiGrading && gradingSubmission?._id === sub._id ? (
                                <FaSpinner className="spin" />
                              ) : (
                                <FaRobot />
                              )}
                              <span>AI Grade</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🔥 MANUAL GRADE MODAL - FIXED HEADER TEXT COLOR */}
      {gradingSubmission && !showAIResult && (
        <div className="modal-overlay" onClick={closeGradeModal}>
          <div className="grade-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaStar /> 
                {gradingSubmission.aiGraded ? 'Review AI Grade' : 'Grade Submission'}
                {gradingSubmission.aiGraded && (
                  <span className="ai-badge-header">
                    <FaRobot /> AI
                  </span>
                )}
              </h3>
              <button className="close-btn" onClick={closeGradeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-preview">
                <div className="preview-avatar">
                  {gradingSubmission.student?.profilePic ? (
                    <img 
                      src={gradingSubmission.student.profilePic} 
                      alt={gradingSubmission.student?.name}
                    />
                  ) : (
                    <div className="avatar-placeholder large">
                      {gradingSubmission.student?.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div>
                  <h4>{gradingSubmission.student?.name}</h4>
                  <p><FaEnvelope /> {gradingSubmission.student?.email}</p>
                  <p className="submit-time"><FaClock /> Submitted: {formatDate(gradingSubmission.submittedAt)}</p>
                </div>
              </div>

              {/* Show AI info if available */}
              {gradingSubmission.aiGraded && (
                <div className="ai-suggestion-box">
                  <div className="ai-suggestion-header">
                    <strong><FaRobot /> AI Suggested Grade</strong>
                    <span className="ai-marks-badge">
                      {gradingSubmission.obtainedMarks}/{assignment?.totalMarks}
                    </span>
                  </div>
                  <p>{gradingSubmission.aiFeedback}</p>
                  {gradingSubmission.aiConfidence > 0 && (
                    <div className="confidence-score">
                      Confidence: {gradingSubmission.aiConfidence}%
                    </div>
                  )}
                </div>
              )}

              <div className="grade-form">
                <div className="form-group">
                  <label>Marks (out of {assignment?.totalMarks})</label>
                  <input
                    type="number"
                    min="0"
                    max={assignment?.totalMarks}
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(e.target.value)}
                    placeholder="Enter marks"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Feedback (Optional)</label>
                  <textarea
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide feedback to student..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeGradeModal}>
                Cancel
              </button>
              <button 
                className="btn-submit-grade"
                onClick={gradingSubmission.aiGraded ? handleOverrideGrade : handleGradeSubmit}
                disabled={submitting || !gradeMarks}
              >
                {submitting ? 'Submitting...' : <><FaCheck /> {gradingSubmission.aiGraded ? 'Override Grade' : 'Submit Grade'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI RESULT MODAL */}
      {showAIResult && aiResult && (
        <div className="modal-overlay" onClick={() => setShowAIResult(false)}>
          <div className="grade-modal ai-result-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header ai-header">
              <h3><FaRobot /> AI Grading Result</h3>
              <button className="close-btn" onClick={() => setShowAIResult(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ai-result-score">
                <div className="score-circle">
                  <span className="score-number">{aiResult.marks}</span>
                  <span className="score-total">/{assignment?.totalMarks}</span>
                </div>
                <div className={`grade-badge ${aiResult.grade === 'A' ? 'excellent' : aiResult.grade === 'F' ? 'fail' : 'good'}`}>
                  Grade {aiResult.grade}
                </div>
                <div className="confidence-text">
                  Confidence: {aiResult.confidence}%
                </div>
              </div>

              <div className="ai-feedback-result">
                <h4><FaCheckCircle /> Feedback</h4>
                <p>{aiResult.feedback}</p>
              </div>

              {aiResult.strengths?.length > 0 && (
                <div className="ai-strengths">
                  <h4><FaCheckCircle /> Strengths:</h4>
                  <ul>
                    {aiResult.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResult.improvements?.length > 0 && (
                <div className="ai-improvements">
                  <h4><FaMagic /> Areas to Improve:</h4>
                  <ul>
                    {aiResult.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🔥 REQUIREMENT ANALYSIS IN MODAL */}
              {aiResult.requirementAnalysis && (
                <div className="ai-requirements">
                  <h4><FaList /> Requirements Check:</h4>
                  <div className="req-check-grid">
                    {aiResult.requirementAnalysis.met?.map((r, i) => (
                      <div key={i} className="req-check met">✅ {r}</div>
                    ))}
                    {aiResult.requirementAnalysis.partiallyMet?.map((r, i) => (
                      <div key={i} className="req-check partial">⚠️ {r}</div>
                    ))}
                    {aiResult.requirementAnalysis.notMet?.map((r, i) => (
                      <div key={i} className="req-check not-met">❌ {r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAIResult(false)}>
                Close
              </button>
              <button 
                className="btn-submit-grade"
                onClick={() => {
                  setShowAIResult(false);
                  openGradeModal(gradingSubmission);
                }}
              >
                <FaEdit /> Adjust Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsView;