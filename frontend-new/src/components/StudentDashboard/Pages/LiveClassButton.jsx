import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaVideo, 
  FaSpinner, 
  FaLock, 
  FaClock, 
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import './LiveClassButton.css';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add auth interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const LiveClassButton = ({ schedule }) => {
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (schedule?._id) {
      checkMeetingAvailability();
    }
  }, [schedule]);

  // Countdown timer for when button should appear
  useEffect(() => {
    let interval;
    
    if (schedule && !isVisible && schedule.status !== 'completed') {
      interval = setInterval(() => {
        const now = new Date();
        const classTime = new Date(schedule.calculatedDate);
        const [hours, minutes] = schedule.time.split(':');
        classTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
        
        // Button visible 15 minutes before class
        const availableTime = new Date(classTime.getTime() - 15 * 60000);
        const diff = availableTime - now;

        if (diff <= 0) {
          setIsVisible(true);
          checkMeetingAvailability(); // Refresh to get link
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          
          if (hours > 0) {
            setCountdown(`${hours}h ${mins}m`);
          } else {
            setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [schedule, isVisible]);

  const checkMeetingAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API call to check if meeting is available for this schedule
      const res = await API.get(`/zoom/student-meeting/${schedule._id}`);
      
      if (res.data?.success) {
        setMeetingData(res.data.data);
        setIsVisible(res.data.data.visible || false);
        
        // Check if student already has attendance marked
        if (res.data.data.attendanceStatus) {
          setAttendanceMarked(true);
        }
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.log('Meeting not available yet:', err.message);
      setIsVisible(false);
      // Don't show error - this is expected before class time
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!meetingData?.joinUrl) {
      toast.error('Meeting link not available. Please try again.');
      return;
    }

    try {
      // First, mark attendance attempt
      await markAttendanceAttempt();
      
      // Open Zoom in new tab
      window.open(meetingData.joinUrl, '_blank', 'noopener,noreferrer');
      
      toast.success('Opening Zoom meeting...', { duration: 3000 });
      
      // Start polling for attendance updates
      startAttendancePolling();
      
    } catch (err) {
      console.error('Join class error:', err);
      // Still open Zoom even if attendance marking fails
      window.open(meetingData.joinUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const markAttendanceAttempt = async () => {
    try {
      const res = await API.post('/attendance/mark-attempt', {
        scheduleId: schedule._id,
        courseId: schedule.courseId?._id || schedule.courseId,
        action: 'join_clicked'
      });
      
      if (res.data?.success) {
        console.log('Attendance attempt marked');
      }
    } catch (err) {
      console.error('Mark attendance error:', err);
      // Non-critical error, don't stop user from joining
    }
  };

  const startAttendancePolling = () => {
    // Poll every 30 seconds to check attendance status updates from webhook
    const pollInterval = setInterval(async () => {
      try {
        const res = await API.get(`/attendance/status/${schedule._id}`);
        if (res.data?.data?.status) {
          const status = res.data.data.status;
          if (status === 'present' || status === 'late') {
            setAttendanceMarked(true);
            clearInterval(pollInterval);
            toast.success(`Attendance marked: ${status}`, { duration: 5000 });
          }
        }
      } catch (err) {
        console.log('Polling error:', err);
      }
    }, 30000); // Every 30 seconds

    // Stop polling after class duration + 10 minutes
    const duration = (schedule.duration || 60) + 10;
    setTimeout(() => clearInterval(pollInterval), duration * 60000);
  };

  // Loading state
  if (loading) {
    return (
      <button className="live-class-btn loading" disabled>
        <FaSpinner className="spin" /> Checking...
      </button>
    );
  }

  // Class is completed - show completed status
  if (schedule.status === 'completed') {
    return (
      <button className="live-class-btn completed" disabled>
        <FaCheckCircle /> Class Completed
        {attendanceMarked && <span style={{ fontSize: '11px', marginLeft: '5px' }}>(Attended)</span>}
      </button>
    );
  }

  // Link not visible yet - show countdown
  if (!isVisible) {
    return (
      <button className="live-class-btn locked" disabled>
        <FaLock /> Available in {countdown || 'calculating...'}
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <button className="live-class-btn locked" onClick={checkMeetingAvailability}>
        <FaExclamationTriangle /> Retry
      </button>
    );
  }

  // Class is live or about to start - show join button
  const isLive = meetingData?.status === 'live' || meetingData?.status === 'started';
  
  return (
    <button 
      className={`live-class-btn ${isLive ? 'live' : 'ready'}`}
      onClick={handleJoinClass}
    >
      <FaVideo />
      {isLive ? 'Join Live Class Now' : 'Enter Class Room'}
      {meetingData?.password && (
        <span className="password-hint">Pass: {meetingData.password}</span>
      )}
    </button>
  );
};

export default LiveClassButton;