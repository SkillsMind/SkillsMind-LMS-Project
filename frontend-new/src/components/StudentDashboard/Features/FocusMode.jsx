import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Target } from 'lucide-react';
import './FocusMode.css';

const FocusMode = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro');
  const [sessions, setSessions] = useState(3);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setSessions(s => s + 1);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modes = {
    pomodoro: { time: 25 * 60, label: 'Deep Focus', color: '#DC2626' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: '#10B981' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: '#3B82F6' }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
  };

  return (
    <div className="focus-mode-container">
      <div className="feature-header">
        <h2>🎯 Deep Focus Mode</h2>
        <p>Gamified Pomodoro timer with distraction blocking</p>
      </div>

      <div className="focus-interface">
        <div className="mode-selector">
          {Object.entries(modes).map(([key, config]) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => switchMode(key)}
              style={{ '--mode-color': config.color }}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="timer-display">
          <div className="timer-circle" style={{ '--progress': (1 - timeLeft / modes[mode].time) * 360 }}>
            <div className="timer-inner">
              <span className="time-text">{formatTime(timeLeft)}</span>
              <span className="session-count">Session #{sessions}</span>
            </div>
          </div>
        </div>

        <div className="timer-controls">
          <button 
            className="control-btn primary"
            onClick={() => setIsActive(!isActive)}
            style={{ background: modes[mode].color }}
          >
            {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            {isActive ? 'PAUSE' : 'START'}
          </button>
          
          <button className="control-btn secondary" onClick={() => switchMode(mode)}>
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="focus-stats">
          <div className="stat-card">
            <Brain className="stat-icon" />
            <div>
              <span className="stat-value">12.5h</span>
              <span className="stat-label">Deep Work</span>
            </div>
          </div>
          <div className="stat-card">
            <Target className="stat-icon" />
            <div>
              <span className="stat-value">89%</span>
              <span className="stat-label">Focus Score</span>
            </div>
          </div>
          <div className="stat-card">
            <Coffee className="stat-icon" />
            <div>
              <span className="stat-value">{sessions}</span>
              <span className="stat-label">Sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;