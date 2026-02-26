import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaTrash, FaSave, FaArrowLeft, FaSpinner,
  FaCheckCircle, FaClock, FaCalendarAlt, FaVideo,
  FaLink, FaAlignLeft, FaPalette, FaEye, FaCalendarWeek,
  FaCopy, FaEdit, FaChevronDown, FaChevronUp, FaCalendarDay,
  FaToggleOn, FaToggleOff, FaExpand, FaCompress
} from 'react-icons/fa';
import './ScheduleCreator.css';

const ScheduleCreator = ({ schedule, courses, onCancel, onSuccess }) => {
  const isEdit = !!schedule;
  
  const [batchMode, setBatchMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
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
    notifyStudents: true
  });

  const [batchData, setBatchData] = useState({
    startDate: '',
    durationWeeks: 4, // Default 4 weeks
    instructor: 'Anas Jutt',
    color: '#000B29'
  });

  // Week-wise structure
  const [weeksData, setWeeksData] = useState([
    {
      weekNumber: 1,
      isOpen: true,
      days: [
        { id: 1, day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true },
        { id: 2, day: 'Wednesday', time: '14:00', duration: 60, type: 'live', topic: '', enabled: true }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const colors = [
    '#000B29', '#E30613', '#16a34a', '#3b82f6', 
    '#ca8a04', '#9333ea', '#0891b2', '#be123c'
  ];

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  useEffect(() => {
    if (isEdit && schedule) {
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
        notifyStudents: schedule.notifyStudents !== false
      });
    }
  }, [isEdit, schedule]);

  // Generate weeks when duration changes
  useEffect(() => {
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
            isOpen: false, // Closed by default for new weeks
            days: prevWeek ? 
              prevWeek.days.map((d, idx) => ({ 
                ...d, 
                id: Date.now() + idx + i * 100,
                topic: '' 
              })) :
              [{ id: Date.now() + i, day: 'Monday', time: '10:00', duration: 60, type: 'live', topic: '', enabled: true }]
          });
        }
      }
      return newWeeks;
    });
  }, [batchData.durationWeeks]);

  // Toggle single week
  const toggleWeek = (weekNum) => {
    setWeeksData(prev => prev.map(w => 
      w.weekNumber === weekNum ? { ...w, isOpen: !w.isOpen } : w
    ));
  };

  // Expand/Collapse all
  const toggleAllWeeks = () => {
    setWeeksData(prev => prev.map(w => ({ ...w, isOpen: !allExpanded })));
    setAllExpanded(!allExpanded);
  };

  // Add day to week
  const addDayToWeek = (weekIndex) => {
    const newWeeks = [...weeksData];
    const week = newWeeks[weekIndex];
    const usedDays = week.days.map(d => d.day);
    const availableDay = days.find(d => !usedDays.includes(d)) || days[0];
    
    week.days.push({
      id: Date.now(),
      day: availableDay,
      time: '10:00',
      duration: 60,
      type: 'live',
      topic: '',
      enabled: true
    });
    setWeeksData(newWeeks);
  };

  // Remove day from week
  const removeDayFromWeek = (weekIndex, dayId) => {
    const newWeeks = [...weeksData];
    if (newWeeks[weekIndex].days.length <= 1) {
      toast.error('Each week must have at least one day', { style: toastStyle });
      return;
    }
    newWeeks[weekIndex].days = newWeeks[weekIndex].days.filter(d => d.id !== dayId);
    setWeeksData(newWeeks);
  };

  // Update day field
  const updateDayField = (weekIndex, dayId, field, value) => {
    const newWeeks = [...weeksData];
    const day = newWeeks[weekIndex].days.find(d => d.id === dayId);
    if (day) {
      day[field] = value;
    }
    setWeeksData(newWeeks);
  };

  // Toggle day enabled
  const toggleDayEnabled = (weekIndex, dayId) => {
    const newWeeks = [...weeksData];
    const day = newWeeks[weekIndex].days.find(d => d.id === dayId);
    if (day) {
      day.enabled = !day.enabled;
    }
    setWeeksData(newWeeks);
  };

  // Copy Week 1 pattern to all weeks
  const copyPatternToAllWeeks = () => {
    const firstWeek = weeksData[0];
    const newWeeks = weeksData.map((week, idx) => {
      if (idx === 0) return week;
      return {
        ...week,
        days: firstWeek.days.map((day, dayIdx) => ({
          ...day,
          id: Date.now() + idx * 100 + dayIdx,
          topic: week.days[dayIdx]?.topic || ''
        }))
      };
    });
    setWeeksData(newWeeks);
    toast.success('Pattern copied to all weeks!', { style: toastStyle });
  };

  const getDateForDay = (startDate, weekNumber, dayName) => {
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = daysMap.indexOf(dayName);
    
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weekNumber - 1) * 7);
    
    const currentDay = date.getDay();
    const diff = dayIndex - currentDay;
    date.setDate(date.getDate() + diff);
    
    return date;
  };

  const generatePreview = () => {
    if (!formData.courseId || !batchData.startDate) {
      toast.error('Please select course and start date', { style: toastStyle });
      return;
    }
    setPreviewMode(true);
  };

  const handleBatchSubmit = async () => {
    if (!formData.courseId || !batchData.startDate) {
      toast.error('Please fill all required fields', { style: toastStyle });
      return;
    }

    setLoading(true);
    const loadId = toast.loading('Creating batch schedule...', { style: toastStyle });

    try {
      const allSchedules = [];
      const start = new Date(batchData.startDate);
      
      weeksData.forEach((week) => {
        week.days.forEach((dayData, dayIndex) => {
          if (!dayData.enabled || !dayData.topic.trim()) return;
          
          const sessionDate = getDateForDay(start, week.weekNumber, dayData.day);
          
          allSchedules.push({
            title: `Week ${week.weekNumber} - ${dayData.topic}`,
            courseId: formData.courseId,
            weekNumber: week.weekNumber,
            sessionNumber: dayIndex + 1,
            day: dayData.day,
            time: dayData.time,
            duration: dayData.duration,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (batchMode) {
      handleBatchSubmit();
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter schedule title', { style: toastStyle });
      return;
    }

    if (!formData.courseId) {
      toast.error('Please select a course', { style: toastStyle });
      return;
    }

    const finalData = {
      ...formData,
      title: formData.title.trim(),
      topic: formData.topic.trim(),
      duration: parseInt(formData.duration) || 60,
      notifyStudents: formData.notifyStudents
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

  const selectedCourse = courses.find(c => c._id === formData.courseId);

  // Preview Mode
  if (previewMode) {
    const previewData = [];
    const start = new Date(batchData.startDate);
    
    weeksData.forEach((week) => {
      const weekSessions = [];
      week.days.forEach((dayData) => {
        if (!dayData.enabled || !dayData.topic.trim()) return;
        const sessionDate = getDateForDay(start, week.weekNumber, dayData.day);
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
            <span className="stat-value">{batchData.durationWeeks}</span>
            <span className="stat-label">Weeks</span>
          </div>
          <div className="preview-stat">
            <span className="stat-value">{totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
          <div className="preview-stat">
            <span className="stat-value">{Math.round(totalSessions / batchData.durationWeeks)}x</span>
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
      <div className="form-header">
        <h2>
          {isEdit ? <FaCheckCircle /> : batchMode ? <FaCalendarWeek /> : <FaPlus />}
          {isEdit ? ' Edit Schedule' : batchMode ? ' Batch Schedule Creator' : ' Create New Schedule'}
        </h2>
        <button className="btn-back" onClick={onCancel}>
          <FaArrowLeft /> Back
        </button>
      </div>

      {!isEdit && (
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
        {/* Course & Duration Section */}
        <div className="form-section">
          <h3><FaCalendarAlt /> {batchMode ? 'Course & Duration' : 'Basic Information'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Select Course *</label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                required
              >
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
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
                    onChange={(e) => setBatchData({...batchData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Weeks) *</label>
                  <select
                    value={batchData.durationWeeks}
                    onChange={(e) => setBatchData({...batchData, durationWeeks: parseInt(e.target.value)})}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(w => (
                      <option key={w} value={w}>{w} Weeks</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Schedule Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Week 1 - Introduction"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Topic *</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="e.g., React Basics"
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Week-wise Schedule Section - FIXED LAYOUT */}
        {batchMode && (
          <div className="form-section week-schedule-section">
            <div className="section-header-with-action">
              <div className="header-title-group">
                <h3><FaCalendarWeek /> Week-wise Class Schedule</h3>
                <p className="section-description">
                  Configure each week. Click week header to expand/collapse. Add days and set topics.
                </p>
              </div>
              <div className="section-actions">
                <button type="button" className="btn-icon-text" onClick={toggleAllWeeks}>
                  {allExpanded ? <><FaCompress /> Collapse All</> : <><FaExpand /> Expand All</>}
                </button>
                <button 
                  type="button" 
                  className="btn-copy-pattern" 
                  onClick={copyPatternToAllWeeks}
                >
                  <FaCopy /> Copy Week 1 Pattern
                </button>
              </div>
            </div>
            
            <div className="weeks-container">
              {weeksData.map((week, weekIndex) => (
                <div key={week.weekNumber} className={`week-box ${week.isOpen ? 'open' : ''}`}>
                  {/* Week Header */}
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
                          {week.days.filter(d => d.enabled && d.topic.trim()).length} of {week.days.length} configured
                        </span>
                      </div>
                    </div>
                    <div className="week-header-actions">
                      <span className="days-count-badge">
                        {week.days.filter(d => d.enabled).length} days
                      </span>
                      <div className="expand-icon">
                        {week.isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                  </div>

                  {/* Week Content */}
                  {week.isOpen && (
                    <div className="week-content">
                      {/* Days Table */}
                      <div className="days-table">
                        {/* Table Header */}
                        <div className="table-header">
                          <div className="th-status">Status</div>
                          <div className="th-day">Day</div>
                          <div className="th-time">Time</div>
                          <div className="th-duration">Duration</div>
                          <div className="th-type">Type</div>
                          <div className="th-topic">Topic for this Day *</div>
                          <div className="th-delete"></div>
                        </div>

                        {/* Table Body */}
                        <div className="table-body">
                          {week.days.map((dayData) => (
                            <div key={dayData.id} className={`table-row ${!dayData.enabled ? 'disabled' : ''}`}>
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
                                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              
                              <div className="td-time">
                                <select
                                  value={dayData.time}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'time', e.target.value)}
                                  disabled={!dayData.enabled}
                                >
                                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              
                              <div className="td-duration">
                                <select
                                  value={dayData.duration}
                                  onChange={(e) => updateDayField(weekIndex, dayData.id, 'duration', parseInt(e.target.value))}
                                  disabled={!dayData.enabled}
                                >
                                  {[30, 45, 60, 90, 120].map(d => (
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
                                  placeholder={`Enter topic for Week ${week.weekNumber} ${dayData.day}`}
                                  disabled={!dayData.enabled}
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

                      {/* Add Day Button */}
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

        {/* Single Mode Fields */}
        {!batchMode && (
          <>
            <div className="form-section">
              <h3><FaClock /> Schedule Timing</h3>
              <div className="form-grid three-col">
                <div className="form-group">
                  <label>Day *</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    required
                  >
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  >
                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})}
                    min="15"
                    max="180"
                    step="15"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FaVideo /> Class Type</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Class Type *</label>
                  <div className="radio-group">
                    <label className={`radio-card ${formData.type === 'live' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="live"
                        checked={formData.type === 'live'}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      />
                      <span className="radio-icon">🔴</span>
                      <span className="radio-label">Live Class</span>
                    </label>
                    <label className={`radio-card ${formData.type === 'recorded' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="recorded"
                        checked={formData.type === 'recorded'}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      />
                      <span className="radio-icon">📹</span>
                      <span className="radio-label">Recorded</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Settings Section */}
        <div className="form-section">
          <h3><FaPalette /> {batchMode ? 'Instructor & Settings' : 'Settings'}</h3>
          <div className="form-grid">
            {batchMode && (
              <div className="form-group">
                <label>Instructor Name</label>
                <input
                  type="text"
                  value={batchData.instructor}
                  onChange={(e) => setBatchData({...batchData, instructor: e.target.value})}
                  placeholder="e.g., Anas Jutt"
                />
              </div>
            )}
            <div className="form-group">
              <label>Schedule Color</label>
              <div className="color-picker">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-option ${(batchMode ? batchData.color : formData.color) === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => batchMode 
                      ? setBatchData({...batchData, color: c})
                      : setFormData({...formData, color: c})
                    }
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifyStudents}
                  onChange={(e) => setFormData({...formData, notifyStudents: e.target.checked})}
                />
                <span>Notify students via email</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          {batchMode ? (
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
              {loading ? <FaSpinner className="spin" /> : <FaSave />}
              {isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ScheduleCreator;