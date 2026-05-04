import React, { useState, useEffect, useRef } from 'react';
import { Coffee, ArrowLeft, Clock, Music, BookOpen, Heart, Volume2, Moon, Sun, Wind, BarChart3, Calendar, TrendingUp, Bell, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import './StudyBreak.css';

const StudyBreak = ({ onNavigate, studentName }) => {
  // Timer State
  const [timer, setTimer] = useState(300); // 5 minutes default (300 seconds)
  const [isRunning, setIsRunning] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('stretch');
  const [selectedDuration, setSelectedDuration] = useState(5); // minutes
  
  // Break History State
  const [breakHistory, setBreakHistory] = useState(() => {
    const saved = localStorage.getItem('breakHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState('timer');
  const audioRef = useRef(null);

  // Timer duration options (in minutes)
  const durationOptions = [5, 10, 15, 20, 30];

  // Save break when timer completes
  const saveBreakRecord = (duration) => {
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: duration,
      activity: selectedActivity,
      timestamp: new Date().getTime()
    };
    const updatedHistory = [newRecord, ...breakHistory];
    setBreakHistory(updatedHistory);
    localStorage.setItem('breakHistory', JSON.stringify(updatedHistory));
  };

  // Play continuous alarm sound
  const playAlarmSound = () => {
    // Create audio context for web audio API (works on Railway)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    let oscillator = null;
    let gainNode = null;
    let isPlaying = true;
    
    const startAlarm = () => {
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Create beeping effect (pause and resume)
      const beepInterval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(beepInterval);
          return;
        }
        gainNode.gain.value = 0.3;
        setTimeout(() => {
          if (isPlaying) gainNode.gain.value = 0;
        }, 300);
      }, 600);
      
      return { oscillator, gainNode, beepInterval };
    };
    
    const alarm = startAlarm();
    
    return () => {
      isPlaying = false;
      if (alarm.oscillator) {
        try {
          alarm.oscillator.stop();
        } catch (e) {}
      }
      if (alarm.beepInterval) clearInterval(alarm.beepInterval);
      audioCtx.close();
    };
  };

  // Show custom popup with continuous alarm
  const showBreakEndPopup = (duration) => {
    let stopAlarm = null;
    
    Swal.fire({
      title: '⏰ Break Time Over!',
      html: `
        <div style="text-align: center; padding: 10px;">
          <div style="background: linear-gradient(135deg, #000B29 0%, #001a4d 100%); padding: 20px; border-radius: 16px; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">☕</div>
            <p style="color: white; font-size: 18px; font-weight: 600; margin: 0;">Your ${duration}-minute break has ended!</p>
          </div>
          <p style="color: #374151; margin-bottom: 10px;">Ready to continue learning?</p>
          <div style="background: #f0fdf4; padding: 12px; border-radius: 12px; margin-top: 15px;">
            <p style="color: #166534; font-size: 14px; margin: 0;">🎯 "Small breaks lead to big productivity gains!"</p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: '✅ Resume Learning',
      confirmButtonColor: '#000B29',
      showCancelButton: true,
      cancelButtonText: '⏱️ +5 More Minutes',
      cancelButtonColor: '#F59E0B',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: true,
      didOpen: () => {
        // Start alarm sound when popup opens
        stopAlarm = playAlarmSound();
      },
      willClose: () => {
        // Stop alarm when popup closes
        if (stopAlarm) stopAlarm();
      }
    }).then((result) => {
      if (stopAlarm) stopAlarm();
      
      if (result.isConfirmed) {
        // Resume learning - just close popup
        console.log('Student resumed learning');
      } else if (result.isDismissed) {
        // Add 5 more minutes
        const newDuration = selectedDuration + 5;
        setSelectedDuration(newDuration);
        setTimer(newDuration * 60);
        setIsRunning(true);
        
        Swal.fire({
          title: '⏱️ +5 Minutes Added!',
          text: `Your break has been extended by 5 minutes. New break time: ${newDuration} minutes.`,
          icon: 'success',
          confirmButtonText: 'Continue Break',
          confirmButtonColor: '#10B981',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      // Save break record
      saveBreakRecord(selectedDuration);
      // Show custom popup with alarm
      showBreakEndPopup(selectedDuration);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Set custom duration
  const setCustomDuration = (minutes) => {
    setSelectedDuration(minutes);
    setTimer(minutes * 60);
    setIsRunning(false);
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimer(selectedDuration * 60);
  };

  const activities = [
    { id: 'stretch', icon: Sun, title: 'Stretch', desc: 'Stand up and stretch your body', color: '#F59E0B' },
    { id: 'hydrate', icon: Wind, title: 'Hydrate', desc: 'Drink a glass of water', color: '#10B981' },
    { id: 'breathe', icon: Moon, title: 'Deep Breath', desc: 'Take 5 deep breaths', color: '#8B5CF6' },
    { id: 'walk', icon: Heart, title: 'Quick Walk', desc: 'Walk around the room', color: '#EF4444' }
  ];

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  // Calculate statistics
  const totalBreaksToday = breakHistory.filter(b => {
    const today = new Date().toDateString();
    return new Date(b.date).toDateString() === today;
  }).length;

  const totalMinutesToday = breakHistory.filter(b => {
    const today = new Date().toDateString();
    return new Date(b.date).toDateString() === today;
  }).reduce((sum, b) => sum + b.duration, 0);

  const totalBreaksThisWeek = breakHistory.filter(b => {
    const breakDate = new Date(b.date);
    const today = new Date();
    const weekAgo = new Date(today.setDate(today.getDate() - 7));
    return breakDate >= weekAgo;
  }).length;

  const totalMinutesThisWeek = breakHistory.filter(b => {
    const breakDate = new Date(b.date);
    const today = new Date();
    const weekAgo = new Date(today.setDate(today.getDate() - 7));
    return breakDate >= weekAgo;
  }).reduce((sum, b) => sum + b.duration, 0);

  const totalBreaksAllTime = breakHistory.length;
  const totalMinutesAllTime = breakHistory.reduce((sum, b) => sum + b.duration, 0);

  return (
    <div className="studybreak-container">
      <div className="studybreak-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1>☕ Study Break</h1>
      </div>

      <div className="studybreak-tabs">
        <button className={`tab-btn ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
          <Clock size={18} /> Timer
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <BarChart3 size={18} /> Break History
        </button>
      </div>

      {activeTab === 'timer' ? (
        <div className="studybreak-content">
          {/* Duration Selector */}
          <div className="duration-selector">
            <label>Select Break Duration:</label>
            <div className="duration-buttons">
              {durationOptions.map(min => (
                <button
                  key={min}
                  className={`duration-btn ${selectedDuration === min ? 'active' : ''}`}
                  onClick={() => setCustomDuration(min)}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {/* Timer Card */}
          <div className="timer-card">
            <div className="timer-display">{formatTime(timer)}</div>
            <div className="timer-controls">
              {!isRunning ? (
                <button className="timer-btn start" onClick={startTimer}>Start Break</button>
              ) : (
                <button className="timer-btn pause" onClick={pauseTimer}>Pause</button>
              )}
              <button className="timer-btn reset" onClick={resetTimer}>Reset</button>
            </div>
          </div>

          {/* Activities Section */}
          <div className="activities-section">
            <h3>Recommended Activities</h3>
            <div className="activities-grid">
              {activities.map(activity => (
                <div 
                  key={activity.id} 
                  className={`activity-card ${selectedActivity === activity.id ? 'active' : ''}`}
                  onClick={() => setSelectedActivity(activity.id)}
                  style={{ borderColor: selectedActivity === activity.id ? activity.color : '#e5e7eb' }}
                >
                  <div className="activity-icon" style={{ background: `${activity.color}15`, color: activity.color }}>
                    <activity.icon size={28} />
                  </div>
                  <h4>{activity.title}</h4>
                  <p>{activity.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Break Summary */}
          <div className="today-summary">
            <h3>📊 Today's Breaks</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-value">{totalBreaksToday}</span>
                <span className="stat-label">Breaks Taken</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{totalMinutesToday}</span>
                <span className="stat-label">Minutes</span>
              </div>
            </div>
          </div>

          {/* Motivation Card */}
          <div className="motivation-card">
            <p>"Taking breaks improves focus and productivity. You're doing great!"</p>
            <span>- SkillsMind Team</span>
          </div>
        </div>
      ) : (
        <div className="history-content">
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={24} color="#10B981" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalBreaksToday}</span>
                <span className="stat-text">Breaks Today</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><TrendingUp size={24} color="#F59E0B" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalBreaksThisWeek}</span>
                <span className="stat-text">Breaks This Week</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Coffee size={24} color="#8B5CF6" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalBreaksAllTime}</span>
                <span className="stat-text">Total Breaks</span>
              </div>
            </div>
          </div>

          {/* Minutes Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Clock size={24} color="#10B981" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalMinutesToday}</span>
                <span className="stat-text">Minutes Today</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Clock size={24} color="#F59E0B" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalMinutesThisWeek}</span>
                <span className="stat-text">Minutes This Week</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Clock size={24} color="#8B5CF6" /></div>
              <div className="stat-info">
                <span className="stat-number">{totalMinutesAllTime}</span>
                <span className="stat-text">Total Minutes</span>
              </div>
            </div>
          </div>

          {/* Break History List */}
          <div className="history-list">
            <h3>📋 Recent Breaks</h3>
            {breakHistory.length === 0 ? (
              <div className="empty-history">
                <p>No breaks recorded yet. Take your first break!</p>
              </div>
            ) : (
              breakHistory.slice(0, 10).map(record => (
                <div key={record.id} className="history-item">
                  <div className="history-icon">
                    <Coffee size={20} color="#F59E0B" />
                  </div>
                  <div className="history-details">
                    <div className="history-date">
                      {new Date(record.date).toLocaleDateString('en-PK', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="history-meta">
                      <span className="history-duration">{record.duration} minutes</span>
                      <span className="history-activity">• {record.activity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear History Button */}
          {breakHistory.length > 0 && (
            <button 
              className="clear-history-btn"
              onClick={() => {
                Swal.fire({
                  title: 'Clear Break History?',
                  text: 'This action cannot be undone. All your break records will be deleted.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#dc2626',
                  cancelButtonColor: '#6b7280',
                  confirmButtonText: 'Yes, clear it!',
                  cancelButtonText: 'Cancel'
                }).then((result) => {
                  if (result.isConfirmed) {
                    setBreakHistory([]);
                    localStorage.removeItem('breakHistory');
                    Swal.fire({
                      title: 'Cleared!',
                      text: 'Your break history has been cleared.',
                      icon: 'success',
                      confirmButtonColor: '#10B981',
                      timer: 1500
                    });
                  }
                });
              }}
            >
              Clear History
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyBreak;