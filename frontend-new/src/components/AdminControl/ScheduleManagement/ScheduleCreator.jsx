import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaTrash, FaSave, FaArrowLeft, FaSpinner,
  FaCheckCircle, FaClock, FaCalendarAlt, FaVideo,
  FaLink, FaAlignLeft, FaPalette, FaEye, FaCalendarWeek,
  FaCopy, FaEdit, FaChevronDown, FaChevronUp, FaCalendarDay,
  FaToggleOn, FaToggleOff, FaExpand, FaCompress, FaSync,
  FaExclamationTriangle, FaInfoCircle, FaUndo, FaRedo,
  FaHistory, FaDownload, FaUpload, FaMagic, FaCalculator
} from 'react-icons/fa';
import './ScheduleCreator.css';

// 🔥 CONSTANTS
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATION_OPTIONS = [15, 30, 40, 45, 60, 75, 90, 105, 120, 150, 180];
const COLORS = ['#000B29', '#E30613', '#16a34a', '#3b82f6', '#ca8a04', '#9333ea', '#0891b2', '#be123c'];

const ScheduleCreator = ({ schedule, courses: propCourses, onCancel, onSuccess }) => {
  const isEdit = !!schedule;
  const isWeekEdit = schedule?.isWeekEdit === true;
  
  // 🔥 FIX: Local state for courses if prop is empty
  const [availableCourses, setAvailableCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  
  const [batchMode, setBatchMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [timeErrors, setTimeErrors] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  
  const autoSaveTimeoutRef = useRef(null);
  const isDirtyRef = useRef(false);

  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    day: 'Monday',
    time: '10:00',
    duration: 60,
    type: 'live',
    status: 'upcoming',
    topic: '',
    description: '',
    meetingLink: '',
    recordingUrl: '',
    color: '#000B29',
    instructor: '',
    notifyStudents: true,
    sessionDate: ''
  });

  const [batchData, setBatchData] = useState({
    startDate: '',
    durationWeeks: 4,
    instructor: 'Anas Jutt',
    color: '#000B29',
    autoCalculateDates: true
  });

  const [weeksData, setWeeksData] = useState([
    {
      weekNumber: 1,
      isOpen: true,
      days: [
        { id: 1, day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true, date: '' }
      ]
    }
  ]);

  const [customTimeMode, setCustomTimeMode] = useState({});

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  const getToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('adminToken') ||
           localStorage.getItem('accessToken');
  };

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  // 🔥🔥🔥 CRITICAL FIX: Fetch courses directly if prop is empty
  const fetchCoursesDirectly = async () => {
    setCoursesLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found');
        setCoursesLoading(false);
        return;
      }
      
      const res = await axios.get(`${API_BASE}/courses/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let coursesData = [];
      if (Array.isArray(res.data)) {
        coursesData = res.data;
      } else if (res.data.success && Array.isArray(res.data.courses)) {
        coursesData = res.data.courses;
      } else if (res.data.courses) {
        coursesData = res.data.courses;
      }
      
      // Format courses for dropdown
      const formattedCourses = coursesData.map(c => ({
        _id: c._id,
        title: c.title,
        category: c.category
      }));
      
      setAvailableCourses(formattedCourses);
      console.log('✅ Courses fetched directly:', formattedCourses.length);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      toast.error('Failed to load courses', { style: toastStyle });
      setAvailableCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Use prop courses if provided, otherwise fetch directly
  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      setAvailableCourses(propCourses);
      console.log('✅ Using prop courses:', propCourses.length);
    } else {
      fetchCoursesDirectly();
    }
  }, [propCourses]);

  // 🔥 AUTO-SAVE: Save draft to localStorage
  const saveDraft = useCallback(() => {
    const draft = {
      formData,
      batchData,
      weeksData,
      timestamp: new Date().toISOString(),
      isWeekEdit,
      mode: batchMode ? 'batch' : isEdit ? 'edit' : 'single'
    };
    localStorage.setItem('schedule_draft', JSON.stringify(draft));
    setLastSaved(new Date());
    setAutoSaveStatus('saved');
  }, [formData, batchData, weeksData, isWeekEdit, batchMode, isEdit]);

  const triggerAutoSave = useCallback(() => {
    isDirtyRef.current = true;
    setAutoSaveStatus('saving');
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 3000);
  }, [saveDraft]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('schedule_draft');
    if (savedDraft && !isEdit && !isWeekEdit) {
      try {
        const draft = JSON.parse(savedDraft);
        const hoursSinceSave = (new Date() - new Date(draft.timestamp)) / (1000 * 60 * 60);
        
        if (hoursSinceSave < 24) {
          toast.success('Previous draft restored! Continue where you left off.', {
            style: toastStyle,
            duration: 5000
          });
          
          setFormData(draft.formData);
          setBatchData(draft.batchData);
          setWeeksData(draft.weeksData);
          if (draft.mode === 'batch') setBatchMode(true);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [isEdit, isWeekEdit]);

  const clearDraft = () => {
    localStorage.removeItem('schedule_draft');
    isDirtyRef.current = false;
  };

  const calculateDateForDay = useCallback((startDateStr, weekNumber, dayName) => {
    if (!startDateStr) return '';
    
    const startDate = new Date(startDateStr);
    const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
    
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const currentDayIndex = weekStart.getDay();
    const targetDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    
    let diff = targetDayIndex - currentDayIndex;
    if (diff < 0) diff += 7;
    
    const finalDate = new Date(weekStart);
    finalDate.setDate(weekStart.getDate() + diff);
    
    return finalDate.toISOString().split('T')[0];
  }, []);

  const autoCalculateAllDates = useCallback(() => {
    if (!batchData.startDate || !batchData.autoCalculateDates) return;
    
    setWeeksData(prev => prev.map(week => ({
      ...week,
      days: week.days.map(day => ({
        ...day,
        date: day.enabled ? calculateDateForDay(batchData.startDate, week.weekNumber, day.day) : day.date
      }))
    })));
    
    toast.success('All dates auto-calculated! ✨', { style: toastStyle, duration: 2000 });
  }, [batchData.startDate, batchData.autoCalculateDates, calculateDateForDay]);

  useEffect(() => {
    if (batchMode && batchData.startDate && batchData.autoCalculateDates) {
      autoCalculateAllDates();
    }
  }, [batchData.startDate, batchData.durationWeeks, batchMode, batchData.autoCalculateDates, autoCalculateAllDates]);

  useEffect(() => {
    if (isWeekEdit && schedule?.weekClasses) {
      initializeWeekEdit();
    } else if (isEdit && !isWeekEdit) {
      setFormData({
        title: schedule.title || '',
        courseId: schedule.courseId?._id || schedule.courseId || '',
        day: schedule.day || 'Monday',
        time: schedule.time || '10:00',
        duration: schedule.duration || 60,
        type: schedule.type || 'live',
        status: schedule.status || 'upcoming',
        topic: schedule.topic || '',
        description: schedule.description || '',
        meetingLink: schedule.meetingLink || '',
        recordingUrl: schedule.recordingUrl || '',
        color: schedule.color || '#000B29',
        instructor: schedule.instructor || '',
        notifyStudents: schedule.notifyStudents !== false,
        sessionDate: schedule.sessionDate ? new Date(schedule.sessionDate).toISOString().split('T')[0] : ''
      });
    }
  }, [isEdit, isWeekEdit, schedule]);

  const initializeWeekEdit = () => {
    const weekClasses = schedule.weekClasses || [];
    const weekNumber = schedule.weekNumber || 1;
    const courseId = schedule.courseId?._id || schedule.courseId || '';

    setExistingSchedules(weekClasses);

    const daysData = weekClasses.map((s, idx) => ({
      id: s._id || `temp-${Date.now()}-${idx}`,
      day: s.day || 'Monday',
      time: s.time || '10:00',
      duration: s.duration || 60,
      type: s.type || 'live',
      topic: s.topic || s.title?.replace(`Week ${weekNumber} - `, '') || '',
      enabled: true,
      date: s.sessionDate ? new Date(s.sessionDate).toISOString().split('T')[0] : '',
      _isExisting: !!s._id,
      _originalId: s._id
    }));

    setWeeksData([{
      weekNumber: weekNumber,
      isOpen: true,
      days: daysData.length > 0 ? daysData : [
        { id: Date.now(), day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true, date: '' }
      ]
    }]);

    if (weekClasses.length > 0) {
      const firstClass = weekClasses[0];
      setFormData(prev => ({
        ...prev,
        courseId: courseId,
        color: firstClass.color || '#000B29',
        instructor: firstClass.instructor || ''
      }));
      setBatchData(prev => ({
        ...prev,
        color: firstClass.color || '#000B29',
        instructor: firstClass.instructor || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, courseId }));
    }
  };

  useEffect(() => {
    if (isWeekEdit || isEdit) return;
    
    const totalWeeks = parseInt(batchData.durationWeeks) || 4;
    setWeeksData(prev => {
      const newWeeks = [];
      for (let i = 1; i <= totalWeeks; i++) {
        const existingWeek = prev.find(w => w.weekNumber === i);
        if (existingWeek) {
          newWeeks.push(existingWeek);
        } else {
          const prevWeek = newWeeks[i - 2];
          newWeeks.push({
            weekNumber: i,
            isOpen: i === 1,
            days: prevWeek ? 
              prevWeek.days.map((d, idx) => ({ 
                ...d, 
                id: `temp-${Date.now()}-${i}-${idx}`,
                topic: '',
                date: batchData.autoCalculateDates ? calculateDateForDay(batchData.startDate, i, d.day) : ''
              })) :
              [{ id: `temp-${Date.now()}-${i}-0`, day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true, date: batchData.autoCalculateDates ? calculateDateForDay(batchData.startDate, i, 'Monday') : '' }]
          });
        }
      }
      return newWeeks;
    });
  }, [batchData.durationWeeks, isWeekEdit, isEdit, batchData.startDate, batchData.autoCalculateDates, calculateDateForDay]);

  const checkConflicts = async (courseId, sessionDate, time, duration, excludeId = null) => {
    if (!courseId || !sessionDate || !time) return [];
    
    try {
      const res = await adminAPI.checkScheduleConflict({
        courseId,
        sessionDate,
        time,
        duration: parseInt(duration) || 60,
        excludeId
      });
      return res.data?.conflicts || [];
    } catch (err) {
      console.error('Conflict check error:', err);
      return [];
    }
  };

  const validateTime = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  const toggleWeek = (weekNum) => {
    setWeeksData(prev => prev.map(w => 
      w.weekNumber === weekNum ? { ...w, isOpen: !w.isOpen } : w
    ));
    triggerAutoSave();
  };

  const toggleAllWeeks = () => {
    setWeeksData(prev => prev.map(w => ({ ...w, isOpen: !allExpanded })));
    setAllExpanded(!allExpanded);
    triggerAutoSave();
  };

  const addDayToWeek = (weekIndex) => {
    const newWeeks = [...weeksData];
    const week = newWeeks[weekIndex];
    
    const usedDays = week.days.filter(d => d.enabled).map(d => d.day);
    const availableDay = DAYS_OF_WEEK.find(d => !usedDays.includes(d)) || 'Monday';
    
    const newDay = {
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day: availableDay,
      time: week.days[0]?.time || '10:00',
      duration: week.days[0]?.duration || 60,
      type: 'live',
      topic: '',
      enabled: true,
      date: batchData.autoCalculateDates && batchData.startDate 
        ? calculateDateForDay(batchData.startDate, week.weekNumber, availableDay)
        : '',
      _isExisting: false,
      _originalId: null
    };
    
    week.days.push(newDay);
    setWeeksData(newWeeks);
    triggerAutoSave();
    
    toast.success(`New day added to Week ${week.weekNumber}!`, { 
      style: toastStyle,
      duration: 2000 
    });
  };

  const removeDayFromWeek = (weekIndex, dayId) => {
    const newWeeks = [...weeksData];
    const week = newWeeks[weekIndex];
    
    const enabledDays = week.days.filter(d => d.enabled);
    if (enabledDays.length <= 1 && week.days.find(d => d.id === dayId)?.enabled) {
      toast.error('Each week must have at least one active day', { style: toastStyle });
      return;
    }

    const dayToRemove = week.days.find(d => d.id === dayId);
    
    if (dayToRemove?._isExisting) {
      if (!window.confirm(`This will delete "${dayToRemove.topic || 'this class'}" permanently. Continue?`)) {
        return;
      }
    }
    
    week.days = week.days.filter(d => d.id !== dayId);
    setWeeksData(newWeeks);
    triggerAutoSave();
    
    toast.success('Day removed', { style: toastStyle, duration: 2000 });
  };

  const updateDayField = async (weekIndex, dayId, field, value) => {
    const newWeeks = [...weeksData];
    const day = newWeeks[weekIndex].days.find(d => d.id === dayId);
    if (day) {
      day[field] = value;
      
      if (field === 'day' && batchData.autoCalculateDates && batchData.startDate && day.enabled) {
        day.date = calculateDateForDay(batchData.startDate, newWeeks[weekIndex].weekNumber, value);
      }
      
      if ((field === 'time' || field === 'date') && day.enabled && formData.courseId) {
        if (validateTime(day.time) && day.date) {
          const conflicts = await checkConflicts(
            formData.courseId,
            day.date,
            day.time,
            day.duration,
            day._originalId
          );
          
          if (conflicts.length > 0) {
            setTimeErrors(prev => ({
              ...prev,
              [dayId]: `Conflict: ${conflicts.map(c => c.title).join(', ')}`
            }));
          } else {
            setTimeErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[dayId];
              return newErrors;
            });
          }
        }
      }
    }
    setWeeksData(newWeeks);
    triggerAutoSave();
  };

  const toggleDayEnabled = (weekIndex, dayId) => {
    const newWeeks = [...weeksData];
    const day = newWeeks[weekIndex].days.find(d => d.id === dayId);
    if (day) {
      const enabledDays = newWeeks[weekIndex].days.filter(d => d.enabled);
      if (enabledDays.length <= 1 && day.enabled) {
        toast.error('At least one day must be active', { style: toastStyle });
        return;
      }
      
      day.enabled = !day.enabled;
      
      if (day.enabled && batchData.autoCalculateDates && batchData.startDate) {
        day.date = calculateDateForDay(batchData.startDate, newWeeks[weekIndex].weekNumber, day.day);
      }
    }
    setWeeksData(newWeeks);
    triggerAutoSave();
  };

  const copyPatternToAllWeeks = () => {
    const firstWeek = weeksData[0];
    const newWeeks = weeksData.map((week, idx) => {
      if (idx === 0) return week;
      return {
        ...week,
        days: firstWeek.days.map((day, dayIdx) => ({
          ...day,
          id: `temp-${Date.now()}-${idx}-${dayIdx}`,
          topic: week.days[dayIdx]?.topic || '',
          date: batchData.autoCalculateDates && batchData.startDate
            ? calculateDateForDay(batchData.startDate, week.weekNumber, day.day)
            : (week.days[dayIdx]?.date || ''),
          _isExisting: false,
          _originalId: null
        }))
      };
    });
    setWeeksData(newWeeks);
    triggerAutoSave();
    toast.success('Pattern copied to all weeks!', { style: toastStyle });
  };

  const addWeekToBatch = () => {
    const newWeekNumber = weeksData.length + 1;
    const lastWeek = weeksData[weeksData.length - 1];
    
    setWeeksData(prev => [...prev, {
      weekNumber: newWeekNumber,
      isOpen: true,
      days: lastWeek ? 
        lastWeek.days.map((d, idx) => ({
          ...d,
          id: `temp-${Date.now()}-${newWeekNumber}-${idx}`,
          topic: '',
          date: batchData.autoCalculateDates && batchData.startDate
            ? calculateDateForDay(batchData.startDate, newWeekNumber, d.day)
            : '',
          _isExisting: false,
          _originalId: null
        })) :
        [{ id: `temp-${Date.now()}-${newWeekNumber}-0`, day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true, date: batchData.autoCalculateDates && batchData.startDate ? calculateDateForDay(batchData.startDate, newWeekNumber, 'Monday') : '' }]
    }]);
    
    triggerAutoSave();
    toast.success(`Week ${newWeekNumber} added!`, { style: toastStyle });
  };

  const removeWeekFromBatch = (weekIndex) => {
    if (weeksData.length <= 1) {
      toast.error('At least one week is required', { style: toastStyle });
      return;
    }
    
    const week = weeksData[weekIndex];
    const hasExisting = week.days.some(d => d._isExisting);
    
    if (hasExisting) {
      if (!window.confirm('This week has saved classes. Are you sure you want to remove it?')) {
        return;
      }
    }
    
    setWeeksData(prev => {
      const newWeeks = prev.filter((_, idx) => idx !== weekIndex);
      return newWeeks.map((w, idx) => ({ ...w, weekNumber: idx + 1 }));
    });
    
    triggerAutoSave();
    toast.success('Week removed', { style: toastStyle });
  };

  const generatePreview = () => {
    if (!formData.courseId || !batchData.startDate) {
      toast.error('Please select course and start date', { style: toastStyle });
      return;
    }
    setPreviewMode(true);
  };

  const handleEditWeekSubmit = async () => {
    if (!formData.courseId) {
      toast.error('Course not found', { style: toastStyle });
      return;
    }

    const week = weeksData[0];
    const validDays = week.days.filter(d => d.enabled && d.topic.trim() && d.date);
    
    if (validDays.length === 0) {
      toast.error('Please add at least one day with topic and date', { style: toastStyle });
      return;
    }

    const hasErrors = validDays.some(d => timeErrors[d.id]);
    if (hasErrors) {
      toast.error('Please resolve time conflicts before saving', { style: toastStyle });
      return;
    }

    setLoading(true);
    const loadId = toast.loading('Updating week schedule...', { style: toastStyle });

    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < validDays.length; i++) {
        const dayData = validDays[i];
        
        const scheduleData = {
          title: `Week ${week.weekNumber} - ${dayData.topic}`,
          courseId: formData.courseId,
          weekNumber: week.weekNumber,
          sessionNumber: i + 1,
          day: dayData.day,
          time: dayData.time,
          duration: parseInt(dayData.duration) || 60,
          type: dayData.type,
          status: 'upcoming',
          topic: dayData.topic,
          description: `${dayData.topic} - Week ${week.weekNumber} ${dayData.day} class`,
          color: batchData.color,
          instructor: batchData.instructor,
          notifyStudents: formData.notifyStudents,
          sessionDate: new Date(dayData.date)
        };

        try {
          let res;
          if (dayData._isExisting && dayData._originalId) {
            res = await adminAPI.updateSchedule(dayData._originalId, scheduleData);
            results.push({ type: 'updated', data: res.data, id: dayData._originalId });
          } else {
            res = await adminAPI.createSchedule(scheduleData);
            results.push({ type: 'created', data: res.data });
          }
        } catch (err) {
          console.error(`Error processing day ${dayData.day}:`, err);
          errors.push({ 
            day: dayData.day, 
            error: err.response?.data?.error || err.message 
          });
        }
      }

      const currentOriginalIds = validDays
        .filter(d => d._isExisting && d._originalId)
        .map(d => d._originalId);
      
      const removedSchedules = existingSchedules.filter(
        s => s._id && !currentOriginalIds.includes(s._id)
      );
      
      for (const removed of removedSchedules) {
        try {
          await adminAPI.deleteSchedule(removed._id);
          results.push({ type: 'deleted', id: removed._id });
        } catch (err) {
          console.error(`Error deleting schedule ${removed._id}:`, err);
        }
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} operations failed. Check console.`, { 
          id: loadId, 
          style: toastStyle,
          duration: 5000
        });
      } else {
        const created = results.filter(r => r.type === 'created').length;
        const updated = results.filter(r => r.type === 'updated').length;
        const deleted = results.filter(r => r.type === 'deleted').length;
        
        toast.success(
          `Week ${week.weekNumber} updated! ${created} new, ${updated} updated${deleted > 0 ? `, ${deleted} removed` : ''}`, 
          { id: loadId, style: toastStyle }
        );
        
        clearDraft();
        onSuccess();
      }
    } catch (err) {
      console.error('Edit week error:', err);
      toast.error(err.message || 'Failed to update week', { id: loadId, style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!formData.courseId || !batchData.startDate) {
      toast.error('Please fill all required fields', { style: toastStyle });
      return;
    }

    const hasErrors = Object.keys(timeErrors).length > 0;
    if (hasErrors) {
      toast.error('Please resolve time conflicts before saving', { style: toastStyle });
      return;
    }

    setLoading(true);
    const loadId = toast.loading('Creating batch schedule...', { style: toastStyle });

    try {
      const allSchedules = [];
      
      weeksData.forEach((week) => {
        week.days.forEach((dayData, dayIndex) => {
          if (!dayData.enabled || !dayData.topic.trim()) return;
          
          const sessionDate = dayData.date 
            ? new Date(dayData.date)
            : calculateDateForDay(batchData.startDate, week.weekNumber, dayData.day);
          
          allSchedules.push({
            title: `Week ${week.weekNumber} - ${dayData.topic}`,
            courseId: formData.courseId,
            weekNumber: week.weekNumber,
            sessionNumber: dayIndex + 1,
            day: dayData.day,
            time: dayData.time,
            duration: parseInt(dayData.duration) || 60,
            type: dayData.type,
            status: 'upcoming',
            topic: dayData.topic,
            description: `${dayData.topic} - Week ${week.weekNumber} ${dayData.day} class`,
            meetingLink: '',
            showLinkBeforeMinutes: 15,
            color: batchData.color,
            instructor: batchData.instructor,
            notifyStudents: formData.notifyStudents,
            sessionDate: sessionDate
          });
        });
      });

      if (allSchedules.length === 0) {
        toast.error('Please add at least one class with topic', { id: loadId, style: toastStyle });
        setLoading(false);
        return;
      }

      const response = await adminAPI.createBatchSchedule({
        courseId: formData.courseId,
        startDate: batchData.startDate,
        durationWeeks: parseInt(batchData.durationWeeks),
        schedules: allSchedules,
        instructor: batchData.instructor,
        color: batchData.color,
        notifyStudents: formData.notifyStudents
      });
      
      if (response.data.success) {
        toast.success(
          `${allSchedules.length} schedules created successfully!`, 
          { id: loadId, style: toastStyle }
        );
        clearDraft();
        onSuccess();
      }
    } catch (err) {
      console.error('Batch create error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create schedules';
      toast.error(errorMsg, { id: loadId, style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter schedule title', { style: toastStyle });
      return;
    }

    if (!formData.courseId) {
      toast.error('Please select a course', { style: toastStyle });
      return;
    }

    if (!formData.sessionDate) {
      toast.error('Please select a date for this class', { style: toastStyle });
      return;
    }

    if (!validateTime(formData.time)) {
      toast.error('Please enter valid time (HH:MM format)', { style: toastStyle });
      return;
    }

    const conflicts = await checkConflicts(
      formData.courseId,
      formData.sessionDate,
      formData.time,
      formData.duration,
      isEdit ? schedule._id : null
    );

    if (conflicts.length > 0) {
      const conflictMsg = conflicts.map(c => `${c.title} at ${c.time}`).join(', ');
      if (!window.confirm(`Time conflict detected with: ${conflictMsg}\n\nSave anyway?`)) {
        return;
      }
    }

    const finalData = {
      ...formData,
      title: formData.title.trim(),
      topic: formData.topic.trim(),
      duration: parseInt(formData.duration) || 60,
      notifyStudents: formData.notifyStudents,
      sessionDate: new Date(formData.sessionDate)
    };

    setLoading(true);
    const loadId = toast.loading(isEdit ? 'Updating...' : 'Creating...', { style: toastStyle });

    try {
      let response;
      
      if (isEdit) {
        response = await adminAPI.updateSchedule(schedule._id, finalData);
      } else {
        response = await adminAPI.createSchedule(finalData);
      }

      if (response.data.success) {
        toast.success(
          isEdit ? 'Schedule updated!' : 'Schedule created successfully!', 
          { id: loadId, style: toastStyle }
        );
        clearDraft();
        onSuccess();
      }
    } catch (err) {
      console.error('Schedule save error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save schedule';
      toast.error(errorMsg, { id: loadId, style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isWeekEdit) {
      await handleEditWeekSubmit();
      return;
    }
    
    if (batchMode) {
      await handleBatchSubmit();
      return;
    }

    await handleSingleSubmit(e);
  };

  const handleTimeChange = (weekIndex, dayId, value, isCustom = false) => {
    if (isCustom) {
      updateDayField(weekIndex, dayId, 'time', value);
    } else {
      updateDayField(weekIndex, dayId, 'time', value);
    }
  };

  const selectedCourse = availableCourses.find(c => c._id === formData.courseId);

  // Preview Mode
  if (previewMode) {
    const previewData = [];
    
    weeksData.forEach((week) => {
      const weekSessions = [];
      week.days.forEach((dayData) => {
        if (!dayData.enabled || !dayData.topic.trim()) return;
        const sessionDate = dayData.date 
          ? new Date(dayData.date)
          : calculateDateForDay(batchData.startDate, week.weekNumber, dayData.day);
        weekSessions.push({
          date: sessionDate,
          day: dayData.day,
          time: dayData.time,
          title: `Week ${week.weekNumber} - ${dayData.topic}`,
          topic: dayData.topic,
          type: dayData.type,
          duration: dayData.duration
        });
      });
      if (weekSessions.length > 0) {
        previewData.push({ weekNumber: week.weekNumber, sessions: weekSessions });
      }
    });
    
    const totalSessions = previewData.reduce((acc, week) => acc + week.sessions.length, 0);
    
    return (
      <div className="form-container">
        <div className="form-header">
          <h2><FaEye /> Schedule Preview</h2>
          <div className="header-actions">
            <button className="btn-back" onClick={() => setPreviewMode(false)}>
              <FaArrowLeft /> Back to Edit
            </button>
          </div>
        </div>

        <div className="preview-summary">
          <div className="preview-stat">
            <span className="stat-value">{weeksData.length}</span>
            <span className="stat-label">Weeks</span>
          </div>
          <div className="preview-stat">
            <span className="stat-value">{totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
          <div className="preview-stat">
            <span className="stat-value">{Math.round(totalSessions / weeksData.length)}x</span>
            <span className="stat-label">Avg Classes/Week</span>
          </div>
        </div>

        <div className="preview-weeks-container">
          {previewData.map((week) => (
            <div key={week.weekNumber} className="preview-week-card">
              <div className="week-header">
                <FaCalendarWeek />
                <h4>Week {week.weekNumber}</h4>
                <span className="week-range">{week.sessions.length} Classes</span>
              </div>
              <div className="week-sessions">
                {week.sessions.map((session, idx) => (
                  <div key={idx} className="preview-session-item">
                    <div className="session-date-box">
                      <span className="day-name">{session.day.substr(0, 3)}</span>
                      <span className="day-date">{session.date.getDate()}</span>
                    </div>
                    <div className="session-info">
                      <h5>{session.title}</h5>
                      <span className="session-time">
                        <FaClock /> {session.time} • {session.duration}min • {session.type === 'live' ? '🔴 Live' : '📹 Recorded'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={() => setPreviewMode(false)}>
            Back to Edit
          </button>
          <button 
            className="btn-submit"
            onClick={handleBatchSubmit}
            disabled={loading}
          >
            {loading ? <FaSpinner className="spin" /> : <FaCheckCircle />}
            Confirm & Create {totalSessions} Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="autosave-bar">
        <div className="autosave-status">
          {autoSaveStatus === 'saving' && <><FaSpinner className="spin" /> Saving draft...</>}
          {autoSaveStatus === 'saved' && lastSaved && <><FaCheckCircle /> Auto-saved {lastSaved.toLocaleTimeString()}</>}
        </div>
        {!isEdit && !isWeekEdit && (
          <button 
            className="btn-clear-draft" 
            onClick={() => {
              localStorage.removeItem('schedule_draft');
              window.location.reload();
            }}
          >
            <FaUndo /> Reset Form
          </button>
        )}
      </div>

      <div className="form-header">
        <h2>
          {isWeekEdit ? <FaEdit /> : isEdit ? <FaCheckCircle /> : batchMode ? <FaCalendarWeek /> : <FaPlus />}
          {isWeekEdit ? ` Edit Week ${schedule?.weekNumber}` : isEdit ? ' Edit Schedule' : batchMode ? ' Batch Schedule Creator' : ' Create New Schedule'}
        </h2>
        <button className="btn-back" onClick={onCancel}>
          <FaArrowLeft /> Back
        </button>
      </div>

      {!isEdit && !isWeekEdit && (
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${!batchMode ? 'active' : ''}`}
            onClick={() => setBatchMode(false)}
          >
            <FaPlus /> Single Schedule
          </button>
          <button 
            className={`mode-btn ${batchMode ? 'active' : ''}`}
            onClick={() => setBatchMode(true)}
          >
            <FaCalendarWeek /> Batch Create (Week-wise)
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="schedule-form">
        <div className="form-section">
          <h3><FaCalendarAlt /> {batchMode || isWeekEdit ? 'Course Information' : 'Basic Information'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Select Course *</label>
              {coursesLoading ? (
                <div className="loading-field"><FaSpinner className="spin" /> Loading courses...</div>
              ) : availableCourses.length === 0 ? (
                <div className="error-field"><FaExclamationTriangle /> No courses available. Please add a course first.</div>
              ) : (
                <select
                  value={formData.courseId}
                  onChange={(e) => {
                    setFormData({...formData, courseId: e.target.value});
                    triggerAutoSave();
                  }}
                  required
                  disabled={isWeekEdit}
                >
                  <option value="">-- Select Course --</option>
                  {availableCourses.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.title} {c.category ? `(${c.category})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedCourse && (
                <small className="course-hint">📚 {selectedCourse.title}</small>
              )}
            </div>

            {batchMode ? (
              <>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={batchData.startDate}
                    onChange={(e) => {
                      setBatchData({...batchData, startDate: e.target.value});
                      triggerAutoSave();
                    }}
                    required
                  />
                  <small className="course-hint">All dates will auto-calculate from this date</small>
                </div>
                <div className="form-group">
                  <label>Duration (Weeks) *</label>
                  <select
                    value={batchData.durationWeeks}
                    onChange={(e) => {
                      setBatchData({...batchData, durationWeeks: parseInt(e.target.value)});
                      triggerAutoSave();
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(w => (
                      <option key={w} value={w}>{w} Weeks</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={batchData.autoCalculateDates}
                      onChange={(e) => {
                        setBatchData({...batchData, autoCalculateDates: e.target.checked});
                        if (e.target.checked && batchData.startDate) {
                          autoCalculateAllDates();
                        }
                        triggerAutoSave();
                      }}
                    />
                    <span><FaMagic /> Auto-calculate all dates</span>
                  </label>
                  <small className="course-hint">Automatically set dates based on start date</small>
                </div>
              </>
            ) : isWeekEdit ? (
              <>
                <div className="form-group">
                  <label>Week Number</label>
                  <input
                    type="text"
                    value={`Week ${schedule?.weekNumber}`}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Total Days</label>
                  <input
                    type="text"
                    value={`${weeksData[0]?.days?.length || 0} days configured`}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Schedule Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({...formData, title: e.target.value});
                      triggerAutoSave();
                    }}
                    placeholder="e.g., Week 1 - Introduction"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Topic *</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => {
                      setFormData({...formData, topic: e.target.value});
                      triggerAutoSave();
                    }}
                    placeholder="e.g., React Basics"
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rest of your existing JSX remains the same... */}
        {/* Single Schedule Date & Time Section */}
        {!batchMode && !isWeekEdit && (
          <div className="form-section">
            <h3><FaCalendarAlt /> Date & Time</h3>
            <div className="form-grid three-col">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => {
                    setFormData({...formData, sessionDate: e.target.value});
                    triggerAutoSave();
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <div className="time-input-wrapper">
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({...formData, time: e.target.value});
                      triggerAutoSave();
                    }}
                    required
                    className="custom-time-input"
                  />
                </div>
                <small className="course-hint">24-hour format</small>
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => {
                    setFormData({...formData, duration: parseInt(e.target.value)});
                    triggerAutoSave();
                  }}
                >
                  {DURATION_OPTIONS.map(d => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
              </div>
            </div>
            
            {conflicts.length > 0 && (
              <div className="conflict-warning">
                <FaExclamationTriangle />
                <span>Time conflict detected with: {conflicts.map(c => c.title).join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Week-wise Schedule Section */}
        {(batchMode || isWeekEdit) && (
          <div className="form-section week-schedule-section">
            <div className="section-header-with-action">
              <div className="header-title-group">
                <h3><FaCalendarWeek /> {isWeekEdit ? 'Edit Week Days' : 'Week-wise Class Schedule'}</h3>
                <p className="section-description">
                  {isWeekEdit 
                    ? 'Add, remove, or modify days for this week. Click "Add Another Day" to add more classes.'
                    : 'Configure each week. Dates auto-calculate based on start date. Add days as needed.'
                  }
                </p>
              </div>
              <div className="section-actions">
                {!isWeekEdit && (
                  <>
                    <button type="button" className="btn-icon-text" onClick={toggleAllWeeks}>
                      {allExpanded ? <><FaCompress /> Collapse All</> : <><FaExpand /> Expand All</>}
                    </button>
                    <button 
                      type="button" 
                      className="btn-copy-pattern" 
                      onClick={copyPatternToAllWeeks}
                    >
                      <FaCopy /> Copy Pattern
                    </button>
                    <button 
                      type="button" 
                      className="btn-add-week" 
                      onClick={addWeekToBatch}
                    >
                      <FaPlus /> Add Week
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="weeks-container">
              {weeksData.map((week, weekIndex) => (
                <div key={week.weekNumber} className={`week-box ${week.isOpen ? 'open' : ''}`}>
                  <div 
                    className="week-header-bar"
                    onClick={() => toggleWeek(week.weekNumber)}
                  >
                    <div className="week-header-main">
                      <div className="week-number-box">
                        <FaCalendarAlt />
                        <span>Week {week.weekNumber}</span>
                      </div>
                      <div className="week-stats">
                        <span className="configured-count">
                          {week.days.filter(d => d.enabled && d.topic.trim() && d.date).length} of {week.days.length} configured
                        </span>
                      </div>
                    </div>
                    <div className="week-header-actions">
                      {!isWeekEdit && weeksData.length > 1 && (
                        <button
                          type="button"
                          className="btn-delete-week"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWeekFromBatch(weekIndex);
                          }}
                          title="Remove this week"
                        >
                          <FaTrash />
                        </button>
                      )}
                      <span className="days-count-badge">
                        {week.days.filter(d => d.enabled).length} days
                      </span>
                      <div className="expand-icon">
                        {week.isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                  </div>

                  {week.isOpen && (
                    <div className="week-content">
                      <div className="days-table">
                        <div className="table-header">
                          <div className="th-status">Status</div>
                          <div className="th-day">Day</div>
                          <div className="th-date">Date *</div>
                          <div className="th-time">Time *</div>
                          <div className="th-duration">Duration</div>
                          <div className="th-type">Type</div>
                          <div className="th-topic">Topic *</div>
                          <div className="th-delete"></div>
                        </div>

                        <div className="table-body">
                          {week.days.map((dayData) => (
                            <div key={dayData.id} className={`table-row ${!dayData.enabled ? 'disabled' : ''} ${dayData._isExisting ? 'existing' : 'new'} ${timeErrors[dayData.id] ? 'has-error' : ''}`}>
                              <div className="td-status">
                                <button
                                  type="button"
                                  className={`status-toggle ${dayData.enabled ? 'active' : 'inactive'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDayEnabled(weekIndex, dayData.id);
                                  }}
                                >
                                  {dayData.enabled ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                              </div>
                              
                              <div className="td-day">
                                <select
                                  value={dayData.day}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'day', e.target.value)}
                                  disabled={!dayData.enabled}
                                >
                                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              
                              <div className="td-date">
                                <input
                                  type="date"
                                  value={dayData.date}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'date', e.target.value)}
                                  disabled={!dayData.enabled}
                                  className={!dayData.date && dayData.enabled ? 'required-field' : ''}
                                />
                              </div>
                              
                              <div className="td-time">
                                <div className="custom-time-wrapper">
                                  <input
                                    type="time"
                                    value={dayData.time}
                                    onChange={(e) => handleTimeChange(weekIndex, dayData.id, e.target.value)}
                                    disabled={!dayData.enabled}
                                    className="time-input"
                                  />
                                </div>
                                {timeErrors[dayData.id] && (
                                  <div className="error-tooltip">
                                    <FaExclamationTriangle />
                                    {timeErrors[dayData.id]}
                                  </div>
                                )}
                              </div>
                              
                              <div className="td-duration">
                                <select
                                  value={dayData.duration}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'duration', parseInt(e.target.value))}
                                  disabled={!dayData.enabled}
                                >
                                  {DURATION_OPTIONS.map(d => (
                                    <option key={d} value={d}>{d} min</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="td-type">
                                <select
                                  value={dayData.type}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'type', e.target.value)}
                                  disabled={!dayData.enabled}
                                  className={dayData.type}
                                >
                                  <option value="live">🔴 Live</option>
                                  <option value="recorded">📹 Recorded</option>
                                </select>
                              </div>
                              
                              <div className="td-topic">
                                <input
                                  type="text"
                                  value={dayData.topic}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'topic', e.target.value)}
                                  placeholder={`Topic for Week ${week.weekNumber}`}
                                  disabled={!dayData.enabled}
                                  className={!dayData.topic && dayData.enabled ? 'required-field' : ''}
                                />
                              </div>
                              
                              <div className="td-delete">
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDayFromWeek(weekIndex, dayData.id);
                                  }}
                                  title="Remove this day"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-add-day"
                        onClick={() => addDayToWeek(weekIndex)}
                      >
                        <FaPlus /> Add Another Day to Week {week.weekNumber}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3><FaPalette /> {batchMode || isWeekEdit ? 'Instructor & Settings' : 'Settings'}</h3>
          <div className="form-grid">
            {(batchMode || isWeekEdit) && (
              <div className="form-group">
                <label>Instructor Name</label>
                <input
                  type="text"
                  value={batchData.instructor}
                  onChange={(e) => {
                    setBatchData({...batchData, instructor: e.target.value});
                    triggerAutoSave();
                  }}
                  placeholder="e.g., Anas Jutt"
                />
              </div>
            )}
            <div className="form-group">
              <label>Schedule Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-option ${(batchMode || isWeekEdit ? batchData.color : formData.color) === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      if (batchMode || isWeekEdit) {
                        setBatchData({...batchData, color: c});
                      } else {
                        setFormData({...formData, color: c});
                      }
                      triggerAutoSave();
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifyStudents}
                  onChange={(e) => {
                    setFormData({...formData, notifyStudents: e.target.checked});
                    triggerAutoSave();
                  }}
                />
                <span>Notify students via email</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          {batchMode && !isWeekEdit ? (
            <button 
              type="button" 
              className="btn-preview"
              onClick={generatePreview}
              disabled={!formData.courseId || !batchData.startDate}
            >
              <FaEye /> Preview Schedule
            </button>
          ) : (
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <FaSpinner className="spin" /> : isWeekEdit ? <FaSync /> : isEdit ? <FaSave /> : <FaPlus />}
              {isWeekEdit ? 'Update Week' : isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ScheduleCreator;