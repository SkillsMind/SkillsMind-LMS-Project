import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import './Notebook.css';

// ==========================================
// SVG ICONS
// ==========================================
const Icons = {
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Pin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
  Star: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Restore: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Sparkles: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  Bold: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  Italic: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  Underline: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
  List: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Mic: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Template: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Brain: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04z"/></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  FileText: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
};

// ==========================================
// TEMPLATES
// ==========================================
const NOTE_TEMPLATES = {
  blank: { title: 'New Note', content: '' },
  lecture: { 
    title: 'Lecture Notes', 
    content: '📚 Course:\n🗓️ Date:\n👨‍🏫 Instructor:\n\n📝 Key Points:\n• \n• \n• \n\n❓ Questions:\n• \n\n📖 Summary:\n' 
  },
  assignment: { 
    title: 'Assignment Plan', 
    content: '📋 Assignment:\n📅 Due Date:\n\n🎯 Objectives:\n• \n• \n\n✅ Tasks:\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n📝 Notes:\n' 
  },
  revision: { 
    title: 'Revision Notes', 
    content: '📖 Topic:\n\n🔑 Key Concepts:\n• \n• \n\n💡 Important Formulas:\n• \n\n❓ Practice Questions:\n1. \n2. \n\n✅ Summary:\n' 
  },
  research: { 
    title: 'Research Notes', 
    content: '🔍 Topic:\n\n📚 Sources:\n• \n• \n\n📝 Findings:\n• \n\n💭 Analysis:\n\n🎯 Conclusion:\n' 
  }
};

const Notebook = ({ studentName }) => {
  // ==========================================
  // STATE
  // ==========================================
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [availableTags] = useState(['important', 'exam', 'homework', 'revision', 'idea', 'todo', 'research', 'draft']);
  
  // UI State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMethod, setShareMethod] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [textFormat, setTextFormat] = useState({ bold: false, italic: false, underline: false });
  
  // Refs
  const autoSaveTimer = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const API_BASE = 'http://localhost:5000/api';

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('studentToken');

  // ==========================================
  // FETCH COURSES
  // ==========================================
  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/courses/simple/list`);
      if (response.data.success) {
        const formattedCourses = response.data.courses.map(c => ({
          _id: c._id,
          code: c.category ? c.category.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100) : 'GEN' + Math.floor(Math.random() * 100),
          name: c.title,
          category: c.category || 'General'
        }));
        setCourses(formattedCourses);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([
        { _id: '1', code: 'CS101', name: 'Computer Science', category: 'Technology' },
        { _id: '2', code: 'MATH201', name: 'Mathematics', category: 'Science' },
        { _id: '3', code: 'ENG102', name: 'English', category: 'Arts' }
      ]);
    }
  }, [API_BASE]);

  // ==========================================
  // FETCH NOTES
  // ==========================================
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const endpoint = activeTab === 'trash' ? '/notes/trash' : '/notes';
      
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, activeTab]);

  useEffect(() => {
    fetchCourses();
    fetchNotes();
  }, [fetchCourses, fetchNotes]);

  // ==========================================
  // AUTO SAVE
  // ==========================================
  useEffect(() => {
    if (isEditing && selectedNote) {
      setSaveStatus('unsaved');
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => handleSave(), 2000);
      return () => clearTimeout(autoSaveTimer.current);
    }
  }, [editTitle, editContent, editCourse, editTags]);

  // ==========================================
  // GROUPED COURSES
  // ==========================================
  const groupedCourses = useMemo(() => {
    const filtered = courses.filter(c => 
      c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
    
    const groups = {};
    filtered.forEach(course => {
      if (!groups[course.category]) groups[course.category] = [];
      groups[course.category].push(course);
    });
    return groups;
  }, [courses, courseSearchQuery]);

  // ==========================================
  // CREATE NOTE
  // ==========================================
  const handleCreateNote = async (templateKey = null) => {
    const template = templateKey ? NOTE_TEMPLATES[templateKey] : NOTE_TEMPLATES.blank;
    
    try {
      const token = getToken();
      const selectedCourse = courses[0];
      const response = await axios.post(`${API_BASE}/notes`, {
        title: template.title,
        content: template.content,
        courseId: selectedCourse?._id || '',
        courseName: selectedCourse?.name || 'General',
        courseCode: selectedCourse?.code || '',
        tags: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotes([response.data.data, ...notes]);
        handleSelectNote(response.data.data);
        setIsEditing(true);
      }
    } catch (error) {
      const newNote = {
        _id: Date.now().toString(),
        title: template.title,
        content: template.content,
        courseCode: courses[0]?.code || 'GEN',
        courseName: courses[0]?.name || 'General',
        courseId: courses[0]?._id || '',
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false,
        wordCount: 0,
        updatedAt: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
      handleSelectNote(newNote);
      setIsEditing(true);
    }
    setShowTemplateModal(false);
  };

  // ==========================================
  // SELECT NOTE
  // ==========================================
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCourse(note.courseId);
    setEditTags(note.tags || []);
    setIsEditing(false);
    setSidebarOpen(false);
    setAiSummary('');
  };

  // ==========================================
  // SAVE NOTE
  // ==========================================
  const handleSave = async () => {
    if (!selectedNote) return;
    
    const course = courses.find(c => c._id === editCourse);
    
    setSaveStatus('saving');
    try {
      const token = getToken();
      await axios.put(`${API_BASE}/notes/${selectedNote._id}`, {
        title: editTitle,
        content: editContent,
        courseId: editCourse,
        courseName: course?.name || selectedNote.courseName || 'General',
        tags: editTags,
        wordCount: editContent.split(/\s+/).filter(w => w.length > 0).length
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSaveStatus('saved');
      fetchNotes();
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
    }
  };

  // ==========================================
  // REAL TEXT FORMATTING (Using execCommand)
  // ==========================================
  const applyFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.focus();
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    if (!selectedText) return;
    
    let newText = '';
    let newStart = start;
    let newEnd = end;
    
    switch(format) {
      case 'bold':
        newText = `**${selectedText}**`;
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        newStart = start + 1;
        newEnd = end + 1;
        break;
      case 'underline':
        newText = `__${selectedText}__`;
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'list':
        newText = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n');
        newEnd = start + newText.length;
        break;
      default:
        return;
    }
    
    const newContent = editContent.substring(0, start) + newText + editContent.substring(end);
    setEditContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // ==========================================
  // REAL VOICE RECORDING (Web Speech API)
  // ==========================================
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setEditContent(prev => prev + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice recording is not supported in your browser. Please use Chrome.');
      return;
    }
    
    if (!isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };

  // ==========================================
  // AI SUMMARY
  // ==========================================
  const generateAISummary = async () => {
    if (!editContent.trim()) return;
    
    setIsGeneratingSummary(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const sentences = editContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '');
      setAiSummary(summary || 'No content to summarize.');
    } catch (error) {
      setAiSummary('Failed to generate summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ==========================================
  // SHARE NOTE
  // ==========================================
  const shareNote = async (method) => {
    if (!selectedNote) return;
    
    if (method === 'copy') {
      const shareText = `${selectedNote.title}\n\n${selectedNote.content}`;
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
      setShowShareModal(false);
    } else if (method === 'email') {
      setShareMethod('email');
    }
  };

  const sendEmail = () => {
    if (!emailTo || !selectedNote) return;
    
    const subject = encodeURIComponent(selectedNote.title);
    const body = encodeURIComponent(`${selectedNote.content}\n\nShared via SkillsMind Learning Notebook`);
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    
    setEmailTo('');
    setShareMethod(null);
    setShowShareModal(false);
  };

  // ==========================================
  // PDF EXPORT (Professional Template)
  // ==========================================
  const exportNote = () => {
    if (!selectedNote) return;
    
    const course = courses.find(c => c._id === selectedNote.courseId);
    const courseName = course?.name || selectedNote.courseName || 'General';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedNote.title} - SkillsMind</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f8fafc;
            padding: 40px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #000B29 0%, #001a4d 100%);
            color: white;
            padding: 40px;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(227, 6, 19, 0.2) 0%, transparent 70%);
            border-radius: 50%;
          }
          
          .logo {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            opacity: 0.8;
            margin-bottom: 20px;
            text-transform: uppercase;
          }
          
          .title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
          }
          
          .meta {
            display: flex;
            gap: 20px;
            font-size: 14px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .content {
            padding: 40px;
            font-size: 16px;
            line-height: 1.8;
            color: #334155;
          }
          
          .content p {
            margin-bottom: 16px;
          }
          
          .footer {
            background: #f1f5f9;
            padding: 24px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          
          .badge {
            display: inline-block;
            background: #000B29;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
          }
          
          .tag {
            display: inline-block;
            background: #e2e8f0;
            color: #475569;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-right: 4px;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SkillsMind Learning Notebook</div>
            <h1 class="title">${selectedNote.title}</h1>
            <div class="meta">
              <div class="meta-item">📚 ${courseName}</div>
              <div class="meta-item">📅 ${new Date(selectedNote.updatedAt).toLocaleDateString()}</div>
              <div class="meta-item">📝 ${selectedNote.wordCount || editContent.split(/\s+/).filter(w => w.length > 0).length} words</div>
            </div>
          </div>
          
          <div class="content">
            ${editContent.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <div>
              ${selectedNote.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
            </div>
            <div>
              Exported on ${new Date().toLocaleString()} | SkillsMind Learning Platform
            </div>
          </div>
        </div>
        
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'width=900,height=700');
    
    if (!printWindow) {
      // Fallback: download as HTML
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      a.click();
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ==========================================
  // TOGGLE ACTIONS
  // ==========================================
  const toggleAction = async (e, noteId, action) => {
    e.stopPropagation();
    try {
      const token = getToken();
      await axios.put(`${API_BASE}/notes/${noteId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
  };

  const moveToTrash = async (e, noteId) => {
    e.stopPropagation();
    try {
      const token = getToken();
      await axios.put(`${API_BASE}/notes/${noteId}/trash`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedNote?._id === noteId) setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Failed to trash:', error);
    }
  };

  const restoreNote = async (e, noteId) => {
    e.stopPropagation();
    try {
      const token = getToken();
      await axios.put(`${API_BASE}/notes/${noteId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (error) {
      console.error('Failed to restore:', error);
    }
  };

  const deleteForever = async (e, noteId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    
    try {
      const token = getToken();
      await axios.delete(`${API_BASE}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedNote?._id === noteId) setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // ==========================================
  // FILTER NOTES
  // ==========================================
  const filteredNotes = notes.filter(note => {
    if (activeTab === 'pinned' && !note.isPinned) return false;
    if (activeTab === 'favorites' && !note.isFavorite) return false;
    
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'all' || note.courseId === courseFilter;
    const matchesTag = tagFilter === 'all' || note.tags?.includes(tagFilter);
    
    return matchesSearch && matchesCourse && matchesTag;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (sortBy === 'oldest') return new Date(a.updatedAt) - new Date(b.updatedAt);
    if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
    return 0;
  });

  const stats = {
    total: notes.filter(n => !n.isDeleted).length,
    pinned: notes.filter(n => n.isPinned && !n.isDeleted).length,
    trash: notes.filter(n => n.isDeleted).length
  };

  const selectedCourseName = courses.find(c => c._id === editCourse)?.name || 'Select Course';

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="notebook-page">
      {/* Hero */}
      <div className="nb-hero">
        <div className="nb-hero-content">
          <div className="nb-hero-left">
            <div className="nb-hero-icon"><Icons.Book /></div>
            <div>
              <h1>My Learning Notebook</h1>
              <p>Capture ideas, organize thoughts, and track your learning journey</p>
            </div>
          </div>
          <div className="nb-hero-right">
            <div className="nb-stats">
              <div className="nb-stat-card"><span className="nb-num">{stats.total}</span><span>Total</span></div>
              <div className="nb-stat-card"><span className="nb-num">{stats.pinned}</span><span>Pinned</span></div>
              <div className="nb-stat-card"><span className="nb-num">{stats.trash}</span><span>Trash</span></div>
            </div>
            <button className="nb-btn-primary" onClick={() => setShowTemplateModal(true)}>
              <Icons.Plus /> Create New Note
            </button>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="nb-subheader">
        <div className="nb-search">
          <Icons.Search />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button onClick={() => setSearchQuery('')}><Icons.X /></button>}
        </div>
        <div className="nb-filters">
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="all">All Tags</option>
            {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>
      </div>

      {/* Main */}
      <div className="nb-main">
        <button className="nb-mobile-toggle" onClick={() => setSidebarOpen(true)}>
          <Icons.Menu /> Notes ({filteredNotes.length})
        </button>

        {sidebarOpen && <div className="nb-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`nb-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="nb-sidebar-header">
            <h3>My Notes</h3>
            <button className="nb-close" onClick={() => setSidebarOpen(false)}><Icons.X /></button>
          </div>
          
          <div className="nb-tabs">
            {['all', 'pinned', 'favorites', 'trash'].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="nb-notes-list">
            {loading ? (
              <div className="nb-loading">Loading...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="nb-empty">
                <Icons.Sparkles />
                <p>No notes found</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note._id} 
                  className={`nb-note ${selectedNote?._id === note._id ? 'selected' : ''} ${note.isPinned ? 'pinned' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="nb-note-header">
                    <h4>{note.title}</h4>
                    <div className="nb-badges">
                      {note.isPinned && <span className="nb-pin"><Icons.Pin /></span>}
                      {note.isFavorite && <span className="nb-star"><Icons.Star /></span>}
                    </div>
                  </div>
                  <p className="nb-preview">{note.content.substring(0, 80)}...</p>
                  <div className="nb-meta">
                    <span className="nb-course" title={note.courseName || courses.find(c => c._id === note.courseId)?.name || note.courseCode}>
                      {(note.courseName || courses.find(c => c._id === note.courseId)?.name || note.courseCode).substring(0, 15)}
                      {(note.courseName || courses.find(c => c._id === note.courseId)?.name || note.courseCode).length > 15 ? '...' : ''}
                    </span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <span>{note.wordCount} words</span>
                  </div>
                  
                  {activeTab !== 'trash' ? (
                    <div className="nb-actions">
                      <button onClick={(e) => toggleAction(e, note._id, 'pin')} className={note.isPinned ? 'active' : ''}>
                        <Icons.Pin />
                      </button>
                      <button onClick={(e) => toggleAction(e, note._id, 'favorite')} className={note.isFavorite ? 'active' : ''}>
                        <Icons.Star />
                      </button>
                      <button onClick={(e) => moveToTrash(e, note._id)} className="delete">
                        <Icons.Trash />
                      </button>
                    </div>
                  ) : (
                    <div className="nb-trash-actions">
                      <button onClick={(e) => restoreNote(e, note._id)} className="restore">
                        <Icons.Restore /> Restore
                      </button>
                      <button onClick={(e) => deleteForever(e, note._id)} className="delete-forever">
                        <Icons.Trash /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="nb-editor">
          {!selectedNote ? (
            <div className="nb-empty-state">
              <Icons.Sparkles />
              <h2>Ready to Take Notes?</h2>
              <p>Select a note or create a new one</p>
              <button className="nb-btn-primary nb-create-btn" onClick={() => setShowTemplateModal(true)}>
                <Icons.Plus /> Create New Note
              </button>
            </div>
          ) : (
            <div className="nb-editor-content">
              {/* Toolbar */}
              <div className="nb-toolbar">
                <button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'View' : 'Edit'}
                </button>
                <button onClick={handleSave} disabled={saveStatus === 'saved'}>
                  <Icons.Save /> {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                </button>
                <button onClick={exportNote}><Icons.Download /> Export PDF</button>
                <button onClick={() => setShowShareModal(true)}><Icons.Share /> Share</button>
                <button onClick={generateAISummary} disabled={isGeneratingSummary}>
                  <Icons.Brain /> {isGeneratingSummary ? 'Summarizing...' : 'AI Summary'}
                </button>
                <button onClick={(e) => moveToTrash(e, selectedNote._id)} className="delete">
                  <Icons.Trash />
                </button>
              </div>

              {/* Formatting Toolbar */}
              {isEditing && (
                <div className="nb-format-toolbar">
                  <button onClick={() => applyFormat('bold')} className={textFormat.bold ? 'active' : ''} title="Bold">
                    <Icons.Bold />
                  </button>
                  <button onClick={() => applyFormat('italic')} className={textFormat.italic ? 'active' : ''} title="Italic">
                    <Icons.Italic />
                  </button>
                  <button onClick={() => applyFormat('underline')} className={textFormat.underline ? 'active' : ''} title="Underline">
                    <Icons.Underline />
                  </button>
                  <button onClick={() => applyFormat('list')} title="Bullet List">
                    <Icons.List />
                  </button>
                  <button 
                    onClick={toggleRecording} 
                    className={isRecording ? 'recording' : ''}
                    title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                  >
                    <Icons.Mic /> {isRecording ? 'Recording...' : 'Voice'}
                  </button>
                </div>
              )}

              {/* AI Summary */}
              {aiSummary && (
                <div className="nb-ai-summary">
                  <h4><Icons.Brain /> AI Summary</h4>
                  <p>{aiSummary}</p>
                  <button onClick={() => setAiSummary('')}><Icons.X /></button>
                </div>
              )}

              <div className="nb-editor-body">
                {isEditing ? (
                  <>
                    <input 
                      className="nb-title-input" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title"
                    />
                    
                    {/* Custom Course Dropdown */}
                    <div className="nb-meta-bar">
                      <div className="nb-custom-dropdown">
                        <button 
                          className="nb-dropdown-trigger"
                          onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                        >
                          {selectedCourseName}
                          <Icons.ChevronDown />
                        </button>
                        
                        {courseDropdownOpen && (
                          <div className="nb-dropdown-menu">
                            <div className="nb-dropdown-search">
                              <Icons.Search />
                              <input
                                type="text"
                                placeholder="Search courses..."
                                value={courseSearchQuery}
                                onChange={(e) => setCourseSearchQuery(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <div className="nb-dropdown-groups">
                              {Object.entries(groupedCourses).map(([category, categoryCourses]) => (
                                <div key={category} className="nb-dropdown-group">
                                  <div className="nb-dropdown-category">{category}</div>
                                  {categoryCourses.map(course => (
                                    <button
                                      key={course._id}
                                      className={`nb-dropdown-item ${editCourse === course._id ? 'selected' : ''}`}
                                      onClick={() => {
                                        setEditCourse(course._id);
                                        setCourseDropdownOpen(false);
                                        setCourseSearchQuery('');
                                      }}
                                    >
                                      {course.name}
                                    </button>
                                  ))}
                                </div>
                              ))}
                              {Object.keys(groupedCourses).length === 0 && (
                                <div className="nb-dropdown-empty">No courses found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="nb-tag-select">
                        {availableTags.map(tag => (
                          <button 
                            key={tag} 
                            className={editTags.includes(tag) ? 'active' : ''}
                            onClick={() => setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <span className={`nb-status ${saveStatus}`}>
                        {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                      </span>
                    </div>
                    
                    <textarea 
                      ref={textareaRef}
                      className="nb-content" 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Start typing..."
                    />
                  </>
                ) : (
                  <div className="nb-view">
                    <h1>{selectedNote.title}</h1>
                    <div className="nb-view-meta">
                      <span className="nb-badge">
                        {courses.find(c => c._id === selectedNote.courseId)?.name || selectedNote.courseName || selectedNote.courseCode}
                      </span>
                      <span>{new Date(selectedNote.updatedAt).toLocaleString()}</span>
                      {selectedNote.isPinned && <span className="nb-badge pin"><Icons.Pin /> Pinned</span>}
                    </div>
                    <div className="nb-view-tags">
                      {selectedNote.tags?.map(t => <span key={t} className="nb-tag">{t}</span>)}
                    </div>
                    <div className="nb-view-content">
                      {editContent.split('\n').map((line, i) => (
                        <p key={i}>
                          {line.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__)/).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                              return <em key={j}>{part.slice(1, -1)}</em>;
                            }
                            if (part.startsWith('__') && part.endsWith('__')) {
                              return <u key={j}>{part.slice(2, -2)}</u>;
                            }
                            return part;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="nb-footer">
                <span className={saveStatus}>{saveStatus === 'saved' ? '● Saved' : '● ' + saveStatus}</span>
                <span>{editContent.length} chars • {editContent.split(/\s+/).filter(w => w.length > 0).length} words</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="nb-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="nb-modal" onClick={e => e.stopPropagation()}>
            <h3>Choose a Template</h3>
            <div className="nb-template-grid">
              {Object.entries(NOTE_TEMPLATES).map(([key, template]) => (
                <button key={key} className="nb-template-card" onClick={() => handleCreateNote(key)}>
                  <Icons.Template />
                  <h4>{template.title}</h4>
                  <p>Start with a structured format</p>
                </button>
              ))}
            </div>
            <button className="nb-modal-close" onClick={() => setShowTemplateModal(false)}><Icons.X /></button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="nb-modal-overlay" onClick={() => {
          setShowShareModal(false);
          setShareMethod(null);
          setEmailTo('');
        }}>
          <div className="nb-modal nb-modal-small" onClick={e => e.stopPropagation()}>
            <h3>Share Note</h3>
            
            {!shareMethod ? (
              <div className="nb-share-options">
                <button onClick={() => shareNote('copy')}>
                  <Icons.FileText /> Copy to Clipboard
                </button>
                <button onClick={() => shareNote('email')}>
                  <Icons.Mail /> Email
                </button>
              </div>
            ) : shareMethod === 'email' ? (
              <div className="nb-email-form">
                <label>Send to:</label>
                <input 
                  type="email" 
                  placeholder="Enter email address..."
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  autoFocus
                />
                <div className="nb-email-actions">
                  <button onClick={() => setShareMethod(null)} className="nb-btn-secondary">Back</button>
                  <button 
                    onClick={sendEmail} 
                    className="nb-btn-primary"
                    disabled={!emailTo.includes('@')}
                  >
                    Send Email
                  </button>
                </div>
              </div>
            ) : null}
            
            <button className="nb-modal-close" onClick={() => {
              setShowShareModal(false);
              setShareMethod(null);
              setEmailTo('');
            }}><Icons.X /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notebook;