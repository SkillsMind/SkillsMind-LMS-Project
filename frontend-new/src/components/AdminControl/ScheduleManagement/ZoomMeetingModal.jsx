import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaVideo, FaSpinner, FaPlay, FaStop, FaCopy, 
  FaExternalLinkAlt, FaUsers, FaClock, FaCheckCircle,
  FaTimes, FaVideoSlash, FaDoorOpen, FaLink, 
  FaCalendarCheck, FaUserFriends, FaExclamationTriangle
} from 'react-icons/fa';
import './ZoomMeetingModal.css';

const ZoomMeetingModal = ({ schedule, onClose }) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (schedule) {
      checkExistingMeeting();
    }
  }, [schedule]);

  const checkExistingMeeting = async () => {
    try {
      setChecking(true);
      // Check from database via API
      const res = await adminAPI.getZoomMeetingDetails(schedule._id);
      if (res.data.success && res.data.data.meeting) {
        const meetingData = res.data.data.meeting;
        setMeeting({
          _id: meetingData._id,
          joinUrl: meetingData.joinUrl,
          startUrl: meetingData.startUrl,
          password: meetingData.password,
          status: meetingData.status,
          zoomMeetingId: meetingData.zoomMeetingId
        });
      }
    } catch (err) {
      // No meeting exists yet, that's fine
      console.log('No existing meeting found');
      setMeeting(null);
    } finally {
      setChecking(false);
    }
  };

  const createMeeting = async () => {
    setCreating(true);
    try {
      const res = await adminAPI.createZoomMeeting(schedule._id);
      if (res.data.success) {
        // Check if it was already existing
        if (res.data.message === 'Meeting already exists') {
          toast.success('ℹ️ Meeting already exists! Using existing meeting.', {
            style: {
              border: '1px solid #3b82f6',
              padding: '16px',
              color: '#3b82f6',
              background: '#ffffff',
              borderRadius: '8px'
            }
          });
        } else {
          toast.success('✅ Zoom meeting created successfully!', {
            style: {
              border: '1px solid #000B29',
              padding: '16px',
              color: '#000B29',
              background: '#ffffff',
              borderRadius: '8px'
            }
          });
        }
        
        const meetingData = res.data.data.meeting;
        setMeeting({
          _id: meetingData._id,
          joinUrl: res.data.data.joinUrl,
          startUrl: res.data.data.startUrl,
          password: meetingData.password,
          status: meetingData.status,
          zoomMeetingId: meetingData.zoomMeetingId
        });
      }
    } catch (err) {
      console.error('Create meeting error:', err);
      toast.error(err.response?.data?.error || '❌ Failed to create meeting', {
        style: {
          border: '1px solid #dc2626',
          padding: '16px',
          color: '#dc2626',
          background: '#ffffff',
          borderRadius: '8px'
        }
      });
    } finally {
      setCreating(false);
    }
  };

  const startMeeting = async () => {
    if (!meeting?._id) {
      toast.error('Meeting not found');
      return;
    }
    
    setStarting(true);
    try {
      const res = await adminAPI.startZoomMeeting(meeting._id);
      if (res.data.success) {
        // Open Zoom in new tab immediately
        window.open(res.data.data.startUrl, '_blank');
        
        setMeeting(prev => ({ ...prev, status: 'live' }));
        
        toast.success('🚀 Meeting started! Opening Zoom...', {
          style: {
            border: '1px solid #16a34a',
            padding: '16px',
            color: '#16a34a',
            background: '#ffffff',
            borderRadius: '8px'
          }
        });
      }
    } catch (err) {
      console.error('Start meeting error:', err);
      toast.error('❌ Failed to start meeting', {
        style: {
          border: '1px solid #dc2626',
          padding: '16px',
          color: '#dc2626',
          background: '#ffffff',
          borderRadius: '8px'
        }
      });
    } finally {
      setStarting(false);
    }
  };

  const endMeeting = async () => {
    if (!meeting?._id) return;
    
    if (!window.confirm('Are you sure you want to end this meeting?')) return;
    
    setEnding(true);
    try {
      const res = await adminAPI.endZoomMeeting(meeting._id);
      if (res.data.success) {
        setMeeting(prev => ({ ...prev, status: 'ended' }));
        toast.success('✅ Meeting ended successfully', {
          style: {
            border: '1px solid #000B29',
            padding: '16px',
            color: '#000B29',
            background: '#ffffff',
            borderRadius: '8px'
          }
        });
      }
    } catch (err) {
      console.error('End meeting error:', err);
      toast.error('❌ Failed to end meeting');
    } finally {
      setEnding(false);
    }
  };

  const copyJoinLink = () => {
    if (meeting?.joinUrl) {
      navigator.clipboard.writeText(meeting.joinUrl);
      toast.success('📋 Join link copied!', {
        style: {
          border: '1px solid #000B29',
          padding: '12px',
          color: '#000B29',
          background: '#ffffff',
          borderRadius: '6px'
        }
      });
    }
  };

  const copyPassword = () => {
    if (meeting?.password) {
      navigator.clipboard.writeText(meeting.password);
      toast.success('📋 Password copied!', {
        style: {
          border: '1px solid #000B29',
          padding: '12px',
          color: '#000B29',
          background: '#ffffff',
          borderRadius: '6px'
        }
      });
    }
  };

  if (!schedule) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return '#10b981';
      case 'waiting': return '#f59e0b';
      case 'ended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'live': return '● LIVE NOW';
      case 'waiting': return '⏳ WAITING';
      case 'ended': return '✓ ENDED';
      default: return '⏳ WAITING';
    }
  };

  return (
    <div className="zoom-modal-overlay" onClick={onClose}>
      <div className="zoom-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="zoom-modal-header">
          <div className="zoom-header-left">
            <div className="zoom-icon">
              <FaVideo />
            </div>
            <div className="zoom-title-group">
              <h3>Zoom Live Class</h3>
              <span className="zoom-subtitle">{schedule.title || schedule.topic}</span>
            </div>
          </div>
          <button className="zoom-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="zoom-tabs">
          <button 
            className={`zoom-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FaVideo /> Meeting Details
          </button>
          <button 
            className={`zoom-tab ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            <FaUsers /> Participants ({participants.length})
          </button>
        </div>

        {/* Content */}
        <div className="zoom-modal-body">
          {activeTab === 'details' && (
            <div className="zoom-details-content">
              {/* Schedule Info Card */}
              <div className="zoom-info-card">
                <div className="zoom-info-header">
                  <FaCalendarCheck className="info-icon" />
                  <div className="zoom-info-text">
                    <h4>{schedule.title || schedule.topic}</h4>
                    <p>{schedule.courseId?.title || 'Course'}</p>
                  </div>
                </div>
                <div className="zoom-time-badges">
                  <span className="time-badge primary">
                    <FaClock /> {schedule.day}, {schedule.time}
                  </span>
                  <span className="time-badge secondary">
                    {schedule.duration} minutes
                  </span>
                </div>
              </div>

              {/* Checking State */}
              {checking && (
                <div className="zoom-loading-state">
                  <FaSpinner className="spin" />
                  <p>Checking meeting status...</p>
                </div>
              )}

              {/* No Meeting State */}
              {!checking && !meeting && (
                <div className="zoom-empty-state">
                  <div className="empty-icon">
                    <FaVideoSlash />
                  </div>
                  <h4>No Meeting Created</h4>
                  <p>This class doesn't have a Zoom meeting yet. Create one to allow students to join.</p>
                  <button 
                    className="btn-create-zoom"
                    onClick={createMeeting}
                    disabled={creating}
                  >
                    {creating ? (
                      <><FaSpinner className="spin" /> Creating...</>
                    ) : (
                      <><FaVideo /> Create Zoom Meeting</>
                    )}
                  </button>
                </div>
              )}

              {/* Meeting Active State */}
              {!checking && meeting && (
                <div className="zoom-meeting-active">
                  {/* Status Bar */}
                  <div className="zoom-status-bar" style={{ backgroundColor: getStatusColor(meeting.status) + '20' }}>
                    <span className="status-indicator" style={{ backgroundColor: getStatusColor(meeting.status) }}></span>
                    <span className="status-text" style={{ color: getStatusColor(meeting.status) }}>
                      {getStatusText(meeting.status)}
                    </span>
                  </div>

                  {/* Meeting Already Exists Warning */}
                  {meeting.status === 'waiting' && (
                    <div style={{ 
                      background: '#dbeafe', 
                      border: '1px solid #3b82f6', 
                      padding: '12px', 
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#1e40af'
                    }}>
                      <FaExclamationTriangle />
                      <span>Meeting already exists. You can start it when ready.</span>
                    </div>
                  )}

                  {/* Meeting Links */}
                  <div className="zoom-links-section">
                    {/* Student Join Link */}
                    <div className="zoom-link-card">
                      <div className="link-card-header">
                        <FaUserFriends className="link-icon student" />
                        <div className="link-info">
                          <label>Student Join Link</label>
                          <small>Share this with students</small>
                        </div>
                      </div>
                      <div className="link-input-group">
                        <input 
                          type="text" 
                          value={meeting.joinUrl || ''} 
                          readOnly 
                          placeholder="No link available"
                        />
                        <button 
                          className="btn-copy"
                          onClick={copyJoinLink}
                          disabled={!meeting.joinUrl}
                        >
                          <FaCopy />
                        </button>
                        {meeting.joinUrl && (
                          <a 
                            href={meeting.joinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-open"
                          >
                            <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                      <small className="link-hint">Students can join 15 minutes before class starts</small>
                    </div>

                    {/* Meeting Password */}
                    {meeting.password && (
                      <div className="zoom-link-card">
                        <div className="link-card-header">
                          <FaLink className="link-icon password" />
                          <div className="link-info">
                            <label>Meeting Password</label>
                            <small>Required to join the meeting</small>
                          </div>
                        </div>
                        <div className="link-input-group">
                          <input 
                            type="text" 
                            value={meeting.password} 
                            readOnly 
                          />
                          <button className="btn-copy" onClick={copyPassword}>
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Host Start Link */}
                    {meeting.startUrl && (
                      <div className="zoom-link-card host">
                        <div className="link-card-header">
                          <FaDoorOpen className="link-icon host" />
                          <div className="link-info">
                            <label>Host Start Link</label>
                            <small>Only for you - Start the meeting as host</small>
                          </div>
                        </div>
                        <div className="link-input-group">
                          <input 
                            type="text" 
                            value={meeting.startUrl} 
                            readOnly 
                          />
                          <button 
                            className="btn-start-host"
                            onClick={() => window.open(meeting.startUrl, '_blank')}
                          >
                            <FaPlay /> Start
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="zoom-action-buttons">
                    {meeting.status === 'waiting' && (
                      <button 
                        className="btn-action start"
                        onClick={startMeeting}
                        disabled={starting}
                      >
                        {starting ? (
                          <><FaSpinner className="spin" /> Starting...</>
                        ) : (
                          <><FaPlay /> Start Live Class</>
                        )}
                      </button>
                    )}
                    
                    {meeting.status === 'live' && (
                      <>
                        <button 
                          className="btn-action rejoin"
                          onClick={() => meeting.startUrl && window.open(meeting.startUrl, '_blank')}
                        >
                          <FaDoorOpen /> Rejoin as Host
                        </button>
                        <button 
                          className="btn-action end"
                          onClick={endMeeting}
                          disabled={ending}
                        >
                          {ending ? (
                            <><FaSpinner className="spin" /> Ending...</>
                          ) : (
                            <><FaStop /> End Class</>
                          )}
                        </button>
                      </>
                    )}

                    {meeting.status === 'ended' && (
                      <div className="meeting-ended-message">
                        <FaCheckCircle /> This class has ended
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="zoom-participants-content">
              <div className="participants-header">
                <h4><FaUsers /> Live Participants</h4>
                <span className="participant-count">{participants.length} online</span>
              </div>
              
              {participants.length === 0 ? (
                <div className="no-participants">
                  <div className="empty-icon">
                    <FaUsers />
                  </div>
                  <h4>No Participants Yet</h4>
                  <p>Start the class to see attendees here</p>
                </div>
              ) : (
                <ul className="participants-list">
                  {participants.map((p, idx) => (
                    <li key={idx} className="participant-item">
                      <div className="participant-avatar" style={{background: `hsl(${(idx * 50) % 360}, 70%, 45%)`}}>
                        {p.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="participant-info">
                        <span className="participant-name">{p.name}</span>
                        <span className="join-time">Joined: {p.joinTime}</span>
                      </div>
                      <span className={`participant-status ${p.status}`}>
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoomMeetingModal;