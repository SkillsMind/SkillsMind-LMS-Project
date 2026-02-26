import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaArrowLeft, FaSave, FaEye, FaFilePdf, FaPaperPlane, 
  FaTrash, FaPlus, FaImage, FaTable, FaLink, FaHeading,
  FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter,
  FaAlignRight, FaListUl, FaListOl, FaQuoteRight,
  FaCheckCircle, FaClock, FaExclamationTriangle,
  FaChevronDown, FaChevronUp, FaGripLines, FaTimes,
  FaBars, FaChevronLeft
} from 'react-icons/fa';
import './AssignmentBuilder.css';

// API configuration - Vite compatible
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 🔥 Custom Modal Component
const CustomModal = ({ isOpen, onClose, title, children, onConfirm, confirmText = 'OK', cancelText = 'Cancel', showCancel = true }) => {
  if (!isOpen) return null;
  
  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>{title}</h3>
          <button className="ab-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="ab-modal-body">
          {children}
        </div>
        <div className="ab-modal-footer">
          {showCancel && (
            <button className="ab-modal-btn cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className="ab-modal-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignmentBuilder = ({ onClose, onSubmit, onBack }) => {
  // Refs
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // 🔥 Get assignment data from localStorage (set by Assignment.jsx)
  const getStoredAssignment = () => {
    try {
      const stored = localStorage.getItem('currentAssignment');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading assignment:', e);
    }
    return null;
  };

  const storedAssignment = getStoredAssignment();

  // State
  const [sections, setSections] = useState([
    { id: 'intro', title: 'Introduction', content: '', order: 0 },
    { id: 'objectives', title: 'Objectives', content: '', order: 1 },
    { id: 'methodology', title: 'Methodology', content: '', order: 2 },
    { id: 'main', title: 'Main Content', content: '', order: 3 },
    { id: 'analysis', title: 'Analysis & Findings', content: '', order: 4 },
    { id: 'conclusion', title: 'Conclusion', content: '', order: 5 },
    { id: 'references', title: 'References', content: '', order: 6 }
  ]);
  
  const [activeSectionId, setActiveSectionId] = useState('main');
  const [assignmentTitle, setAssignmentTitle] = useState(storedAssignment?.title || '');
  const [coverImage, setCoverImage] = useState(null);
  
  // 🔥 Real student info from stored assignment
  const [studentInfo, setStudentInfo] = useState({
    name: storedAssignment?.studentName || '',
    email: storedAssignment?.studentEmail || '',
    studentId: storedAssignment?.studentId || '',
    _id: storedAssignment?.studentId || ''
  });

  // 🔥 Real assignment info
  const [assignmentInfo, setAssignmentInfo] = useState({
    _id: storedAssignment?._id || '',
    courseName: storedAssignment?.courseName || '',
    courseAssignmentNo: storedAssignment?.courseAssignmentNo || '',
    assignmentNo: storedAssignment?.assignmentNo || '',
    courseId: storedAssignment?.courseId || '',
    totalMarks: storedAssignment?.totalMarks || ''
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [pdfError, setPdfError] = useState(null);
  
  // Modal States
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    content: null,
    onConfirm: () => {},
    confirmText: 'OK',
    showCancel: true
  });
  
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  
  const [editorState, setEditorState] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    fontSize: '16px',
    fontFamily: 'Arial'
  });

  // 🔥 Initialize - Load draft if exists
  useEffect(() => {
    if (storedAssignment?._id) {
      const draftKey = `assignment_draft_${storedAssignment._id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.sections) setSections(parsed.sections);
          if (parsed.title) setAssignmentTitle(parsed.title);
          if (parsed.coverImage) setCoverImage(parsed.coverImage);
          if (parsed.timestamp) setLastSaved(new Date(parsed.timestamp));
          toast.success('Draft restored', { icon: '💾' });
        } catch (e) {
          console.error('Draft load error:', e);
        }
      }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      const hasContent = sections.some(s => s.content?.trim().length > 0);
      if (hasContent && !isSaving && storedAssignment?._id) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sections, assignmentTitle, coverImage, isSaving, storedAssignment]);

  // Update word count
  useEffect(() => {
    const activeSection = sections.find(s => s.id === activeSectionId);
    const text = activeSection?.content?.replace(/<[^>]*>/g, '') || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [sections, activeSectionId]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!storedAssignment?._id) return;
    
    setIsSaving(true);
    const draft = {
      sections,
      title: assignmentTitle,
      coverImage,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`assignment_draft_${storedAssignment._id}`, JSON.stringify(draft));
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  }, [sections, assignmentTitle, coverImage, storedAssignment]);

  const updateSectionContent = (sectionId, content) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, content } : s
    ));
  };

  const handleTitleChange = (e) => {
    setAssignmentTitle(e.target.value);
  };

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target.result);
      toast.success('Cover image added');
    };
    reader.readAsDataURL(file);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateEditorState();
    editorRef.current?.focus();
  };

  const updateEditorState = () => {
    try {
      setEditorState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        align: document.queryCommandValue('justifyLeft') ? 'left' : 
               document.queryCommandValue('justifyCenter') ? 'center' : 
               document.queryCommandValue('justifyRight') ? 'right' : 'left',
        fontSize: document.queryCommandValue('fontSize') || '16px',
        fontFamily: document.queryCommandValue('fontName') || 'Arial'
      });
    } catch (e) {}
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgHtml = `
        <div class="ab-resizable-image" contenteditable="false">
          <img src="${event.target.result}" style="max-width:100%;height:auto;display:block;border-radius:8px;" />
          <div class="ab-image-resize-handle"></div>
          <button class="ab-image-delete" onclick="this.closest('.ab-resizable-image').remove()" contenteditable="false">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <p><br></p>
      `;
      execCommand('insertHTML', imgHtml);
      toast.success('Image inserted. Click to select, drag corner to resize.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openTableModal = () => {
    setTableRows(3);
    setTableCols(3);
    setModalConfig({
      isOpen: true,
      title: 'Insert Table',
      confirmText: 'Insert',
      showCancel: true,
      onConfirm: () => {
        insertTableData(tableRows, tableCols);
        closeModal();
      },
      content: (
        <div className="ab-modal-inputs">
          <div className="ab-modal-input-group">
            <label>Rows (1-20):</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={tableRows} 
              onChange={(e) => setTableRows(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20))}
              className="ab-modal-input"
            />
          </div>
          <div className="ab-modal-input-group">
            <label>Columns (1-10):</label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={tableCols} 
              onChange={(e) => setTableCols(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 10))}
              className="ab-modal-input"
            />
          </div>
        </div>
      )
    });
  };

  const insertTableData = (rows, cols) => {
    let tableHTML = `
      <div class="ab-deletable-element">
        <div class="ab-element-delete" onclick="this.closest('.ab-deletable-element').remove()" title="Delete Table">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;border:2px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    `;
    
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        const isHeader = i === 0;
        const tag = isHeader ? 'th' : 'td';
        const bg = isHeader ? '#f8fafc' : '#ffffff';
        const weight = isHeader ? '600' : '400';
        tableHTML += `<${tag} style="border:1px solid #e5e7eb;padding:12px;text-align:left;background:${bg};font-weight:${weight};">${isHeader ? `Header ${j+1}` : `Cell ${i}-${j}`}</${tag}>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table></div><p><br></p>';
    
    execCommand('insertHTML', tableHTML);
    toast.success(`Table ${rows}x${cols} inserted`);
  };

  const openLinkModal = () => {
    setLinkUrl('https://');
    setLinkText('');
    setModalConfig({
      isOpen: true,
      title: 'Insert Link',
      confirmText: 'Insert',
      showCancel: true,
      onConfirm: () => {
        if (linkUrl && linkUrl !== 'https://') {
          const displayText = linkText || linkUrl;
          const linkHTML = `
            <span class="ab-deletable-element ab-link-wrapper" contenteditable="false">
              <a href="${linkUrl}" target="_blank" style="color:#000B29;text-decoration:underline;font-weight:500;">${displayText}</a>
              <button class="ab-element-delete-inline" onclick="this.closest('.ab-deletable-element').remove()" contenteditable="false">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </span>
          `;
          execCommand('insertHTML', linkHTML);
          toast.success('Link inserted');
        }
        closeModal();
      },
      content: (
        <div className="ab-modal-inputs">
          <div className="ab-modal-input-group">
            <label>URL:</label>
            <input 
              type="text" 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)}
              className="ab-modal-input"
              placeholder="https://example.com"
            />
          </div>
          <div className="ab-modal-input-group">
            <label>Display Text (optional):</label>
            <input 
              type="text" 
              value={linkText} 
              onChange={(e) => setLinkText(e.target.value)}
              className="ab-modal-input"
              placeholder="Click here"
            />
          </div>
        </div>
      )
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const openAddSectionModal = () => {
    setNewSectionName('');
    setModalConfig({
      isOpen: true,
      title: 'Add New Section',
      confirmText: 'Add Section',
      showCancel: true,
      onConfirm: () => {
        if (newSectionName?.trim()) {
          const newId = `section-${Date.now()}`;
          const newSection = {
            id: newId,
            title: newSectionName.trim(),
            content: '',
            order: sections.length
          };
          setSections([...sections, newSection]);
          setActiveSectionId(newId);
          toast.success(`Section "${newSectionName.trim()}" added`);
        }
        closeModal();
      },
      content: (
        <div className="ab-modal-inputs">
          <div className="ab-modal-input-group">
            <label>Section Name:</label>
            <input 
              type="text" 
              value={newSectionName} 
              onChange={(e) => setNewSectionName(e.target.value)}
              className="ab-modal-input"
              placeholder="e.g., Literature Review"
              autoFocus
            />
          </div>
        </div>
      )
    });
  };

  const addSection = () => {
    openAddSectionModal();
  };

  const openClearAllModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Clear All Content',
      confirmText: 'Clear All',
      showCancel: true,
      onConfirm: () => {
        setSections(sections.map(s => ({ ...s, content: '' })));
        setAssignmentTitle('');
        setCoverImage(null);
        if (storedAssignment?._id) {
          localStorage.removeItem(`assignment_draft_${storedAssignment._id}`);
        }
        toast.success('All content cleared');
        closeModal();
      },
      content: (
        <p className="ab-modal-text">
          Are you sure you want to clear all content? This action cannot be undone and will delete all your work.
        </p>
      )
    });
  };

  const removeSection = (sectionId) => {
    if (sections.length <= 1) {
      toast.error('At least one section required');
      return;
    }
    
    const section = sections.find(s => s.id === sectionId);
    setModalConfig({
      isOpen: true,
      title: 'Delete Section',
      confirmText: 'Delete',
      showCancel: true,
      onConfirm: () => {
        setSections(sections.filter(s => s.id !== sectionId));
        if (activeSectionId === sectionId) {
          setActiveSectionId(sections[0].id);
        }
        toast.success('Section deleted');
        closeModal();
      },
      content: (
        <p className="ab-modal-text">
          Are you sure you want to delete "{section.title}" section? This cannot be undone.
        </p>
      )
    });
  };

  const moveSection = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };

  const clearAll = () => {
    openClearAllModal();
  };

  // 🔥 IMPROVED PDF GENERATION WITH REAL DATA
  const generatePDF = async () => {
    const hasContent = sections.some(s => s.content?.trim().length > 0);
    if (!hasContent) {
      toast.error('Please add content before generating PDF');
      return;
    }

    setIsGeneratingPDF(true);
    setPdfError(null);
    const loadingToast = toast.loading('Generating PDF...');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error('Please login again');
        setIsGeneratingPDF(false);
        return;
      }

      // 🔥 Prepare data with REAL student info
      const pdfData = {
        title: assignmentTitle || 'Untitled Assignment',
        sections: sections.filter(s => s.content?.trim()),
        // 🔥 Real student data from state
        studentName: studentInfo.name || 'Student',
        studentEmail: studentInfo.email || '',
        studentId: studentInfo.studentId || '',
        // 🔥 Real assignment data from state
        courseName: assignmentInfo.courseName || 'Course',
        assignmentNo: assignmentInfo.courseAssignmentNo || assignmentInfo.assignmentNo || 'N/A',
        assignmentId: assignmentInfo._id,
        coverImage: coverImage
      };

      console.log('🔥 Sending PDF data:', pdfData);

      const response = await axios.post(
        `${API_BASE_URL}/assignments/generate-pdf`,
        pdfData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob',
          timeout: 60000
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(assignmentTitle || 'Assignment').replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully! 🎉');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss(loadingToast);
      
      let errorMsg = 'Failed to generate PDF';
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timed out. Please try again.';
      } else if (error.response?.status === 503) {
        errorMsg = error.response?.data?.details || 'PDF service temporarily unavailable';
        setPdfError('PDF service not configured. Please contact administrator.');
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error: ' + (error.response?.data?.details || 'PDF generation failed');
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (!error.response) {
        errorMsg = 'Network error: Server may be down or unreachable';
      } else {
        errorMsg = error.response?.data?.error || 'Failed to generate PDF';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 🔥 IMPROVED SUBMIT FUNCTION WITH REAL DATA
  const submitAssignment = async () => {
    const hasContent = sections.some(s => s.content?.trim().length > 50);
    if (!hasContent) {
      toast.error('Please add substantial content before submitting (min 50 chars)');
      return;
    }

    if (!assignmentInfo._id) {
      toast.error('Assignment ID not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Preparing submission...');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error('Please login again');
        setIsSubmitting(false);
        return;
      }

      // Generate PDF first
      toast.loading('Generating PDF...', { id: loadingToast });
      
      const pdfResponse = await axios.post(
        `${API_BASE_URL}/assignments/generate-pdf`,
        {
          title: assignmentTitle || 'Untitled Assignment',
          sections: sections.filter(s => s.content?.trim()),
          studentName: studentInfo.name,
          studentEmail: studentInfo.email,
          studentId: studentInfo.studentId,
          courseName: assignmentInfo.courseName,
          assignmentNo: assignmentInfo.courseAssignmentNo,
          coverImage: coverImage
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
          timeout: 60000
        }
      );

      // Create file from PDF blob
      const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const pdfFile = new File(
        [pdfBlob], 
        `${(assignmentTitle || 'Assignment').replace(/\s+/g, '_')}.pdf`, 
        { type: 'application/pdf' }
      );

      // Submit with PDF
      toast.loading('Uploading...', { id: loadingToast });
      
      const formData = new FormData();
      formData.append('files', pdfFile);
      formData.append('comments', `Assignment Builder - ${sections.filter(s => s.content).length} sections`);
      formData.append('builderData', JSON.stringify({
        title: assignmentTitle,
        sections: sections.filter(s => s.content?.trim()),
        submittedAt: new Date().toISOString()
      }));

      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentInfo._id}/submit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        }
      );

      if (response.data.success) {
        localStorage.removeItem(`assignment_draft_${assignmentInfo._id}`);
        toast.dismiss(loadingToast);
        toast.success('Assignment submitted successfully! 🎉');
        onClose();
        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.dismiss(loadingToast);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit assignment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  // 🔥 PREVIEW MODE RENDER WITH REAL DATA
  if (showPreview) {
    return (
      <div className="ab-preview-mode">
        <div className="ab-preview-header">
          <button className="ab-btn-back" onClick={() => setShowPreview(false)}>
            <FaArrowLeft /> Back to Editor
          </button>
          <h2>Assignment Preview</h2>
          <div className="ab-preview-actions">
            <button 
              className="ab-btn-download" 
              onClick={generatePDF}
              disabled={isGeneratingPDF}
            >
              <FaFilePdf /> {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
        
        {pdfError && (
          <div className="ab-error-banner">
            <FaExclamationTriangle />
            <span>{pdfError}</span>
            <button onClick={() => setPdfError(null)}>Dismiss</button>
          </div>
        )}
        
        <div className="ab-preview-document">
          {/* Header Section with REAL Data */}
          <div className="ab-preview-header-section">
            <div className="ab-preview-logo">
              {coverImage ? (
                <img src={coverImage} alt="Cover" />
              ) : (
                <div className="ab-logo-placeholder">📚</div>
              )}
            </div>
            <div className="ab-preview-title-section">
              <h1>{assignmentTitle || 'Untitled Assignment'}</h1>
              <p>{assignmentInfo.courseName || 'Course Name'}</p>
            </div>
            <div className="ab-preview-meta">
              <div className="ab-meta-item">
                <span className="ab-meta-label">Student</span>
                <span className="ab-meta-value">{studentInfo.name || 'Student Name'}</span>
              </div>
              <div className="ab-meta-item">
                <span className="ab-meta-label">Date</span>
                <span className="ab-meta-value">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Meta Bar with REAL Data */}
          <div className="ab-preview-meta-bar">
            <div className="ab-meta-item">
              <span className="ab-meta-label">Course</span>
              <span className="ab-meta-value">{assignmentInfo.courseName || 'N/A'}</span>
            </div>
            <div className="ab-meta-item">
              <span className="ab-meta-label">Assignment #</span>
              <span className="ab-meta-value">{assignmentInfo.courseAssignmentNo || 'N/A'}</span>
            </div>
            <div className="ab-meta-item">
              <span className="ab-meta-label">Status</span>
              <span className="ab-meta-value completed">Completed</span>
            </div>
          </div>
          
          {/* Content Sections */}
          <div className="ab-preview-content">
            {sections
              .filter(s => s.content?.trim())
              .map(section => (
                <div key={section.id} className="ab-preview-section">
                  <h2>{section.title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              ))}
          </div>
          
          {/* Footer */}
          <div className="ab-preview-footer">
            <p><strong>SkillsMind Learning Management System</strong></p>
            <p>© {new Date().getFullYear()} All rights reserved</p>
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ab-container">
      {/* Hidden file inputs */}
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageSelect}
        ref={imageInputRef}
        hidden 
      />
      
      {/* Custom Modal */}
      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        showCancel={modalConfig.showCancel}
      >
        {modalConfig.content}
      </CustomModal>

      {/* Mobile Header */}
      <div className="ab-mobile-header">
        <button 
          className="ab-mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars /> Sections
        </button>
        <span className="ab-mobile-title">{activeSection?.title}</span>
        <div className="ab-mobile-actions">
          <button className="ab-mobile-icon-btn" onClick={() => setShowPreview(true)} title="Preview">
            <FaEye />
          </button>
          <button 
            className="ab-mobile-icon-btn submit" 
            onClick={submitAssignment}
            disabled={isSubmitting}
            title="Submit"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>

      {/* Banner Section - Desktop */}
      <div className="ab-banner">
        <div className="ab-banner-content">
          <div className="ab-banner-left">
            <button className="ab-banner-back" onClick={handleBack}>
              <FaChevronLeft />
            </button>
            <div className="ab-banner-icon">📚</div>
            <div className="ab-banner-text">
              <h1>Assignment Builder</h1>
              <p>Create professional assignments with ease</p>
            </div>
          </div>
          
          <div className="ab-banner-actions">
            <button className="ab-banner-btn secondary" onClick={clearAll}>
              <FaTrash /> Clear All
            </button>
            <button className="ab-banner-btn secondary" onClick={saveDraft}>
              <FaSave /> Save Draft
            </button>
            <button className="ab-banner-btn secondary" onClick={() => setShowPreview(true)}>
              <FaEye /> Preview
            </button>
            <button 
              className="ab-banner-btn primary" 
              onClick={submitAssignment}
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : <><FaPaperPlane /> Submit</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="ab-workspace">
        {/* Sidebar - Right side on mobile */}
        <aside className={`ab-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="ab-sidebar-header">
            <h3>Sections</h3>
            <div className="ab-sidebar-actions">
              <button className="ab-btn-add" onClick={addSection} title="Add section">
                <FaPlus />
              </button>
              <button 
                className="ab-btn-collapse-mobile" 
                onClick={() => setSidebarOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="ab-sections-list">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`ab-section-item ${activeSectionId === section.id ? 'active' : ''} ${section.content?.trim() ? 'has-content' : ''}`}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setSidebarOpen(false);
                }}
              >
                <div className="ab-section-drag">
                  <FaGripLines />
                </div>
                <span className="ab-section-title">{section.title}</span>
                {section.content?.trim() && <span className="ab-section-indicator" />}
                <div className="ab-section-controls">
                  {index > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}>
                      <FaChevronUp />
                    </button>
                  )}
                  {index < sections.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}>
                      <FaChevronDown />
                    </button>
                  )}
                  {!['intro', 'main', 'conclusion'].includes(section.id) && (
                    <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}>
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="ab-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Editor Area */}
        <main className="ab-editor-area">
          {/* Title & Cover Section */}
          <div className="ab-document-header">
            <div className="ab-title-group">
              <label>Assignment Title</label>
              <input
                type="text"
                value={assignmentTitle}
                onChange={handleTitleChange}
                placeholder="Enter a descriptive title..."
                className="ab-title-input"
              />
            </div>
            
            <div className="ab-cover-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                hidden
                ref={fileInputRef}
              />
              {coverImage ? (
                <div className="ab-cover-preview">
                  <img src={coverImage} alt="Cover" />
                  <button className="ab-cover-remove" onClick={() => setCoverImage(null)}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <button className="ab-btn-cover" onClick={() => fileInputRef.current?.click()}>
                  <FaImage /> Add Cover
                </button>
              )}
            </div>
          </div>

          {/* Editor Toolbar */}
          <div className="ab-toolbar">
            <div className="ab-toolbar-group">
              <select 
                className="ab-toolbar-select"
                onChange={(e) => execCommand('fontName', e.target.value)}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Roboto">Roboto</option>
              </select>
              
              <select 
                className="ab-toolbar-select"
                onChange={(e) => {
                  const sizeMap = { '14px': '2', '16px': '3', '18px': '4', '24px': '5' };
                  execCommand('fontSize', sizeMap[e.target.value] || '3');
                }}
              >
                <option value="14px">Small</option>
                <option value="16px">Normal</option>
                <option value="18px">Large</option>
                <option value="24px">Heading</option>
              </select>
            </div>

            <div className="ab-toolbar-divider" />

            <div className="ab-toolbar-group">
              <button 
                className={`ab-toolbar-btn ${editorState.bold ? 'active' : ''}`}
                onClick={() => execCommand('bold')}
                title="Bold"
              >
                <FaBold />
              </button>
              <button 
                className={`ab-toolbar-btn ${editorState.italic ? 'active' : ''}`}
                onClick={() => execCommand('italic')}
                title="Italic"
              >
                <FaItalic />
              </button>
              <button 
                className={`ab-toolbar-btn ${editorState.underline ? 'active' : ''}`}
                onClick={() => execCommand('underline')}
                title="Underline"
              >
                <FaUnderline />
              </button>
            </div>

            <div className="ab-toolbar-divider" />

            <div className="ab-toolbar-group">
              <button 
                className={`ab-toolbar-btn ${editorState.align === 'left' ? 'active' : ''}`}
                onClick={() => execCommand('justifyLeft')}
                title="Align Left"
              >
                <FaAlignLeft />
              </button>
              <button 
                className={`ab-toolbar-btn ${editorState.align === 'center' ? 'active' : ''}`}
                onClick={() => execCommand('justifyCenter')}
                title="Center"
              >
                <FaAlignCenter />
              </button>
              <button 
                className={`ab-toolbar-btn ${editorState.align === 'right' ? 'active' : ''}`}
                onClick={() => execCommand('justifyRight')}
                title="Align Right"
              >
                <FaAlignRight />
              </button>
            </div>

            <div className="ab-toolbar-divider" />

            <div className="ab-toolbar-group">
              <button className="ab-toolbar-btn" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                <FaListUl />
              </button>
              <button className="ab-toolbar-btn" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                <FaListOl />
              </button>
            </div>

            <div className="ab-toolbar-divider" />

            <div className="ab-toolbar-group">
              <button className="ab-toolbar-btn" onClick={insertImage} title="Insert Image">
                <FaImage />
              </button>
              <button className="ab-toolbar-btn" onClick={openTableModal} title="Insert Table">
                <FaTable />
              </button>
              <button className="ab-toolbar-btn" onClick={openLinkModal} title="Insert Link">
                <FaLink />
              </button>
            </div>

            <div className="ab-toolbar-divider" />

            <div className="ab-toolbar-group">
              <button className="ab-toolbar-btn" onClick={() => execCommand('formatBlock', 'H2')} title="Heading">
                <FaHeading />
              </button>
              <button className="ab-toolbar-btn" onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} title="Quote">
                <FaQuoteRight />
              </button>
              <button className="ab-toolbar-btn" onClick={() => execCommand('removeFormat')} title="Clear Formatting">
                <FaTrash />
              </button>
            </div>
          </div>

          {/* Section Header */}
          <div className="ab-section-header">
            <h2>{activeSection?.title}</h2>
            <span className="ab-word-count">{wordCount} words</span>
          </div>

          {/* Editor Content */}
          <div className="ab-editor-wrapper">
            <div
              ref={editorRef}
              className="ab-editor-content"
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              onInput={(e) => updateSectionContent(activeSectionId, e.currentTarget.innerHTML)}
              onKeyUp={updateEditorState}
              onMouseUp={updateEditorState}
              dangerouslySetInnerHTML={{ __html: activeSection?.content || '' }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignmentBuilder;